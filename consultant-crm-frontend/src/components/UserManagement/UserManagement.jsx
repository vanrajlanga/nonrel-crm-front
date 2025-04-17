import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Axios from '../../services/api';
import './usermanagement.css';
import { BsArrowLeft, BsPersonPlus, BsPencil, BsTrash } from 'react-icons/bs';
import Filter from '../Filter';

const CreateUserModal = ({ onClose, onSave, token }) => {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('Candidate');

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
    <div className="user-mgmt-modal">
      <div className="user-mgmt-modal-content">
        <h3 className="user-mgmt-modal-title">Create New User</h3>
        <form className="user-mgmt-form" onSubmit={handleSubmit}>
          <input
            className="user-mgmt-input"
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="Username"
            required
          />
          <input
            className="user-mgmt-input"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email"
            required
          />
          <input
            className="user-mgmt-input"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password"
            required
          />
          <select 
            className="user-mgmt-select"
            value={role} 
            onChange={(e) => setRole(e.target.value)}
          >
            <option value="Candidate">Candidate</option>
            <option value="teamLead">Team Lead</option>
            <option value="coordinator">Coordinator</option>
            <option value="resumeBuilder">Resume Builder</option>
            <option value="Accounts">Accounts</option>
            <option value="Operational Manager">Operational Manager</option>
            <option value="HR">HR</option>
            <option value="admin">Admin</option>
            <option value="superAdmin">Super Admin</option>
          </select>
          <div className="user-mgmt-modal-actions">
            <button type="button" className="user-mgmt-modal-btn user-mgmt-modal-btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="user-mgmt-modal-btn user-mgmt-modal-btn-primary">
              Create
            </button>
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
      
      if (!user.id) {
        throw new Error('User ID is missing');
      }
      
      await Axios.put(`/users/${user.id}`, updateData, config);
      onSave();
      onClose();
    } catch (error) {
      console.error('Error updating user:', error);
      alert(error.message || error.response?.data?.message || 'Failed to update user');
    }
  };

  return (
    <div className="user-mgmt-modal">
      <div className="user-mgmt-modal-content">
        <h3 className="user-mgmt-modal-title">Edit User</h3>
        <form className="user-mgmt-form" onSubmit={handleSubmit}>
          <input
            className="user-mgmt-input"
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="Username"
            required
          />
          <input
            className="user-mgmt-input"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email"
            required
          />
          <input
            className="user-mgmt-input"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="New Password (optional)"
          />
          <select 
            className="user-mgmt-select"
            value={role} 
            onChange={(e) => setRole(e.target.value)}
          >
            <option value="Candidate">Candidate</option>
            <option value="teamLead">Team Lead</option>
            <option value="coordinator">Coordinator</option>
            <option value="resumeBuilder">Resume Builder</option>
            <option value="Accounts">Accounts</option>
            <option value="Operational Manager">Operational Manager</option>
            <option value="HR">HR</option>
            <option value="admin">Admin</option>
            <option value="superAdmin">Super Admin</option>
          </select>
          <div className="user-mgmt-modal-actions">
            <button type="button" className="user-mgmt-modal-btn user-mgmt-modal-btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="user-mgmt-modal-btn user-mgmt-modal-btn-primary">
              Save Changes
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const DeleteConfirmationModal = ({ user, onClose, onConfirm }) => {
  return (
    <div className="user-mgmt-modal">
      <div className="user-mgmt-modal-content">
        <h3 className="user-mgmt-modal-title">Confirm Delete</h3>
        <p>Are you sure you want to delete user "{user.username}"?</p>
        <div className="user-mgmt-modal-actions">
          <button className="user-mgmt-modal-btn user-mgmt-modal-btn-secondary" onClick={onClose}>
            Cancel
          </button>
          <button className="user-mgmt-modal-btn user-mgmt-modal-btn-primary" onClick={onConfirm}>
            Delete
          </button>
        </div>
      </div>
    </div>
  );
};

const UserManagement = () => {
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [deleteUser, setDeleteUser] = useState(null);
  const navigate = useNavigate();
  
  const token = localStorage.getItem('token');
  const role = localStorage.getItem('role');

  const filterConfig = [
    {
      name: 'role',
      label: 'Role',
      type: 'select',
      defaultValue: 'all',
      options: [
        { value: 'all', label: 'All Roles' },
        { value: 'superAdmin', label: 'Super Admin' },
        { value: 'admin', label: 'Admin' },
        { value: 'coordinator', label: 'Coordinator' },
        { value: 'teamLead', label: 'Team Lead' },
        { value: 'resumeBuilder', label: 'Resume Builder' },
        { value: 'Candidate', label: 'Candidate' },
        { value: 'Accounts', label: 'Accounts' },
        { value: 'HR', label: 'HR' },
        { value: 'Operational Manager', label: 'Operational Manager' }
      ]
    }
  ];

  useEffect(() => {
    if (!token || role !== 'superAdmin') {
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
      const response = await Axios.get('/users', config);
      const userData = response.data?.users || response.data || [];
      
      if (!Array.isArray(userData)) {
        console.warn('API response is not an array:', userData);
        setUsers([]);
        setFilteredUsers([]);
        return;
      }
      
      setUsers(userData);
      setFilteredUsers(userData);
    } catch (error) {
      console.error('API Error:', error);
      setError('Failed to fetch users');
      setUsers([]);
      setFilteredUsers([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSearchChange = (searchValue) => {
    applyFiltersAndSearch(searchValue);
  };

  const applyFiltersAndSearch = (search = '', filterOptions = {}) => {
    let filtered = [...users];
    
    // Apply search filter
    if (search.trim() !== '') {
      const searchLower = search.toLowerCase();
      filtered = filtered.filter(user => 
        user.username?.toLowerCase().includes(searchLower) ||
        user.email?.toLowerCase().includes(searchLower)
      );
    }
    
    // Apply role filter
    if (filterOptions.role && filterOptions.role !== 'all') {
      filtered = filtered.filter(user => user.role === filterOptions.role);
    }

    // Apply date range filter
    if (filterOptions.registrationDateFrom || filterOptions.registrationDateTo) {
      const fromDate = filterOptions.registrationDateFrom ? new Date(filterOptions.registrationDateFrom) : null;
      const toDate = filterOptions.registrationDateTo ? new Date(filterOptions.registrationDateTo) : null;
      
      filtered = filtered.filter(user => {
        const registrationDate = new Date(user.createdAt);
        
        if (fromDate && toDate) {
          return registrationDate >= fromDate && registrationDate <= toDate;
        } else if (fromDate) {
          return registrationDate >= fromDate;
        } else if (toDate) {
          return registrationDate <= toDate;
        }
        return true;
      });
    }
    
    setFilteredUsers(filtered);
  };

  const handleFilterApplied = (filterOptions) => {
    applyFiltersAndSearch('', filterOptions);
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
      await Axios.delete(`/users/${deleteUser.id}`, config);
      fetchUsers();
      setDeleteUser(null);
    } catch (error) {
      console.error('Error deleting user:', error);
      alert('Failed to delete user');
    }
  };

  const handleEditClick = (user) => {
    if (!user.id) {
      console.error('User ID is missing:', user);
      alert('Cannot edit user: ID is missing');
      return;
    }
    setSelectedUser(user);
    setIsEditModalOpen(true);
  };

  if (loading) {
    return (
      <div className="user-mgmt-container">
        <div className="user-mgmt-loading">
          <div className="user-mgmt-spinner"></div>
          <p>Loading users...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="user-mgmt-container">
      <button 
        className="user-mgmt-back-btn"
        onClick={() => navigate('/consultants')}
      >
        <BsArrowLeft /> Back to Consultants
      </button>
      
      <div className="user-mgmt-header">
        <div className="user-mgmt-header-actions">
          <h2 className="user-mgmt-title">User Management</h2>
          <button 
            className="user-mgmt-add-btn"
            onClick={() => setIsCreateModalOpen(true)}
          >
            <BsPersonPlus /> Add User
          </button>
        </div>
      </div>

      <div className="user-mgmt-filter">
        <Filter 
          onFilterApplied={handleFilterApplied}
          filterConfig={filterConfig}
          onSearch={handleSearchChange}
          searchPlaceholder="Search by username or email..."
        />
      </div>

      {error && <div className="user-mgmt-error">{error}</div>}

      <div className="user-mgmt-list">
        {filteredUsers.map((user) => (
          <div 
            key={user.id} 
            className="user-mgmt-card"
            data-role={user.role}
          >
            <div className="user-mgmt-info">
              <div className="user-mgmt-info-item">
                <span className="user-mgmt-info-label">Username</span>
                <span className="user-mgmt-info-value">{user.username}</span>
              </div>
              <div className="user-mgmt-info-item">
                <span className="user-mgmt-info-label">Email</span>
                <span className="user-mgmt-info-value">{user.email}</span>
              </div>
              <div className="user-mgmt-info-item">
                <span className="user-mgmt-info-label">Role</span>
                <span className={`user-mgmt-role user-mgmt-role-${user.role}`}>
                  {user.role}
                </span>
              </div>
              <div className="user-mgmt-info-item">
                <span className="user-mgmt-info-label">Created</span>
                <span className="user-mgmt-info-value">
                  {new Date(user.createdAt).toLocaleDateString()}
                </span>
              </div>
            </div>
            <div className="user-mgmt-actions">
              <button 
                onClick={() => handleEditClick(user)}
                className="user-mgmt-btn user-mgmt-btn-edit"
              >
                <BsPencil /> Edit
              </button>
              <button 
                onClick={() => handleDeleteClick(user)}
                className="user-mgmt-btn user-mgmt-btn-delete"
              >
                <BsTrash /> Delete
              </button>
            </div>
          </div>
        ))}
        
        {filteredUsers.length === 0 && !loading && (
          <div className="user-mgmt-card" style={{ justifyContent: 'center' }}>
            <p style={{ margin: 0, color: '#718096' }}>No users found</p>
          </div>
        )}
      </div>

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