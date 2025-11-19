import { useState, useEffect, useCallback } from 'react';
import { collection, query, where, getDocs, onSnapshot } from 'firebase/firestore';
import { db, deleteCourse as deleteCourseService } from '../firebase';
export const useUserCourses = (userId) => {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deletingCourseId, setDeletingCourseId] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!userId) {
      setCourses([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    const q = query(collection(db, "courses"), where("userId", "==", userId));

    const unsubscribe = onSnapshot(q, async (querySnapshot) => {
      try {
        const userCourses = await Promise.all(querySnapshot.docs.map(async (doc) => {
          const courseData = { id: doc.id, ...doc.data() };
          // Note: Fetching subcollections (modules) inside onSnapshot can be expensive if there are many updates.
          // For a scalable solution, consider denormalizing progress or only fetching progress when necessary.
          // For now, we keep the logic to maintain functionality.
          const modulesQuery = query(collection(db, "courses", doc.id, "modules"));
          const modulesSnapshot = await getDocs(modulesQuery);
          const modules = modulesSnapshot.docs.map(moduleDoc => moduleDoc.data());
          const completedModules = modules.filter(m => m.isCompleted).length;
          const totalModules = modules.length;
          const progress = totalModules > 0 ? (completedModules / totalModules) * 100 : 0;
          return { ...courseData, progress };
        }));
        setCourses(userCourses);
      } catch (err) {
        console.error("Error processing courses snapshot:", err);
        setError(err);
      } finally {
        setLoading(false);
      }
    }, (err) => {
      console.error("Error listening to courses:", err);
      setError(err);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [userId]);

  const deleteCourse = async (courseId) => {
      setDeletingCourseId(courseId); // Start animation
      setTimeout(async () => {
        try {
          await deleteCourseService(courseId);
          setCourses(prevCourses => prevCourses.filter(course => course.id !== courseId));
        } catch (error) {
          console.error("Error deleting course:", error);
          setError(error);
          setDeletingCourseId(null); // Reset animation state on error
        }
      }, 700); // Match this duration with the CSS transition duration
  };

  return { courses, loading, deletingCourseId, deleteCourse, error };
};