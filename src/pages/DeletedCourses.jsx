import React, { useState, useEffect } from 'react';
import MainLayout from '../components/MainLayout';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth, db, restoreCourse } from '../firebase';
import { collection, query, where, getDocs, orderBy, Timestamp } from 'firebase/firestore';
import Spinner from '../components/Spinner';
import AnimatedPage from '../components/AnimatedPage';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { History } from 'lucide-react';
import { logActivity } from '../services/activityService';

const DeletedCourses = () => {
  const [user] = useAuthState(auth);
  const [deletedCourses, setDeletedCourses] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [restoringCourseId, setRestoringCourseId] = useState(null);

  useEffect(() => {
    const fetchDeletedCourses = async () => {
      if (user) {
        try {
          const thirtyDaysAgoDate = new Date();
          thirtyDaysAgoDate.setDate(thirtyDaysAgoDate.getDate() - 30);
          const thirtyDaysAgoTimestamp = Timestamp.fromDate(thirtyDaysAgoDate);

          const q = query(
            collection(db, "deleted_courses"),
            where("userId", "==", user.uid),
            where("deletedAt", ">=", thirtyDaysAgoTimestamp),
            orderBy("deletedAt", "desc")
          );

          const querySnapshot = await getDocs(q);
          const courses = await Promise.all(querySnapshot.docs.map(async (doc) => {
            const courseData = { id: doc.id, ...doc.data() };
            // Fetch modules to calculate progress
            const modulesQuery = query(collection(db, "deleted_courses", doc.id, "modules"));
            const modulesSnapshot = await getDocs(modulesQuery);
            const modules = modulesSnapshot.docs.map(moduleDoc => moduleDoc.data());
            const completedModules = modules.filter(m => m.isCompleted).length;
            const totalModules = modules.length;
            const progress = totalModules > 0 ? (completedModules / totalModules) * 100 : 0;
            return { ...courseData, progress };
          }));
          setDeletedCourses(courses);
        } catch (error) {
          console.error("Error fetching deleted courses:", error);
        } finally {
          setIsLoading(false);
        }
      }
    };

    fetchDeletedCourses();
  }, [user]);

  const handleRestore = async (courseId) => {
    if (window.confirm("Are you sure you want to restore this course?")) {
      setRestoringCourseId(courseId);
      try {
        await restoreCourse(courseId);
        await logActivity(user.uid, user.email, 'restore_course', { courseId });
        setDeletedCourses(deletedCourses.filter(course => course.id !== courseId));
      } catch (error) {
        console.error("Error restoring course:", error);
      } finally {
        setRestoringCourseId(null);
      }
    }
  };

  return (
    <AnimatedPage>
      <MainLayout>
        <div className="space-y-8">
          <header>
            <h1 className="text-4xl font-bold">Recently Deleted Courses</h1>
            <p className="text-lg text-muted-foreground mt-2">
              Courses deleted within the last 30 days can be restored here.
            </p>
          </header>
          {isLoading ? <Spinner /> : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {deletedCourses.length > 0 ? (
                deletedCourses.map(course => (
                  <Card key={course.id} className="relative">
                    <CardHeader>
                      <CardTitle className="truncate">{course.title}</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <p className="text-sm text-muted-foreground">
                          Deleted on: {new Date(course.deletedAt?.toDate()).toLocaleDateString()}
                        </p>
                        <Progress value={course.progress} className="w-full mt-2" />
                        <p className="text-right text-sm text-muted-foreground mt-1">{Math.round(course.progress)}% Complete</p>
                      </div>
                      <Button
                        onClick={() => handleRestore(course.id)}
                        disabled={restoringCourseId === course.id}
                        className="w-full"
                      >
                        <History className="mr-2 h-4 w-4" />
                        {restoringCourseId === course.id ? 'Restoring...' : 'Restore Course'}
                      </Button>
                    </CardContent>
                  </Card>
                ))
              ) : (
                <div className="text-center py-12 col-span-3">
                  <h3 className="text-2xl font-bold">No recently deleted courses!</h3>
                  <p className="text-muted-foreground mt-2">You haven't deleted any courses in the last 30 days.</p>
                </div>
              )}
            </div>
          )}
        </div>
      </MainLayout>
    </AnimatedPage>
  );
};

export default DeletedCourses;