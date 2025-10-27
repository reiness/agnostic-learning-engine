import React, { useState } from 'react';
import { generateCourse } from '../services/gemini';

const Dashboard = () => {
  const [topic, setTopic] = useState('');
  const [duration, setDuration] = useState('7_days'); // Default to 7 Days
  const [isLoading, setIsLoading] = useState(false);

  const handleGenerateCourse = async (e) => {
    e.preventDefault(); // Prevent default form submission behavior
    setIsLoading(true);
    try {
      const result = await generateCourse(topic, duration);
      console.log('Generated Course:', result);
    } catch (error) {
      console.error('Error generating course:', error);
    } finally {
      setIsLoading(false);
    }
  };
  return (
    <div className="flex h-screen">
      {/* Sidebar */}
      <div className="hidden md:block md:w-64 bg-gray-800 text-white p-4">
        <h2 className="text-2xl font-bold mb-4">My Courses</h2>
        {/* Sidebar content goes here */}
      </div>

      {/* Main Content Area */}
      <div className="flex-1 bg-gray-100 p-4">
        <h1 className="text-3xl font-bold mb-4">Dashboard</h1>
        <form onSubmit={handleGenerateCourse} className="mt-8 p-6 bg-white rounded-lg shadow-md">
          <h2 className="text-2xl font-bold mb-4">Create a New Course</h2>
          <div className="mb-4">
            <label htmlFor="courseTopic" className="block text-gray-700 text-sm font-bold mb-2">
              Course Topic & Needs
            </label>
            <textarea
              id="courseTopic"
              className="w-full p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows="5"
              placeholder="e.g., Learn advanced React hooks, improve state management in large applications, build a full-stack application with Node.js and Express."
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              disabled={isLoading}
            ></textarea>
          </div>
          <div className="mb-6">
            <label htmlFor="duration" className="block text-gray-700 text-sm font-bold mb-2">
              Duration
            </label>
            <select
              id="duration"
              className="w-full p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
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
            className="bg-blue-600 text-white p-3 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"
            disabled={isLoading}
          >
            {isLoading ? 'Generating course...' : 'Generate My Course'}
          </button>
        </form>
      </div>
    </div>  );
};

export default Dashboard;