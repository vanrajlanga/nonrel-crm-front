import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Axios from '../../services/api';
import './usermanagement.css';

const CreateUserModal = ({ onClose, onSave, token }) => {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('user');

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const config = {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
      };
      await Axios.post('/users', { username, email, password, role }, config);
      onSave();
      onClose();
    } catch (error) {
      console.error('Error creating user:', error);
      alert(error.response?.data?.message || 'Failed to create user');
    }
  };

  return (
    <div className="modal">
      <div className="modal-content">
        <h3>Create New User</h3>
        <form onSubmit={handleSubmit}>
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="Username"
            required
          />
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email"
            required
          />
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password"
            required
          />
          <select value={role} onChange={(e) => setRole(e.target.value)}>
            <option value="user">User</option>
            <option value="team">Team</option>
            <option value="admin">Admin</option>
          </select>
          <div className="modal-actions">
            <button type="submit">Create</button>
            <button type="button" onClick={onClose}>Cancel</button>
          </div>
        </form>
      </div>
    </div>
  );
};

const EditUserModal = ({ user, onClose, onSave, token }) => {
  const [username, setUsername] = useState(user.username);
  const [email, setEmail] = useState(user.email);
  const [password, setPassword] = useState('');
  const [role, setRole] = useState(user.role);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const config = {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
      };
      const updateData = {
        username,
        email,
        role,
        ...(password && { password })
      };
      await Axios.put(`/users/${user._id}`, updateData, config);
      onSave();
      onClose();
    } catch (error) {
      console.error('Error updating user:', error);
      alert(error.response?.data?.message || 'Failed to update user');
    }
  };

  return (
    <div className="modal">
      <div className="modal-content">
        <h3>Edit User</h3>
        <form onSubmit={handleSubmit}>
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="Username"
          />
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email"
          />
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="New Password (optional)"
          />
          <select value={role} onChange={(e) => setRole(e.target.value)}>
            <option value="user">User</option>
            <option value="team">Team</option>
            <option value="admin">Admin</option>
          </select>
          <div className="modal-actions">
            <button type="submit">Save</button>
            <button type="button" onClick={onClose}>Cancel</button>
          </div>
        </form>
      </div>
    </div>
  );
};

const DeleteConfirmationModal = ({ user, onClose, onConfirm }) => {
  return (
    <div className="modal">
      <div className="modal-content delete-confirmation">
        <h3>Confirm Delete</h3>
        <p>Are you sure you want to delete user "{user.username}"?</p>
        <div className="modal-actions">
          <button onClick={onConfirm} className="delete-btn">Delete</button>
          <button onClick={onClose}>Cancel</button>
        </div>
      </div>
    </div>
  );
};

const UserManagement = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [deleteUser, setDeleteUser] = useState(null);
  const navigate = useNavigate();
  
  // Get token directly using the correct key
  const token = localStorage.getItem('token');
  const role = localStorage.getItem('role');
  
  console.log('Token:', token);
  console.log('Role:', role);

  useEffect(() => {
    if (!token || role !== 'admin') {
      setError('Unauthorized access');
      setLoading(false);
      return;
    }
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const config = {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
      };
      const { data } = await Axios.get('/users', config);
      setUsers(data);
    } catch (error) {
      console.error('API Error:', error);
      setError('Failed to fetch users');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteClick = (user) => {
    setDeleteUser(user);
  };

  const confirmDelete = async () => {
    try {
      const config = {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      };
      await Axios.delete(`/users/${deleteUser._id}`, config);
      fetchUsers();
      setDeleteUser(null);
    } catch (error) {
      console.error('Error deleting user:', error);
      alert('Failed to delete user');
    }
  };

  const handleEditClick = (user) => {
    setSelectedUser(user);
    setIsEditModalOpen(true);
  };

  return (
    <div className="user-management-container">
      <div className="header-actions">
        <h2>User Management</h2>
        <button 
          className="add-user-btn"
          onClick={() => setIsCreateModalOpen(true)}
        >
          Add User
        </button>
      </div>
      {loading && <p>Loading users...</p>}
      {error && <p className="error-message">{error}</p>}
      {!loading && !error && (
        <div className="users-list">
          {users.map((user) => (
            <div key={user._id} className="user-card">
              <div className="user-info">
                <h3>{user.username}</h3>
                <p>{user.email}</p>
                <p>Role: {user.role}</p>
                <p>Created: {new Date(user.createdAt).toLocaleDateString()}</p>
              </div>
              <div className="user-actions">
                <button onClick={() => handleEditClick(user)}>
                  Edit
                </button>
                <button 
                  onClick={() => handleDeleteClick(user)}
                  className="delete-btn"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
      {isCreateModalOpen && (
        <CreateUserModal
          onClose={() => setIsCreateModalOpen(false)}
          onSave={fetchUsers}
          token={token}
        />
      )}
      {isEditModalOpen && selectedUser && (
        <EditUserModal
          user={selectedUser}
          onClose={() => setIsEditModalOpen(false)}
          onSave={fetchUsers}
          token={token}
        />
      )}
      {deleteUser && (
        <DeleteConfirmationModal
          user={deleteUser}
          onClose={() => setDeleteUser(null)}
          onConfirm={confirmDelete}
        />
      )}
    </div>
  );
};

export default UserManagement;