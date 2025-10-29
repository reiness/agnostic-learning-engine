import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { db, auth } from '../firebase.js';
import { collection, query, orderBy, onSnapshot, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { useAuthState } from 'react-firebase-hooks/auth';

// Create the context
const NotificationContext = createContext();

// Create the audio object
const audio = new Audio('/notification.mp3');

// Create the Provider component
export const NotificationProvider = ({ children }) => {
  const [user] = useAuthState(auth);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  // This ref will store the previous count to prevent re-plays
  const prevUnreadCountRef = useRef(0);
  const isBellOpenRef = useRef(false); // New ref to track if the bell is open

  useEffect(() => {
    if (!user) {
      setNotifications([]);
      setUnreadCount(0);
      prevUnreadCountRef.current = 0; // Reset ref on logout
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
      // Check if the total number of notifications increased OR if the unread count increased
      // This covers cases where a notification is added or marked unread
      if ((notifs.length > notifications.length || newCount > prevUnreadCountRef.current) && !isBellOpenRef.current) {
         // Play sound only if the browser allows it (e.g., after user interaction)
         audio.play().catch(error => {
            console.warn("Audio play failed:", error); // Log warning if autoplay fails
         });
      }
      
      // Update the ref *after* the check
      prevUnreadCountRef.current = newCount;
      // --- END NEW LOGIC V2 ---

      setNotifications(notifs);
      setUnreadCount(newCount); // Update state last
    });

    return () => unsubscribe();
  }, [user]);

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

  const setIsBellOpen = (isOpen) => {
    isBellOpenRef.current = isOpen;
  };

  const value = {
    notifications,
    unreadCount,
    markAsRead,
    clearNotification,
    clearAll,
    setIsBellOpen
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};

// Create the custom hook to use the context
export const useNotifications = () => {
  return useContext(NotificationContext);
};