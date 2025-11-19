import React, { useState, useEffect } from 'react';
import { getUsers, updateUserRole, removeUserAccess } from '../services/userService';
import { auth } from '../firebase';
import ActivityLogModal from '../components/ActivityLogModal';

const AdminRoleManagement = () => {
  const [users, setUsers] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [selectedUser, setSelectedUser] = useState(null);

  useEffect(() => {
    const fetchUsers = async () => {
      const userList = await getUsers();
      setUsers(userList);
    };
    fetchUsers();

    const unsubscribe = auth.onAuthStateChanged(user => {
      setCurrentUser(user);
    });
    return unsubscribe;
  }, []);

  const handlePromote = async (userId, userEmail) => {
    await updateUserRole(userId, userEmail, 'Superadmin', currentUser.uid, currentUser.email);
    const userList = await getUsers();
    setUsers(userList);
  };

  const handleDemote = async (userId, userEmail) => {
    await updateUserRole(userId, userEmail, 'Admin', currentUser.uid, currentUser.email);
    const userList = await getUsers();
    setUsers(userList);
  };

  const handleRemoveAccess = async (userId, userEmail) => {
    await removeUserAccess(userId, userEmail, currentUser.uid, currentUser.email);
    const userList = await getUsers();
    setUsers(userList);
  };

  return (
    <section>
      <h2 className="text-2xl font-semibold mb-4">Role Access Management</h2>
      <p>Manage admin roles and permissions within the application.</p>
      <div className="mt-6">
        <table className="min-w-full bg-white">
          <thead>
            <tr>
              <th className="py-2 px-4 border-b">Name</th>
              <th className="py-2 px-4 border-b">Email</th>
              <th className="py-2 px-4 border-b">Role</th>
              <th className="py-2 px-4 border-b">Last activity</th>
              <th className="py-2 px-4 border-b">Last login</th>
              <th className="py-2 px-4 border-b">Actions</th>
              <th className="py-2 px-4 border-b">Remove access</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user.id}>
                <td className="py-2 px-4 border-b">{user.name}</td>
                <td className="py-2 px-4 border-b">{user.email}</td>
                <td className="py-2 px-4 border-b">{user.role}</td>
                <td className="py-2 px-4 border-b">{user.lastActivity}</td>
                <td className="py-2 px-4 border-b">{user.lastLogin}</td>
                <td className="py-2 px-4 border-b">
                  {user.role === 'Admin' && (
                    <button onClick={() => handlePromote(user.id, user.email)} className="bg-green-500 text-white px-2 py-1 rounded">Promote</button>
                  )}
                  {user.role === 'Superadmin' && (
                    <button onClick={() => handleDemote(user.id, user.email)} className="bg-yellow-500 text-white px-2 py-1 rounded">Demote</button>
                    )}
                    <button onClick={() => setSelectedUser(user)} className="bg-blue-500 text-white px-2 py-1 rounded ml-2">View Full Log</button>
                  </td>
                  <td className="py-2 px-4 border-b">
                    <button onClick={() => handleRemoveAccess(user.id, user.email)} className="bg-red-500 text-white px-2 py-1 rounded">Remove</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {selectedUser && <ActivityLogModal userId={selectedUser.id} userEmail={selectedUser.email} onClose={() => setSelectedUser(null)} />}
    </section>
  );
};

export default AdminRoleManagement;