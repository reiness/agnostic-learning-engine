import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { doc, getDoc, collection, getDocs, query, updateDoc, setDoc } from 'firebase/firestore';
import { db } from '../firebase.js';
import ReactMarkdown from 'react-markdown';
import MainLayout from '../components/MainLayout';
import Spinner from '../components/Spinner';

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
    if (!selectedModule?.learningMaterial) {
      alert("Please generate the lesson material first.");
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
    if (module.learningMaterial) return;
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
    } finally {
      setIsLessonLoading(false);
    }
  };

  const sidebarContent = (
    <div>
      <h2 className="text-2xl font-bold mb-6 text-white">{courseTitle}</h2>
      <nav className="space-y-3">
        {modules.map((module) => (
          <button
            key={module.id}
            onClick={() => handleModuleClick(module)}
            className={`w-full text-left p-3 rounded-lg transition duration-200 flex items-center justify-between ${selectedModule?.id === module.id ? 'bg-blue-600 text-white' : 'bg-gray-800 hover:bg-gray-700'}`}
          >
            <span>Day {module.id}: {module.title}</span>
            {module.isCompleted && <span className="text-green-400">✓</span>}
          </button>
        ))}
      </nav>
    </div>
  );

  return (
    <MainLayout sidebarContent={sidebarContent}>
      {selectedModule ? (
        <div className="bg-gray-800 p-8 rounded-xl shadow-2xl">
          <h1 className="text-4xl font-bold text-white mb-6">{selectedModule.title}</h1>
          <div className="prose prose-invert max-w-none">
            {isLessonLoading ? <Spinner /> : <ReactMarkdown>{selectedModule.learningMaterial}</ReactMarkdown>}
          </div>
          <div className="mt-8 pt-6 border-t border-gray-700 flex items-center space-x-4">
            <button
              onClick={handleGenerateFlashcards}
              className="py-2 px-5 bg-blue-600 text-white font-bold rounded-lg shadow-lg hover:bg-blue-700 transition duration-300 disabled:opacity-50"
              disabled={isFlashcardLoading || !selectedModule.learningMaterial}
            >
              {isFlashcardLoading ? 'Generating...' : 'Generate Flashcards'}
            </button>
            <button
              onClick={handleMarkAsComplete}
              className="py-2 px-5 bg-green-600 text-white font-bold rounded-lg shadow-lg hover:bg-green-700 transition duration-300 disabled:opacity-50"
              disabled={selectedModule.isCompleted}
            >
              {selectedModule.isCompleted ? 'Completed ✓' : 'Mark as Complete'}
            </button>
          </div>
          <FlashcardViewer cards={flashcards} />
        </div>
      ) : (
        <p>Select a module to begin.</p>
      )}
    </MainLayout>
  );
};

const FlashcardViewer = ({ cards }) => {
  const [flippedCard, setFlippedCard] = useState(null);
  if (cards.length === 0) return null;
  return (
    <div className="mt-8">
      <h3 className="text-3xl font-bold text-white mb-6">Flashcards</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {cards.map((card, index) => (
          <div
            key={index}
            className="p-6 bg-gray-700 rounded-lg shadow-lg cursor-pointer min-h-[150px] flex items-center justify-center text-center transition-transform duration-300 transform hover:scale-105"
            onClick={() => setFlippedCard(flippedCard === index ? null : index)}
          >
            <p className="text-lg">{flippedCard === index ? card.a : card.q}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default CoursePage;