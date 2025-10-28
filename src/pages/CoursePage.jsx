import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { doc, getDoc, collection, getDocs, query, updateDoc, setDoc } from 'firebase/firestore';
import { db } from '../firebase.js';
import ReactMarkdown from 'react-markdown';

const CoursePage = () => {
  const { courseId } = useParams();
  const [courseTitle, setCourseTitle] = useState('');
  const [modules, setModules] = useState([]);
  const [selectedModule, setSelectedModule] = useState(null);
  const [isLessonLoading, setIsLessonLoading] = useState(false);
  const [isFlashcardLoading, setIsFlashcardLoading] = useState(false);
  const [flashcards, setFlashcards] = useState([]);

  useEffect(() => {
    const fetchCourseData = async () => {
      try {
        // Fetch main course document
        const courseDocRef = doc(db, "courses", courseId);
        const courseDocSnap = await getDoc(courseDocRef);

        if (courseDocSnap.exists()) {
          setCourseTitle(courseDocSnap.data().title);
        } else {
          console.error("No such course document!");
          setCourseTitle("Course Not Found");
          return;
        }

        // Fetch modules sub-collection
        const modulesCollectionRef = collection(db, "courses", courseId, "modules");
        const modulesQuery = query(modulesCollectionRef);
        const modulesSnapshot = await getDocs(modulesQuery);

        const fetchedModules = [];
        modulesSnapshot.docs.forEach((doc) => {
          // 'doc.id' is the day number (e.g., "1", "2")
          fetchedModules.push({ id: doc.id, ...doc.data() });
        });

        // We must manually sort the modules, because Firestore will
        // order them as strings ("1", "10", "2", ...). This fixes it.
        fetchedModules.sort((a, b) => parseInt(a.id) - parseInt(b.id));

        setModules(fetchedModules);
        
        // Also, update the default selected module to show a placeholder
        // instead of the 'Day 1' object, which might not be loaded yet.
        setSelectedModule({
          title: "Select a module",
          learningMaterial: "Please select a module from the list to view its content."
        });

      } catch (error) {
        console.error("Error fetching course data:", error);
      }
    };

    fetchCourseData();
  }, [courseId]);

  const handleGenerateFlashcards = async () => {
    setIsFlashcardLoading(true);
    try {
      if (!selectedModule?.learningMaterial) {
        alert("Please generate the lesson material first.");
        return;
      }

      const response = await fetch("/.netlify/functions/generateFlashcards", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lessonMaterial: selectedModule.learningMaterial })
      });

      const data = await response.json(); // This is { cards: [...] }
      const newFlashcards = data.cards;

      const flashcardRef = doc(db, "courses", courseId, "flashcards", selectedModule.id);
      await setDoc(flashcardRef, { cards: newFlashcards });

      setFlashcards(newFlashcards);

    } catch (error) {
      console.error("Error generating flashcards:", error);
      alert("Failed to generate flashcards. Please try again.");
    } finally {
      setIsFlashcardLoading(false);
    }
  };

  const handleMarkAsComplete = async () => {
    if (!selectedModule) return;

    try {
      const moduleRef = doc(db, "courses", courseId, "modules", selectedModule.id);
      await updateDoc(moduleRef, { isCompleted: true });

      setSelectedModule({ ...selectedModule, isCompleted: true });
      setModules(modules.map(m => m.id === selectedModule.id ? { ...m, isCompleted: true } : m));
      alert("Module marked as complete!");
    } catch (error) {
      console.error("Error marking module as complete:", error);
      alert("Failed to mark module as complete. Please try again.");
    }
  };

  const handleModuleClick = async (module) => {
    // --- Progression Logic Start ---
    const dayNumber = parseInt(module.id);

    if (dayNumber > 1) {
      // Find the previous module in our state
      const previousDayId = (dayNumber - 1).toString();
      const previousModule = modules.find(m => m.id === previousDayId);

      // Check if the previous module is complete
      if (!previousModule || !previousModule.isCompleted) {
        alert(`You must complete 'Day ${previousDayId}: ${previousModule.title}' before starting this module.`);
        return; // Stop the function from running
      }
    }
    // --- Progression Logic End ---

    setSelectedModule(module);
    setFlashcards([]); // Clear flashcards when a new module is selected

    // Fetch flashcards if they exist for this module
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
      await updateDoc(moduleRef, {
        learningMaterial: newMaterial
      });

      setSelectedModule({ ...module, learningMaterial: newMaterial });
      setModules(modules.map(m => m.id === module.id ? { ...m, learningMaterial: newMaterial } : m));

    } catch (error) {
      console.error("Error generating lesson material:", error);
      alert("Failed to generate lesson material. Please try again.");
    } finally {
      setIsLessonLoading(false);
    }
  };

  return (
    <div className="flex h-screen">
      {/* Sidebar */}
      <div className="hidden md:block md:w-64 bg-gray-800 text-white p-4">
        <h2 className="text-2xl font-bold mb-4">{courseTitle}</h2>
        <nav>
          {modules.map((module) => (
            <button
              key={module.id}
              className={`block w-full text-left p-2 rounded-md mb-2 ${
                selectedModule?.id === module.id ? 'bg-blue-600' : 'hover:bg-gray-700'
              }`}
              onClick={() => handleModuleClick(module)}
            >
              Day {module.id}: {module.title}
            </button>
          ))}
        </nav>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 bg-gray-100 p-4">
        {selectedModule ? (
          <>
            <div className="prose max-w-none p-4">
              <h1 className="text-3xl font-bold mb-4">{selectedModule.title}</h1>
              {isLessonLoading ? (
                <p>Generating lesson, please wait...</p>
              ) : (
                <ReactMarkdown>{selectedModule?.learningMaterial}</ReactMarkdown>
              )}
            </div>
            {/* Buttons and Flashcard Viewer */}
            <div className="mt-4 p-4 border-t">
              <button
                onClick={handleGenerateFlashcards}
                className="bg-blue-600 text-white p-2 rounded-md mr-4 hover:bg-blue-700"
                disabled={isFlashcardLoading || !selectedModule?.learningMaterial}
              >
                {isFlashcardLoading ? 'Generating Flashcards...' : "Generate Today's Flashcards"}
              </button>
              
              <button
                onClick={handleMarkAsComplete}
                className="bg-green-600 text-white p-2 rounded-md hover:bg-green-700"
                disabled={selectedModule?.isCompleted}
              >
                {selectedModule?.isCompleted ? 'Module Completed ✅' : 'Mark as Complete'}
              </button>
            </div>

            <FlashcardViewer cards={flashcards} />
          </>
        ) : (
          <p>Select a module to view its content.</p>
        )}
      </div>
    </div>
  );
};

const FlashcardViewer = ({ cards }) => {
  const [flippedCard, setFlippedCard] = useState(null);

  if (cards.length === 0) return null;

  return (
    <div className="mt-8">
      <h3 className="text-2xl font-bold mb-4">Flashcards</h3>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {cards.map((card, index) => (
          <div
            key={index}
            className="p-4 border rounded-lg shadow-md cursor-pointer h-32 flex items-center justify-center text-center"
            onClick={() => setFlippedCard(flippedCard === index ? null : index)}
          >
            {flippedCard === index ? card.a : card.q}
          </div>
        ))}
      </div>
    </div>
  );
};

export default CoursePage;