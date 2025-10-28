import React, { useState, useEffect } from 'react';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db, auth } from '../firebase';
import { useAuthState } from 'react-firebase-hooks/auth';
import { Link } from 'react-router-dom';
import Spinner from './Spinner';

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
      <h2 className="text-2xl font-bold mb-6 text-white">My Courses</h2>
      {courses.length > 0 ? (
        <ul className="space-y-3">
          {courses.map(course => (
            <li key={course.id}>
              <Link
                to={`/course/${course.id}`}
                className="block p-3 bg-gray-800 rounded-lg hover:bg-gray-700 transition duration-200"
              >
                {course.title}
              </Link>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-gray-400">You haven't created any courses yet.</p>
      )}
    </div>
  );
};

export default CourseList;