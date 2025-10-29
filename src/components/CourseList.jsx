import React, { useState, useEffect } from 'react';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db, auth } from '../firebase';
import { useAuthState } from 'react-firebase-hooks/auth';
import { Link } from 'react-router-dom';
import Spinner from './Spinner';
import { Button } from '@/components/ui/button';

const CourseList = () => {
  const [user] = useAuthState(auth);
  const [courses, setCourses] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchCourses = async () => {
      if (user) {
        try {
          const q = query(collection(db, "courses"), where("userId", "==", user.uid));
          const querySnapshot = await getDocs(q);
          const userCourses = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
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

  if (isLoading) {
    return <Spinner />;
  }

  return (
    <div>
      <h2 className="text-2xl font-bold mb-6">My Courses</h2>
      {courses.length > 0 ? (
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
      ) : (
        <p className="text-muted-foreground">You haven't created any courses yet.</p>
      )}
    </div>
  );
};

export default CourseList;