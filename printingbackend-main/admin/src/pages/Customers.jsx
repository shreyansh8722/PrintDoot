import React, { useState, useEffect } from 'react';
import { adminUserAPI } from '../services/api';
import { useDataCache } from '../contexts/DataCacheContext';
import CreateUserModal from '../components/CreateUserModal';
import './Customers.css';

const Customers = () => {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedUser, setSelectedUser] = useState(null);
    const [showModal, setShowModal] = useState(false);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const { fetchUsers, invalidateCache } = useDataCache();

    useEffect(() => {
        fetchUsersData();
    }, []);

    const fetchUsersData = async (forceRefresh = false) => {
        try {
            setLoading(true);
            const { data, fromCache } = await fetchUsers({ search: searchTerm }, forceRefresh);
            setUsers(data);

            // Show indicator if data is from cache
            if (fromCache && !forceRefresh) {
                console.log('📦 Loaded from cache');
            }
        } catch (error) {
            console.error('Error fetching users:', error);
            if (error.response?.status === 401) {
                alert('Authentication required. Please login.');
            }
        } finally {
            setLoading(false);
        }
    };

    const handleSearch = (e) => {
        e.preventDefault();
        fetchUsersData(true); // Force refresh on search
    };

    const handleRefresh = () => {
        invalidateCache(['users']);
        fetchUsersData(true);
    };

    const handleToggleActive = async (user) => {
        try {
            if (user.is_active) {
                await adminUserAPI.deactivateUser(user.id);
            } else {
                await adminUserAPI.activateUser(user.id);
            }
            invalidateCache(['users']);
            fetchUsersData(true);
        } catch (error) {
            console.error('Error toggling user status:', error);
            alert('Failed to update user status');
        }
    };

    const handleDelete = async (userId) => {
        if (window.confirm('Are you sure you want to delete this user?')) {
            try {
                await adminUserAPI.deleteUser(userId);
                invalidateCache(['users']);
                fetchUsersData(true);
            } catch (error) {
                console.error('Error deleting user:', error);
                alert('Failed to delete user');
            }
        }
    };

    const openUserModal = (user) => {
        setSelectedUser(user);
        setShowModal(true);
    };

    if (loading) {
        return <div className="loading">Loading users...</div>;
    }

    return (
        <div className="customers-page">
            <div className="page-header">
                <h1>Customer Management</h1>
                <div className="header-actions">
                    <form onSubmit={handleSearch} className="search-bar">
                        <input
                            type="text"
                            placeholder="Search by username, email, or company..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                        <button type="submit">Search</button>
                    </form>
                    <button onClick={handleRefresh} className="btn-refresh" title="Refresh Data">
                        🔄 Refresh
                    </button>
                    <button onClick={() => setShowCreateModal(true)} className="btn-primary">
                        + Create User
                    </button>
                </div>
            </div>

            <div className="users-table-container">
                <table className="users-table">
                    <thead>
                        <tr>
                            <th>ID</th>
                            <th>Username</th>
                            <th>Email</th>
                            <th>Company</th>
                            <th>Status</th>
                            <th>Joined</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {users.length === 0 ? (
                            <tr>
                                <td colSpan="7" style={{ textAlign: 'center', padding: '40px', color: '#6b7280' }}>
                                    No users found. Try a different search term.
                                </td>
                            </tr>
                        ) : (
                            users.map((user) => (
                                <tr key={user.id}>
                                    <td>{user.id}</td>
                                    <td>{user.username}</td>
                                    <td>{user.email}</td>
                                    <td>{user.company_name || '-'}</td>
                                    <td>
                                        <span className={`status-badge ${user.is_active ? 'active' : 'inactive'}`}>
                                            {user.is_active ? 'Active' : 'Inactive'}
                                        </span>
                                    </td>
                                    <td>{new Date(user.date_joined).toLocaleDateString()}</td>
                                    <td>
                                        <div className="action-buttons">
                                            <button onClick={() => openUserModal(user)} className="btn-view">
                                                View
                                            </button>
                                            <button
                                                onClick={() => handleToggleActive(user)}
                                                className="btn-toggle"
                                            >
                                                {user.is_active ? 'Deactivate' : 'Activate'}
                                            </button>
                                            <button onClick={() => handleDelete(user.id)} className="btn-delete">
                                                Delete
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {showModal && selectedUser && (
                <div className="modal-overlay" onClick={() => setShowModal(false)}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2>User Details</h2>
                            <button onClick={() => setShowModal(false)} className="modal-close">
                                ×
                            </button>
                        </div>
                        <div className="modal-body">
                            <div className="detail-row">
                                <label>Username:</label>
                                <span>{selectedUser.username}</span>
                            </div>
                            <div className="detail-row">
                                <label>Email:</label>
                                <span>{selectedUser.email}</span>
                            </div>
                            <div className="detail-row">
                                <label>Full Name:</label>
                                <span>{`${selectedUser.first_name} ${selectedUser.last_name}`}</span>
                            </div>
                            <div className="detail-row">
                                <label>Company:</label>
                                <span>{selectedUser.company_name || 'N/A'}</span>
                            </div>
                            <div className="detail-row">
                                <label>Phone:</label>
                                <span>{selectedUser.phone || 'N/A'}</span>
                            </div>
                            <div className="detail-row">
                                <label>Status:</label>
                                <span className={selectedUser.is_active ? 'text-success' : 'text-danger'}>
                                    {selectedUser.is_active ? 'Active' : 'Inactive'}
                                </span>
                            </div>
                            <div className="detail-row">
                                <label>Joined:</label>
                                <span>{new Date(selectedUser.date_joined).toLocaleString()}</span>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <CreateUserModal
                isOpen={showCreateModal}
                onClose={() => setShowCreateModal(false)}
                onUserCreated={() => {
                    invalidateCache(['users']);
                    fetchUsersData(true);
                }}
            />
        </div>
    );
};

export default Customers;
