import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { db, auth } from '../firebase.js'; // Ensure correct path
import { collection, query, orderBy, onSnapshot, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { useAuthState } from 'react-firebase-hooks/auth';

// Create the context
const NotificationContext = createContext();

// Create the audio object
const audio = new Audio('/notification.mp3'); // Ensure this path is correct

// Create the Provider component
export const NotificationProvider = ({ children }) => {
  const [user] = useAuthState(auth);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const prevUnreadCountRef = useRef(0);
  const isBellOpenRef = useRef(false); // Ref to track if bell is open

  useEffect(() => {
    if (!user) {
      setNotifications([]);
      setUnreadCount(0);
      prevUnreadCountRef.current = 0;
      return;
    }

    const q = query(
      collection(db, `users/${user.uid}/notifications`),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      let newCount = 0;
      const notifs = snapshot.docs.map(doc => {
        const data = doc.data();
        if (!data.isRead) {
          newCount++;
        }
        return { id: doc.id, ...data };
      });

      // --- NEW SOUND LOGIC V2 ---
      // Check if the unread count increased AND if the bell is closed
      if (newCount > prevUnreadCountRef.current && !isBellOpenRef.current) {
         // Play sound but catch the error if browser blocks it
         audio.play().catch(error => {
            // Log warning if autoplay fails, but don't crash
            console.warn("Audio play failed (likely due to browser policy):", error);
         });
      }
      
      prevUnreadCountRef.current = newCount;
      // --- END NEW LOGIC V2 ---

      setNotifications(notifs);
      setUnreadCount(newCount); // Update state last
    });

    return () => unsubscribe();
  }, [user]); // Removed notifications from dependencies

  const setIsBellOpen = (isOpen) => { // Function to update the ref
      isBellOpenRef.current = isOpen;
  };

  const markAsRead = async (id) => {
    const docRef = doc(db, `users/${user.uid}/notifications`, id);
    await updateDoc(docRef, { isRead: true });
  };

  const clearNotification = async (id) => {
    const docRef = doc(db, `users/${user.uid}/notifications`, id);
    await deleteDoc(docRef);
  };

  const clearAll = async () => {
    notifications.forEach(notif => {
      if (notif.id) clearNotification(notif.id);
    });
  };

  const value = {
    notifications,
    unreadCount,
    markAsRead,
    clearNotification,
    clearAll,
    setIsBellOpen // Expose the function to update the ref
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};

// Custom hook to use the context
export const useNotifications = () => {
  return useContext(NotificationContext);
};