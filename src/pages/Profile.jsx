import React, { useState, useEffect } from 'react';
import MainLayout from '../components/MainLayout';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth, db } from '../firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';
import Spinner from '../components/Spinner';
import AnimatedPage from '../components/AnimatedPage';

const Profile = () => {
  const [user] = useAuthState(auth);
  const [stats, setStats] = useState({
    coursesInProgress: 0,
    coursesCompleted: 0,
    modulesCompleted: 0,
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchUserStats = async () => {
      if (user) {
        try {
          const q = query(collection(db, "courses"), where("userId", "==", user.uid));
          const querySnapshot = await getDocs(q);
          let coursesInProgress = 0;
          let coursesCompleted = 0;
          let modulesCompleted = 0;

          for (const doc of querySnapshot.docs) {
            const modulesQuery = query(collection(db, "courses", doc.id, "modules"));
            const modulesSnapshot = await getDocs(modulesQuery);
            const modules = modulesSnapshot.docs.map(moduleDoc => moduleDoc.data());
            const completed = modules.filter(m => m.isCompleted).length;
            modulesCompleted += completed;
            if (completed === modules.length && modules.length > 0) {
              coursesCompleted++;
            } else {
              coursesInProgress++;
            }
          }
          setStats({ coursesInProgress, coursesCompleted, modulesCompleted });
        } catch (error) {
          console.error("Error fetching user stats:", error);
        } finally {
          setIsLoading(false);
        }
      }
    };
    fetchUserStats();
  }, [user]);

  return (
    <AnimatedPage>
      <MainLayout>
        <div className="space-y-8">
          <header className="flex items-center space-x-6">
            {user && (
              <img
                src={user.photoURL}
                alt={user.displayName}
                className="w-24 h-24 rounded-full"
              />
            )}
            <div>
              <h1 className="text-4xl font-bold text-foreground">
                {user ? user.displayName : 'Learner'}'s Profile
              </h1>
              <p className="text-lg text-muted-foreground mt-2">
                Your learning journey at a glance.
              </p>
            </div>
          </header>
          {isLoading ? <Spinner /> : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="bg-card text-card-foreground p-6 rounded-xl shadow-lg text-center">
                <h3 className="text-5xl font-bold text-primary">{stats.coursesInProgress}</h3>
                <p className="text-xl text-muted-foreground mt-2">Courses in Progress</p>
              </div>
              <div className="bg-card text-card-foreground p-6 rounded-xl shadow-lg text-center">
                <h3 className="text-5xl font-bold text-green-400">{stats.coursesCompleted}</h3>
                <p className="text-xl text-muted-foreground mt-2">Courses Completed</p>
              </div>
              <div className="bg-card text-card-foreground p-6 rounded-xl shadow-lg text-center">
                <h3 className="text-5xl font-bold text-yellow-400">{stats.modulesCompleted}</h3>
                <p className="text-xl text-muted-foreground mt-2">Modules Completed</p>
              </div>
            </div>
          )}
        </div>
      </MainLayout>
    </AnimatedPage>
  );
};

export default Profile;