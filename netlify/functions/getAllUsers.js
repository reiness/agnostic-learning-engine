import admin from 'firebase-admin';

// Initialize Firebase Admin SDK
const serviceAccount = JSON.parse(Buffer.from(process.env.FIREBASE_SERVICE_ACCOUNT_BASE64, 'base64').toString('utf-8'));
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}

export const handler = async (event, context) => {
  try {
    const listUsersResult = await admin.auth().listUsers();
    const users = await Promise.all(listUsersResult.users.map(async (userRecord) => {
      const { uid, email, displayName, metadata } = userRecord;
      const { lastSignInTime } = metadata;

      const db = admin.firestore();
      const lastActivitySnapshot = await db.collection('activity_logs')
        .where('userId', '==', uid)
        .orderBy('timestamp', 'desc')
        .limit(1)
        .get();

      const lastActivity = lastActivitySnapshot.docs.length > 0
        ? lastActivitySnapshot.docs[0].data().action
        : 'No activity yet';

      return {
        id: uid,
        email,
        name: displayName || 'N/A',
        lastLogin: lastSignInTime,
        lastActivity,
      };
    }));

    const db = admin.firestore();
    const usersFromDb = await db.collection('users').get();
    const usersWithRoles = users.map(user => {
        const dbUser = usersFromDb.docs.find(doc => doc.id === user.id);
        return {
            ...user,
            role: dbUser ? dbUser.data().role || 'Admin' : 'Admin',
        }
    });

    const regularUsers = usersWithRoles.filter(user => user.role !== 'Admin' && user.role !== 'Superadmin');

    return {
      statusCode: 200,
      body: JSON.stringify(regularUsers),
    };
  } catch (error) {
    console.error('Error fetching users:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Failed to fetch users' }),
    };
  }
};