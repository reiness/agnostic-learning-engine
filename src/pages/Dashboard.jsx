import React, { useState, useEffect } from 'react';
import MainLayout from '../components/MainLayout';
import CourseCreationForm from '../components/CourseCreationForm';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth, db, deleteCourse } from '../firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { Link } from 'react-router-dom';
import Spinner from '../components/Spinner';
import AnimatedPage from '../components/AnimatedPage';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Trash2 } from 'lucide-react';

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
  const [courses, setCourses] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [deletingCourseId, setDeletingCourseId] = useState(null); // New state for animation

  useEffect(() => {
    const fetchCourses = async () => {
      if (user) {
        try {
          const q = query(collection(db, "courses"), where("userId", "==", user.uid));
          const querySnapshot = await getDocs(q);
          const userCourses = await Promise.all(querySnapshot.docs.map(async (doc) => {
            const courseData = { id: doc.id, ...doc.data() };
            const modulesQuery = query(collection(db, "courses", doc.id, "modules"));
            const modulesSnapshot = await getDocs(modulesQuery);
            const modules = modulesSnapshot.docs.map(moduleDoc => moduleDoc.data());
            const completedModules = modules.filter(m => m.isCompleted).length;
            const totalModules = modules.length;
            const progress = totalModules > 0 ? (completedModules / totalModules) * 100 : 0;
            return { ...courseData, progress };
          }));
          setCourses(userCourses);
        } catch (error) {
          console.error("Error fetching courses:", error);
        } finally {
          setIsLoading(false);
        }
      }
    };
    fetchCourses();
  }, [user]);

  const handleDelete = async (courseId) => {
    if (window.confirm("Are you sure you want to delete this course? This action cannot be undone.")) {
      setDeletingCourseId(courseId); // Start animation
      setTimeout(async () => {
        try {
          await deleteCourse(courseId);
          setCourses(courses.filter(course => course.id !== courseId));
        } catch (error) {
          console.error("Error deleting course:", error);
          // Optionally, show an error message to the user
          setDeletingCourseId(null); // Reset animation state on error
        }
      }, 700); // Match this duration with the CSS transition duration
    }
  };

  const sidebarContent = (
    <div>
      <h2 className="text-2xl font-bold mb-6">My Courses</h2>
      {isLoading ? <Spinner /> : (
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
            {isLoading ? <Spinner /> : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {courses.length > 0 ? (
                  courses.map(course => (
                    <Card
                      key={course.id}
                      className={`relative transition-all duration-700 ease-in-out ${
                        deletingCourseId === course.id
                          ? 'opacity-0 -translate-y-4 max-h-0 p-0 m-0 overflow-hidden bg-red-500'
                          : 'opacity-100 translate-y-0 max-h-96'
                      }`}
                    >
                      <CardHeader className="flex flex-row items-start justify-between space-x-2">
                        <Link to={`/course/${course.id}`} className="flex-grow overflow-hidden">
                          <CardTitle className="truncate">{course.title}</CardTitle>
                          <p className="text-sm text-muted-foreground mt-1">Created: {formatDate(course.createdAt)}</p>
                        </Link>
                        <Button
                          variant="destructive"
                          size="icon"
                          className="flex-shrink-0"
                          onClick={(e) => { e.preventDefault(); handleDelete(course.id); }}
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
    </AnimatedPage>
  );
};

export default Dashboard;