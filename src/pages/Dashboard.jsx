import React, { useState } from 'react';
import MainLayout from '../components/MainLayout';
import CourseCreationForm from '../components/CourseCreationForm';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth } from '../firebase';
import { Link } from 'react-router-dom';
import Spinner from '../components/Spinner';
import AnimatedPage from '../components/AnimatedPage';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Trash2 } from 'lucide-react';
import { useUserCourses } from '../hooks/useUserCourses';
import ConfirmationModal from '../components/ConfirmationModal';

const formatDate = (timestamp) => {
  if (!timestamp) return "N/A";
  // Firestore Timestamp objects have a toDate() method
  const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
};

const Dashboard = () => {
  const [user] = useAuthState(auth);
  const { courses, loading, deletingCourseId, deleteCourse } = useUserCourses(user?.uid);
  const [courseToDelete, setCourseToDelete] = useState(null);

  const handleDeleteClick = (courseId) => {
    setCourseToDelete(courseId);
  };

  const handleConfirmDelete = async () => {
    if (courseToDelete) {
      await deleteCourse(courseToDelete);
      setCourseToDelete(null);
    }
  };

  const handleCancelDelete = () => {
    setCourseToDelete(null);
  };

  const sidebarContent = (
    <div>
      <h2 className="text-2xl font-bold mb-6">My Courses</h2>
      {loading ? <Spinner /> : (
        <ul className="space-y-3">
          {courses.map(course => (
            <li key={course.id}>
              <Link to={`/course/${course.id}`}>
                <Button variant="ghost" className="w-full justify-start text-wrap break-words h-auto py-2 text-left">
                  {course.title}
                </Button>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );

  return (
    <AnimatedPage>
      <MainLayout sidebarContent={sidebarContent}>
        <div className="space-y-8">
          <header>
            <h1 className="text-4xl font-bold">
              Welcome back, {user ? user.displayName : 'Learner'}!
            </h1>
            <p className="text-lg text-muted-foreground mt-2">
              Ready to start a new learning adventure?
            </p>
          </header>
          <CourseCreationForm />
          <div className="mt-12">
            <h2 className="text-3xl font-bold mb-6">Your Courses</h2>
            {loading ? <Spinner /> : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {courses.length > 0 ? (
                  courses.sort((a, b) => (b.createdAt?.toDate() || 0) - (a.createdAt?.toDate() || 0)).map(course => (
                    <Card
                      key={course.id}
                      className={`relative transition-all duration-700 ease-in-out ${
                        deletingCourseId === course.id
                          ? 'opacity-0 -translate-y-4 max-h-0 p-0 m-0 overflow-hidden bg-red-500'
                          : 'opacity-100 translate-y-0 max-h-96'
                      }`}
                    >
                      <CardHeader className="flex flex-row items-start justify-between space-x-2 min-h-[6rem]">
                        <Link to={`/course/${course.id}`} className="flex-grow overflow-hidden">
                          <CardTitle className="text-wrap break-words">{course.title}</CardTitle>
                          <p className="text-sm text-muted-foreground mt-1">Created: {formatDate(course.createdAt)}</p>
                        </Link>
                        <Button
                          variant="destructive"
                          size="icon"
                          className="flex-shrink-0"
                          onClick={(e) => { e.preventDefault(); handleDeleteClick(course.id); }}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </CardHeader>
                      <CardContent>
                        <Link to={`/course/${course.id}`}>
                          <Progress value={course.progress} className="w-full" />
                          <p className="text-right text-sm text-muted-foreground mt-2">{Math.round(course.progress)}% Complete</p>
                        </Link>
                      </CardContent>
                    </Card>
                  ))
                ) : (
                  <div className="text-center py-12 col-span-3">
                    <h3 className="text-2xl font-bold">No courses yet!</h3>
                    <p className="text-muted-foreground mt-2">Create a new course to get started on your learning journey.</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </MainLayout>
      <ConfirmationModal 
        isOpen={!!courseToDelete}
        onClose={handleCancelDelete}
        onConfirm={handleConfirmDelete}
        title="Delete Course"
        message="Are you sure you want to delete this course?"
        confirmText="Delete"
        confirmVariant="destructive"
      />
    </AnimatedPage>
  );
};

export default Dashboard;