import { doc, getDoc, updateDoc, serverTimestamp, runTransaction } from 'firebase/firestore';
import { db } from '../firebase';

const checkAndResetCredits = async (userId) => {
  const userRef = doc(db, 'users', userId);

  return runTransaction(db, async (transaction) => {
    const userDoc = await transaction.get(userRef);

    if (!userDoc.exists()) {
      // If the user document doesn't exist, create it with default credits.
      transaction.set(userRef, {
        credits: 10,
        lastCreditReset: serverTimestamp(),
      });
      return 10;
    }

    const userData = userDoc.data();
    const { credits, lastCreditReset } = userData;
    const today = new Date();
    const lastResetDate = lastCreditReset?.toDate();

    if (!lastResetDate || lastResetDate.toDateString() !== today.toDateString()) {
      // If credits have not been reset today, reset them to 10.
      transaction.update(userRef, {
        credits: 10,
        lastCreditReset: serverTimestamp(),
      });
      return 10;
    }

    return credits;
  });
};

export { checkAndResetCredits };