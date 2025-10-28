import React from 'react';
import MainLayout from '../components/MainLayout';
import CourseCreationForm from '../components/CourseCreationForm';
import CourseList from '../components/CourseList';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth } from '../firebase';

const Dashboard = () => {
  const [user] = useAuthState(auth);

  const sidebarContent = <CourseList />;

  return (
    <MainLayout sidebarContent={sidebarContent}>
      <div className="space-y-8">
        <header>
          <h1 className="text-4xl font-bold text-white">
            Welcome back, {user ? user.displayName : 'Learner'}!
          </h1>
          <p className="text-lg text-gray-400 mt-2">
            Ready to start a new learning adventure?
          </p>
        </header>
        <CourseCreationForm />
      </div>
    </MainLayout>
  );
};

export default Dashboard;