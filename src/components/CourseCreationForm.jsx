import React, { useState } from 'react';
import { collection, addDoc, doc, writeBatch } from 'firebase/firestore';
import { db, auth } from '../firebase';
import { useAuthState } from 'react-firebase-hooks/auth';
import { useNavigate } from 'react-router-dom';
import { generateCourse } from '../services/gemini';

const CourseCreationForm = () => {
  const [user] = useAuthState(auth);
  const navigate = useNavigate();
  const [topic, setTopic] = useState('');
  const [duration, setDuration] = useState('7_days');
  const [isLoading, setIsLoading] = useState(false);

  const handleGenerateCourse = async (e) => {
    e.preventDefault();
    if (!user) {
      console.error("User not logged in.");
      return;
    }
    setIsLoading(true);
    try {
      const courseData = await generateCourse(topic, duration);
      if (!courseData || !courseData.title || !Array.isArray(courseData.dailyModules)) {
        console.error("Invalid course data structure received from API:", courseData);
        alert("Error: The generated course data was incomplete. Please try again.");
        return;
      }
      const coursesRef = collection(db, 'courses');
      const newCourseDocRef = await addDoc(coursesRef, {
        userId: user.uid,
        title: courseData.title,
        durationDays: parseInt(duration.replace('_days', '')),
        originalPrompt: topic,
        status: 'active',
        createdAt: new Date()
      });
      const newCourseId = newCourseDocRef.id;
      const batch = writeBatch(db);
      courseData.dailyModules.forEach(module => {
        const day = module.day.toString();
        const moduleRef = doc(db, 'courses', newCourseId, 'modules', day);
        batch.set(moduleRef, {
          title: module.title,
          description: module.description,
          learningMaterial: "",
          isCompleted: false
        });
      });
      await batch.commit();
      navigate(`/course/${newCourseId}`);
    } catch (error) {
      console.error('Error generating course:', error);
      alert("Error: Course generation failed. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleGenerateCourse} className="p-8 bg-gray-800 rounded-xl shadow-2xl space-y-6">
      <h2 className="text-3xl font-bold text-white">Create a New Course</h2>
      <div>
        <label htmlFor="courseTopic" className="block text-lg font-medium text-gray-300 mb-2">
          What do you want to learn?
        </label>
        <textarea
          id="courseTopic"
          className="w-full p-3 bg-gray-700 text-white border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
          rows="5"
          placeholder="e.g., Advanced TypeScript for modern web development..."
          value={topic}
          onChange={(e) => setTopic(e.target.value)}
          disabled={isLoading}
        />
      </div>
      <div>
        <label htmlFor="duration" className="block text-lg font-medium text-gray-300 mb-2">
          How long do you have?
        </label>
        <select
          id="duration"
          className="w-full p-3 bg-gray-700 text-white border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
          value={duration}
          onChange={(e) => setDuration(e.target.value)}
          disabled={isLoading}
        >
          <option value="7_days">7 Days</option>
          <option value="14_days">14 Days</option>
          <option value="30_days">30 Days</option>
        </select>
      </div>
      <button
        type="submit"
        className="w-full py-3 px-6 bg-blue-600 text-white font-bold rounded-lg shadow-lg hover:bg-blue-700 transition duration-300 ease-in-out transform hover:scale-105 disabled:opacity-50 disabled:scale-100"
        disabled={isLoading}
      >
        {isLoading ? 'Generating Your Course...' : 'Generate My Course'}
      </button>
    </form>
  );
};

export default CourseCreationForm;