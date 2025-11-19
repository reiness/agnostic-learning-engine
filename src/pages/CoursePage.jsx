import React, { useState, useEffect, useRef } from 'react'; // <-- IMPORT 'useRef'
import { useParams, useNavigate } from 'react-router-dom';
import { doc, getDoc, collection, getDocs, query, updateDoc, setDoc, onSnapshot } from 'firebase/firestore';
import { db, deleteCourse, auth } from '../firebase.js';
import { useAuthState } from 'react-firebase-hooks/auth';
import ReactMarkdown from 'react-markdown';
import MainLayout from '../components/MainLayout';
import Spinner from '../components/Spinner';
import Icon from '../components/Icon';
import AnimatedPage from '../components/AnimatedPage';
import ConfirmationModal from '../components/ConfirmationModal';
import { Button } from '@/components/ui/button';
import { logActivity } from '../services/activityService';

const CoursePage = () => {
const { courseId } = useParams();
const [user] = useAuthState(auth);
const navigate = useNavigate();
const [courseTitle, setCourseTitle] = useState('');
const [modules, setModules] = useState([]);
const [selectedModule, setSelectedModule] = useState(null);
const [loadingModuleId, setLoadingModuleId] = useState(null); // This state controls the spinner UI
const [isCourseLoading, setIsCourseLoading] = useState(true);
const [isFlashcardLoading, setIsFlashcardLoading] = useState(false);
const [flashcards, setFlashcards] = useState([]);
  const loadingModuleIdRef = useRef(null); // <-- ADD THIS REF
  const [showDeleteModal, setShowDeleteModal] = useState(false);
 
  useEffect(() => {
    if (!courseId) return;

    // 1. Fetch the static course title
    const fetchCourseTitle = async () => {
      const docRef = doc(db, "courses", courseId);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        setCourseTitle(docSnap.data().title);
      }
    };
    fetchCourseTitle();

    // 2. Set up a LIVE LISTENER for the modules
    const modulesQuery = query(collection(db, "courses", courseId, "modules"));

    const unsubscribe = onSnapshot(modulesQuery, (snapshot) => {
      const fetchedModules = [];
      snapshot.forEach((doc) => {
        fetchedModules.push({ id: doc.id, ...doc.data() });
      });

      // Sort by day number
      fetchedModules.sort((a, b) => parseInt(a.id) - parseInt(b.id));
      setModules(fetchedModules);

      // Check if the module we are loading is now complete
      // --- THIS IS THE FIX ---
      if (loadingModuleIdRef.current) { // <-- CHECK THE REF (NOT STALE)
        const newlyLoadedModule = fetchedModules.find(m => m.id === loadingModuleIdRef.current); // <-- FIND BY REF
        
        // If the loaded module has its material, stop the spinner
        if (newlyLoadedModule && newlyLoadedModule.learningMaterial) {
          setLoadingModuleId(null); // <-- STOP SPINNER STATE
          loadingModuleIdRef.current = null; // <-- RESET THE REF
          // Also update the selected view to show it
          setSelectedModule(newlyLoadedModule);
        }
      }
      setIsCourseLoading(false); // Course data is loaded
    });

    // 3. Set the default selected module
    setSelectedModule({
      title: "Select a module",
      learningMaterial: "Please select a module from the list to view its content."
    });

    // 4. Cleanup the listener when the page is closed
    return () => unsubscribe();

  }, [courseId]); // We removed 'selectedModule' from the dependency array

  useEffect(() => {
    if (!user) return;

    const notifQuery = query(collection(db, `users/${user.uid}/notifications`));
    const unsubscribe = onSnapshot(notifQuery, (snapshot) => {
      snapshot.docChanges().forEach((change) => {
        if (change.type === "added" || change.type === "modified") {
          const notif = change.doc.data();
          if (notif.status === 'failed' && notif.relatedDocId === loadingModuleIdRef.current) {
            setLoadingModuleId(null);
            loadingModuleIdRef.current = null;
            alert(`Failed to generate module: ${notif.message}`);
          }
        }
      });
    });

    return () => unsubscribe();
  }, [user]);

  useEffect(() => {
    // Don't listen if no module is selected or if we don't have IDs
    if (!selectedModule || !selectedModule.id || !courseId) {
      setFlashcards([]); // Clear flashcards if no module selected
      return;
    }

    // Path to the flashcard document for the current module
    const flashcardDocRef = doc(db, "courses", courseId, "flashcards", selectedModule.id);

    // Set up the LIVE LISTENER
    const unsubscribe = onSnapshot(flashcardDocRef, (docSnap) => {
      if (docSnap.exists()) {
        // Flashcards found, update the state
        setFlashcards(docSnap.data().cards || []);
        setIsFlashcardLoading(false); // Stop loading when flashcards are fetched
      } else {
        // No flashcards found for this module yet
        setFlashcards([]);
      }
    });

    // Cleanup the listener when the selected module changes or the page unmounts
    return () => unsubscribe();

  }, [selectedModule, courseId]); // Re-run when selectedModule or courseId changes

  const handleGenerateFlashcards = async () => {
    // Basic checks first
    if (!user || !selectedModule || !selectedModule.learningMaterial) {
      alert("Cannot generate flashcards. Make sure the lesson is loaded and you are logged in.");
      return;
    }
    // Check if flashcards already exist (via the listener state)
    if (flashcards.length > 0) {
        alert("Flashcards have already been generated for this module.");
        return;
    }
    
    setIsFlashcardLoading(true); // Start visual loading state

    try {
      // "Fire and Forget" call to the background function
      const token = await user.getIdToken();
      await fetch("/.netlify/functions/generateFlashcards-background", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          lessonMaterial: selectedModule.learningMaterial,
          courseId: courseId,
          moduleId: selectedModule.id,
          userId: user.uid,
          moduleTitle: selectedModule.title
        })
      });
      
      // No need to setFlashcards here - the listener will do it.
      // We leave isFlashcardLoading as true - the listener should ideally turn it off,
      // but for now, we rely on the button disabling.
      alert("Flashcard generation started! We'll notify you when they're ready.");

    } catch (error) {
      console.error('Error triggering flashcard generation:', error);
      alert("Error: Could not start flashcard generation. Please try again.");
      setIsFlashcardLoading(false); // Stop loading on error
    }
    // We keep the button disabled while isFlashcardLoading is true
    // or if flashcards.length > 0
  };
 
  const handleMarkAsComplete = async () => {
    if (!selectedModule) return;
    try {
      const moduleRef = doc(db, "courses", courseId, "modules", selectedModule.id);
      await updateDoc(moduleRef, { isCompleted: true });
      const updatedModules = modules.map(m => m.id === selectedModule.id ? { ...m, isCompleted: true } : m);
      setModules(updatedModules);
      setSelectedModule({ ...selectedModule, isCompleted: true });
      await logActivity(user.uid, user.email, 'complete_module', { courseId, moduleId: selectedModule.id });
      alert("Module marked as complete!");
    } catch (error) {
      console.error("Error marking module as complete:", error);
    }
  };
 
  const handleModuleClick = async (module, index) => {
    // Check if the module is locked
    if (index > 0 && !modules[index - 1].isCompleted) {
      alert("You must complete the previous lesson first.");
      return;
    }
    setSelectedModule(module);

    // 1. Check if material is already loaded
    if (module.learningMaterial && module.learningMaterial !== "") {
      // It's already here, just display it
      return;
    }
    
    // 2. Check if it's already being generated
    if (loadingModuleIdRef.current) {
      // A lesson is already being generated, don't send another request
      return;
    }

    setLoadingModuleId(module.id); // <-- SET STATE (for UI)
    loadingModuleIdRef.current = module.id; // <-- SET REF (for listener)


    // 3. If no user, stop.
    if (!user) {
      alert("You must be logged in to generate lessons.");
      return;
    }

    loadingModuleIdRef.current = module.id;

    // 4. "Fire and Forget" call to our new background function
    try {
      const token = await user.getIdToken();
      await fetch("/.netlify/functions/generateLesson-background", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          courseId: courseId,
          moduleId: module.id,
          userId: user.uid,
          moduleTitle: module.title,
          moduleDescription: module.description
        })
      });
      // NOTE: We do not 'await' a response or 'return data'
      // We just trigger it and let the function run in the background.
      
    } catch (error) {
      console.error("Error triggering lesson generation:", error);
      setLoadingModuleId(null); // Stop spinner on error
      loadingModuleIdRef.current = null; // Reset ref on error
    }
    // We leave 'loadingModuleIdRef.current' set here.
    // The UI will update when the *live listener* sees the data.
  };
 
  const sidebarContent = (
    <div>
      <h2 className="text-2xl font-bold mb-6 text-foreground">{courseTitle}</h2>
      <nav className="space-y-3">
        {modules.map((module, index) => {
          const isLocked = index > 0 && !modules[index - 1].isCompleted;
          return (
            <Button
              key={module.id}
              onClick={() => handleModuleClick(module, index)}
              variant={selectedModule?.id === module.id ? 'default' : 'ghost'}
              className="w-full justify-start text-wrap break-words h-auto py-2 text-left"
              disabled={isLocked}
            >
              <span className="text-wrap break-words">Day {module.id}: {module.title}</span>
              {module.isCompleted && <Icon name="check" className="text-green-400 flex-shrink-0 ml-2" />}
              {isLocked && <Icon name="lock" className="text-red-400 flex-shrink-0 ml-2" />}
            </Button>
          );
        })}
      </nav>
    </div>
  );
 
  return (
    <AnimatedPage>
      <MainLayout sidebarContent={sidebarContent}>
        {isCourseLoading ? (
          <div className="text-center">
            <Spinner />
            <p className="mt-4 text-muted-foreground">Loading course...</p>
          </div>
        ) : (
          <div className="bg-card p-8 rounded-xl shadow-2xl">
            <div className="flex justify-between items-start mb-8">
              <div>
                <h2 className="text-3xl font-bold text-foreground mb-2">{courseTitle}</h2>
                {modules.length > 0 && (
                  <div className="w-full bg-muted rounded-full h-2.5">
                    <div className="bg-primary h-2.5 rounded-full" style={{ width: `${(modules.filter(m => m.isCompleted).length / modules.length) * 100}%` }}></div>
                  </div>
                )}
              </div>
              <Button
                onClick={() => setShowDeleteModal(true)}
                variant="destructive"
              >
                Delete Course
              </Button>
            </div>
            {selectedModule && selectedModule.learningMaterial && selectedModule.learningMaterial !== "Please select a module from the list to view its content." ? (
              <>
                <h1 className="text-4xl font-bold text-foreground mb-6">{selectedModule.title}</h1>
                <div className="prose dark:prose-invert max-w-none">
                  {loadingModuleIdRef.current === selectedModule?.id ? <Spinner /> : <ReactMarkdown>{selectedModule.learningMaterial}</ReactMarkdown>}
                </div>
                <div className="mt-8 pt-6 border-t border-border flex items-center space-x-4">
                  <Button
                    onClick={handleGenerateFlashcards}
                    disabled={isFlashcardLoading || flashcards.length > 0 || !selectedModule || !selectedModule.learningMaterial}
                  >
                    {isFlashcardLoading ? 'Generating...' : (flashcards.length > 0 ? 'Flashcards Ready' : 'Generate Flashcards')}
                  </Button>
                  <Button
                    onClick={handleMarkAsComplete}
                    variant="secondary"
                    disabled={!selectedModule || !selectedModule.learningMaterial || selectedModule.isCompleted}
                  >
                    {selectedModule.isCompleted ? 'Completed ✓' : 'Mark as Complete'}
                  </Button>
                </div>
                <FlashcardViewer cards={flashcards} />
              </>
            ) : (
              <div className="text-center">
                {loadingModuleIdRef.current === selectedModule?.id ? (
                  <>
                    <Spinner />
                    <p className="mt-4 text-muted-foreground">Please wait while we are cooking your module</p>
                  </>
                ) : (
                  <>
                    <p className="mt-4 text-muted-foreground">{selectedModule?.title}</p>
                    <p className="text-muted-foreground">{selectedModule?.learningMaterial}</p>
                    <div className="mt-8 pt-6 border-t border-border flex items-center space-x-4">
                      <Button
                        onClick={handleGenerateFlashcards}
                        disabled={true}
                      >
                        Generate Flashcards
                      </Button>
                      <Button
                        onClick={handleMarkAsComplete}
                        variant="secondary"
                        disabled={true}
                      >
                        Mark as Complete
                      </Button>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        )}
      </MainLayout>
      <ConfirmationModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={async () => {
          try {
            await deleteCourse(courseId);
            await logActivity(user.uid, user.email, 'delete_course', { courseId });
            navigate('/dashboard'); // Redirect to dashboard after deletion
          } catch (error) {
            console.error("Error deleting course:", error);
            alert("Failed to delete course. Please try again.");
          }
        }}
        title="Delete Course"
        message="Are you sure you want to delete this course?"
        confirmText="Delete"
        confirmVariant="destructive"
      />
    </AnimatedPage>
  );
};
 
const FlashcardViewer = ({ cards }) => {
  const [flippedCard, setFlippedCard] = useState(null);
 
  if (cards.length === 0) return null;
  return (
    <div className="mt-8">
      <h3 className="text-3xl font-bold text-foreground mb-6">Flashcards</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {cards.map((card, index) => (
          <div
            key={index}
            className={`flashcard rounded-lg shadow-lg cursor-pointer min-h-[150px] flex items-center justify-center text-center ${flippedCard === index ? 'flipped' : ''}`}
            onClick={() => setFlippedCard(flippedCard === index ? null : index)}
          >
            <div className={`front ${index % 2 === 0 ? 'bg-flashcard-4' : 'bg-flashcard-red'}`}>
              {/* We changed text-lg to text-base and break-words to break-all */}
              <p className="text-base text-foreground w-full p-4 text-center break-words">{card.q}</p>
            </div>
            <div className={`back bg-flashcard-2`}>
              {/* We changed text-lg to text-base and break-words to break-all */}
              <p className="text-base text-foreground w-full p-4 text-center break-words">{card.a}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
export default CoursePage;