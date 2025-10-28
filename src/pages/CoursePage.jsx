import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, getDoc, collection, getDocs, query, updateDoc, setDoc } from 'firebase/firestore';
import { db, deleteCourse } from '../firebase.js';
import ReactMarkdown from 'react-markdown';
import MainLayout from '../components/MainLayout';
import Spinner from '../components/Spinner';
import Icon from '../components/Icon';
import AnimatedPage from '../components/AnimatedPage';
import { Button } from '@/components/ui/button'; // Import Button component
 
const CoursePage = () => {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const [courseTitle, setCourseTitle] = useState('');
  const [modules, setModules] = useState([]);
  const [selectedModule, setSelectedModule] = useState(null);
  const [isLessonLoading, setIsLessonLoading] = useState(false);
  const [isCourseLoading, setIsCourseLoading] = useState(true);
  const [isFlashcardLoading, setIsFlashcardLoading] = useState(false);
  const [flashcards, setFlashcards] = useState([]);
 
  useEffect(() => {
    const fetchCourseData = async () => {
      try {
        const courseDocRef = doc(db, "courses", courseId);
        const courseDocSnap = await getDoc(courseDocRef);
        if (courseDocSnap.exists()) {
          setCourseTitle(courseDocSnap.data().title);
        } else {
          setCourseTitle("Course Not Found");
        }
        const modulesCollectionRef = collection(db, "courses", courseId, "modules");
        const modulesQuery = query(modulesCollectionRef);
        const modulesSnapshot = await getDocs(modulesQuery);
        const fetchedModules = [];
        modulesSnapshot.docs.forEach((doc) => {
          fetchedModules.push({ id: doc.id, ...doc.data() });
        });
        fetchedModules.sort((a, b) => parseInt(a.id) - parseInt(b.id));
        setModules(fetchedModules);
      } catch (error) {
        console.error("Error fetching course data:", error);
      } finally {
        setIsCourseLoading(false);
      }
    };
    fetchCourseData();
  }, [courseId]);
 
  const handleGenerateFlashcards = async () => {
    if (!selectedModule?.learningMaterial) {
      alert("Please generate the lesson material first.");
      return;
    }
    if (flashcards.length > 0) {
      alert("Flashcards have already been generated for this module.");
      return;
    }
    setIsFlashcardLoading(true);
    try {
      const response = await fetch("/.netlify/functions/generateFlashcards", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lessonMaterial: selectedModule.learningMaterial })
      });
      const data = await response.json();
      const flashcardRef = doc(db, "courses", courseId, "flashcards", selectedModule.id);
      await setDoc(flashcardRef, { cards: data.cards });
      setFlashcards(data.cards);
    } catch (error) {
      console.error("Error generating flashcards:", error);
    } finally {
      setIsFlashcardLoading(false);
    }
  };
 
  const handleMarkAsComplete = async () => {
    if (!selectedModule) return;
    try {
      const moduleRef = doc(db, "courses", courseId, "modules", selectedModule.id);
      await updateDoc(moduleRef, { isCompleted: true });
      const updatedModules = modules.map(m => m.id === selectedModule.id ? { ...m, isCompleted: true } : m);
      setModules(updatedModules);
      setSelectedModule({ ...selectedModule, isCompleted: true });
      alert("Module marked as complete!");
    } catch (error) {
      console.error("Error marking module as complete:", error);
    }
  };
 
  const handleModuleClick = async (module) => {
    const dayNumber = parseInt(module.id);
    if (dayNumber > 1) {
      const previousDayId = (dayNumber - 1).toString();
      const previousModule = modules.find(m => m.id === previousDayId);
      if (!previousModule || !previousModule.isCompleted) {
        alert(`You must complete 'Day ${previousDayId}: ${previousModule.title}' before starting this module.`);
        return;
      }
    }
    setSelectedModule(module);
    setFlashcards([]);
    try {
      const flashcardDocRef = doc(db, "courses", courseId, "flashcards", module.id);
      const flashcardDocSnap = await getDoc(flashcardDocRef);
      if (flashcardDocSnap.exists()) {
        setFlashcards(flashcardDocSnap.data().cards);
      }
    } catch (error) {
      console.error("Error fetching flashcards:", error);
    }
    if (module.learningMaterial && module.learningMaterial !== "") {
      return;
    }
    setIsLessonLoading(true);
    try {
      const response = await fetch("/.netlify/functions/generateLesson", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          courseTitle: courseTitle,
          moduleTitle: module.title,
          moduleDescription: module.description
        })
      });
      const data = await response.json();
      const newMaterial = data.lessonMaterial;
      const moduleRef = doc(db, "courses", courseId, "modules", module.id);
      await updateDoc(moduleRef, { learningMaterial: newMaterial });
      const updatedModules = modules.map(m => m.id === module.id ? { ...m, learningMaterial: newMaterial } : m);
      setModules(updatedModules);
      setSelectedModule({ ...module, learningMaterial: newMaterial });
    } catch (error) {
      console.error("Error generating lesson material:", error);
      alert("Error: Failed to generate module content. Please try again later.");
    } finally {
      setIsLessonLoading(false);
    }
  };
 
  const sidebarContent = (
    <div>
      <h2 className="text-2xl font-bold mb-6 text-foreground">{courseTitle}</h2>
      <nav className="space-y-3">
        {modules.map((module) => (
          <Button
            key={module.id}
            onClick={() => handleModuleClick(module)}
            variant={selectedModule?.id === module.id ? 'default' : 'ghost'}
            className="w-full justify-start text-wrap break-words h-auto py-2 text-left"
          >
            <span className="text-wrap break-words">Day {module.id}: {module.title}</span>
            {module.isCompleted && <Icon name="check" className="text-green-400 flex-shrink-0 ml-2" />}
          </Button>
        ))}
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
                onClick={async () => {
                  if (window.confirm("Are you sure you want to delete this course? This action cannot be undone.")) {
                    try {
                      await deleteCourse(courseId);
                      navigate('/dashboard'); // Redirect to dashboard after deletion
                    } catch (error) {
                      console.error("Error deleting course:", error);
                      alert("Failed to delete course. Please try again.");
                    }
                  }
                }}
                variant="destructive"
              >
                Delete Course
              </Button>
            </div>
            {isCourseLoading ? (
              <div className="text-center">
                <Spinner />
                <p className="mt-4 text-muted-foreground">Loading course...</p>
              </div>
            ) : selectedModule && selectedModule.learningMaterial ? (
              <>
                <h1 className="text-4xl font-bold text-foreground mb-6">{selectedModule.title}</h1>
                <div className="prose dark:prose-invert max-w-none">
                  {isLessonLoading ? <Spinner /> : <ReactMarkdown>{selectedModule.learningMaterial}</ReactMarkdown>}
                </div>
                <div className="mt-8 pt-6 border-t border-border flex items-center space-x-4">
                  <Button
                    onClick={handleGenerateFlashcards}
                    disabled={isFlashcardLoading || !selectedModule || !selectedModule.learningMaterial}
                  >
                    {isFlashcardLoading ? 'Generating...' : 'Generate Flashcards'}
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
                {selectedModule && isLessonLoading ? (
                  <>
                    <Spinner />
                    <p className="mt-4 text-muted-foreground">Please wait while we are cooking your module</p>
                  </>
                ) : (
                  <>
                    <p className="mt-4 text-muted-foreground">Select a module</p>
                    <p className="text-muted-foreground">Please select a module from the list to view its content.</p>
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
              <p className="text-base text-foreground w-full p-4 text-center break-all">{card.q}</p>
            </div>
            <div className={`back bg-flashcard-2`}>
              {/* We changed text-lg to text-base and break-words to break-all */}
              <p className="text-base text-foreground w-full p-4 text-center break-all">{card.a}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
export default CoursePage;