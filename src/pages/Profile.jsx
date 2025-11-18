import React, { useState, useEffect } from 'react';
import MainLayout from '../components/MainLayout';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth, db } from '../firebase';
import { collection, query, where, getDocs, doc, getDoc } from 'firebase/firestore';
import Spinner from '../components/Spinner';
import AnimatedPage from '../components/AnimatedPage';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import CourseList from '../components/CourseList';

const Profile = () => {
  const [user] = useAuthState(auth);
  const [stats, setStats] = useState({
    coursesInProgress: 0,
    coursesCompleted: 0,
    modulesCompleted: 0,
    credits: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const fetchUserStats = async () => {
      if (user) {
        try {
          const userRef = doc(db, 'users', user.uid);
          const userDoc = await getDoc(userRef);
          const credits = userDoc.exists() ? userDoc.data().credits : 0;

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
          setStats({ coursesInProgress, coursesCompleted, modulesCompleted, credits });
        } catch (error) {
          console.error("Error fetching user stats:", error);
        } finally {
          setIsLoading(false);
        }
      }
    };
    fetchUserStats();

    const checkAdminStatus = async () => {
      if (user) {
        try {
          const adminRef = doc(db, 'admins', user.email);
          const adminDoc = await getDoc(adminRef);
          setIsAdmin(adminDoc.exists());
        } catch (err) {
          console.error("Error checking admin status in Profile:", err);
          setIsAdmin(false);
        }
      }
    };
    checkAdminStatus();
  }, [user]);

  const sidebarContent = (
    <CourseList />
  );

  return (
    <AnimatedPage>
      <MainLayout sidebarContent={sidebarContent}>
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
                Date Joined: {user ? new Date(user.metadata.creationTime).toLocaleDateString() : 'N/A'}
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
              {/* <div className="bg-card text-card-foreground p-6 rounded-xl shadow-lg text-center">
                <h3 className="text-5xl font-bold text-blue-400">{stats.credits}</h3>
                <p className="text-xl text-muted-foreground mt-2">Credits Remaining</p>
              </div> */}
            </div>
          )}
          <div className="mt-8">
            <Link to="/deleted-courses">
              <Button variant="outline">View Deleted Courses</Button>
            </Link>
            {user && isAdmin && (
              <Link to="/admin">
                <Button className="ml-4 bg-blue-500 text-white hover:bg-blue-600">Go to Admin Page</Button>
              </Link>
            )}
          </div>
        </div>
      </MainLayout>
    </AnimatedPage>
  );
};

export default Profile;