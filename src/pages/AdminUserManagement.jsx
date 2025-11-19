import React, { useState, useEffect } from 'react';
import { getAllUsers } from '../services/userService';
import ActivityLogModal from '../components/ActivityLogModal';

const AdminUserManagement = () => {
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);

  useEffect(() => {
    const fetchUsers = async () => {
      const userList = await getAllUsers();
      setUsers(userList);
    };
    fetchUsers();
  }, []);

  return (
    <section>
      <h2 className="text-2xl font-semibold mb-4">User Management</h2>
      <p>View all users in the application.</p>
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
                  <button onClick={() => setSelectedUser(user)} className="bg-blue-500 text-white px-2 py-1 rounded">View Full Log</button>
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

export default AdminUserManagement;