import admin from 'firebase-admin';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const serviceAccount = require('../service-account.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();

const revokeAllAdminRoles = async () => {
  const usersSnapshot = await db.collection('users').get();
  const batch = db.batch();

  usersSnapshot.forEach(doc => {
    const userRef = db.collection('users').doc(doc.id);
    batch.update(userRef, { role: 'User' });
  });

  await batch.commit();
  console.log('All admin roles have been revoked.');
};

revokeAllAdminRoles().catch(console.error);