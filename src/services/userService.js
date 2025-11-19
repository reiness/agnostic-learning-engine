import { db } from '../firebase';
import { doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { logActivity } from './activityService';

export const getUsers = async () => {
  try {
    const response = await fetch('/.netlify/functions/getUsers');
    if (!response.ok) {
      throw new Error('Failed to fetch users');
    }
    const users = await response.json();
    return users;
  } catch (error) {
    console.error('Error fetching users:', error);
    return [];
  }
};

export const updateUserRole = async (userId, userEmail, newRole, adminId, adminEmail) => {
  const userDoc = doc(db, 'users', userId);
  await updateDoc(userDoc, { role: newRole });
  await logActivity(adminId, adminEmail, newRole === 'Superadmin' ? 'promote_user' : 'demote_user', { userId, userEmail, newRole });
};

export const removeUserAccess = async (userId, userEmail, adminId, adminEmail) => {
  const userDoc = doc(db, 'users', userId);
  await deleteDoc(userDoc);
  await logActivity(adminId, adminEmail, 'remove_access', { userId, userEmail });
};

export const getAllUsers = async () => {
  try {
    const response = await fetch('/.netlify/functions/getAllUsers');
    if (!response.ok) {
      throw new Error('Failed to fetch all users');
    }
    const users = await response.json();
    return users;
  } catch (error) {
    console.error('Error fetching all users:', error);
    return [];
  }
};