import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { db, auth } from '../firebase.js'; // Ensure correct path
import { collection, query, orderBy, onSnapshot, doc, updateDoc, deleteDoc, Timestamp } from 'firebase/firestore';
import { useAuthState } from 'react-firebase-hooks/auth';
import toast from 'react-hot-toast';

// Create the context
const NotificationContext = createContext();

// Create the audio object
const audio = new Audio('/notification.mp3'); // Ensure this path is correct

// Create the Provider component
/**
 * @typedef {object} Notification
 * @property {string} id - The unique ID of the notification.
 * @property {string} message - The notification message.
 * @property {boolean} isRead - Whether the notification has been read.
 * @property {Date} createdAt - The timestamp when the notification was created.
 */

/**
 * Provides notification context to the application.
 * Manages fetching, marking as read, clearing individual, and clearing all notifications for the authenticated user.
 * It also handles playing a sound for new unread notifications.
 * @param {object} props - The component props.
 * @param {React.ReactNode} props.children - The child components to be rendered within the provider's scope.
 * @returns {JSX.Element} The NotificationProvider component.
 */
export const NotificationProvider = ({ children }) => {
  const [user] = useAuthState(auth);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const prevUnreadCountRef = useRef(0);
  const isBellOpenRef = useRef(false); // Ref to track if bell is open
  const processedIdsRef = useRef(new Set()); // Ref to track shown toasts

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
      const notifs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      const newCount = notifs.filter(n => !n.isRead).length;

      // --- Toast & Sound Logic ---
      snapshot.docChanges().forEach((change) => {
        if (change.type === "added" || change.type === "modified") {
          const notification = change.doc.data();

          if (notification.status === 'failed') {
            const notificationTime = notification.createdAt.toDate();
            const now = Timestamp.now().toDate();
            const secondsSinceNotification = (now.getTime() - notificationTime.getTime()) / 1000;

            if (secondsSinceNotification >= 0 && secondsSinceNotification < 15) {
                if (!processedIdsRef.current.has(change.doc.id)) {
                    toast.error(notification.message || "A background process failed. Please check your notifications.");
                    processedIdsRef.current.add(change.doc.id);
                }
            }
          }
          else if (change.type === "added" && !isBellOpenRef.current) {
            audio.play().catch(error => {
              console.warn("Audio play failed (likely due to browser policy):", error);
            });
          }
        }
      });
      // --- END Toast & Sound Logic ---

      setNotifications(notifs);
      setUnreadCount(newCount);
    }, (error) => {
      console.error("Error fetching notifications:", error);
    });

    return () => unsubscribe();
  }, [user]);

  const setIsBellOpen = (isOpen) => {
      isBellOpenRef.current = isOpen;
  };

  /**
   * Marks a specific notification as read in the database.
   * @param {string} id - The ID of the notification to mark as read.
   * @returns {Promise<void>} A promise that resolves when the notification is marked as read.
   */
  const markAsRead = async (id) => {
    if (typeof id !== 'string' || id.trim() === '') {
      throw new TypeError('Notification ID must be a non-empty string.');
    }
    const docRef = doc(db, `users/${user.uid}/notifications`, id);
    try {
      await updateDoc(docRef, { isRead: true });
    } catch (error) {
      console.error("Error marking notification as read:", error);
    }
  };

  /**
   * Clears (deletes) a specific notification from the database.
   * @param {string} id - The ID of the notification to clear.
   * @returns {Promise<void>} A promise that resolves when the notification is cleared.
   */
  const clearNotification = async (id) => {
    if (typeof id !== 'string' || id.trim() === '') {
      throw new TypeError('Notification ID must be a non-empty string.');
    }
    const docRef = doc(db, `users/${user.uid}/notifications`, id);
    try {
      await deleteDoc(docRef);
    } catch (error) {
      console.error("Error clearing notification:", error);
    }
  };

  /**
   * Clears (deletes) all notifications for the current user from the database.
   * @returns {Promise<void>} A promise that resolves when all notifications are cleared.
   */
  const clearAll = async () => {
    try {
      await Promise.all(notifications.map(async (notif) => {
        if (notif.id) {
          await clearNotification(notif.id);
        }
      }));
    } catch (error) {
      console.error("Error clearing all notifications:", error);
    }
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

// Custom hook to use the context
export const useNotifications = () => {
  return useContext(NotificationContext);
};