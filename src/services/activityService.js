import { db, auth } from '../firebase';
import { collection, addDoc, serverTimestamp, query, where, orderBy, limit, startAfter, getDocs } from 'firebase/firestore';

export const logActivity = async (userId, userEmail, action, details) => {
  try {
    await addDoc(collection(db, 'activity_logs'), {
      timestamp: serverTimestamp(),
      userId,
      userEmail,
      action,
      details,
    });
  } catch (error) {
    console.error('Error logging activity:', error);
  }
};

export const getActivityLogs = async (userId, startAfterDoc = null) => {
  try {
    let q = query(
      collection(db, 'activity_logs'),
      where('userId', '==', userId),
      orderBy('timestamp', 'desc'),
      limit(10)
    );

    if (startAfterDoc) {
      q = query(q, startAfter(startAfterDoc));
    }

    const querySnapshot = await getDocs(q);
    const logs = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    const lastVisible = querySnapshot.docs[querySnapshot.docs.length - 1];

    return { logs, lastVisible };
  } catch (error) {
    console.error('Error fetching activity logs:', error);
    return { logs: [], lastVisible: null };
  }
};

export const getActivityLogCount = async (userId) => {
  try {
    const token = await auth.currentUser.getIdToken();
    const response = await fetch('/.netlify/functions/getActivityLogCount', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ userId }),
    });
    if (!response.ok) {
      throw new Error('Failed to fetch activity log count');
    }
    const { count } = await response.json();
    return count;
  } catch (error) {
    console.error('Error fetching activity log count:', error);
    return 0;
  }
};