import React, { useState } from 'react';
import axios from 'axios';

const AccountSettingsPage: React.FC = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Get user ID from token (assuming JWT and available in localStorage)
  const getTokenPayload = (token: string) => {
    try {
      return JSON.parse(atob(token.split('.')[1]));
    } catch (e) {
      return null;
    }
  };

  const getUserId = (): string | null => {
    const token = localStorage.getItem('token');
    if (!token) return null;
    const payload = getTokenPayload(token);
    return payload?.userId || payload?.sub || null; // Adjust based on JWT structure
  };

  const handleDeleteAccount = async () => {
    setIsLoading(true);
    setError(null);
    const userId = getUserId();

    if (!userId) {
      setError('User ID not found. Please sign in again.');
      setIsLoading(false);
      return;
    }

    try {
      await axios.delete(`/api/v1/users/${userId}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      });

      // On success: clear token and redirect
      localStorage.removeItem('token');
      window.location.href = '/';
    } catch (err: any) {
      const message =
        err.response?.data?.message || 'Failed to delete account. Please try again.';
      setError(message);
      setIsLoading(false);
    }
  };

  const openModal = () => {
    setIsModalOpen(true);
    setError(null);
  };

  const closeModal = () => {
    if (!isLoading) {
      setIsModalOpen(false);
      setError(null);
    }
  };

  return (
    <div style={{ padding: '2rem' }}>
      <h1>Account Settings</h1>

      <div>
        <h2>Delete Account</h2>
        <p>
          <strong>Warning:</strong> This action is permanent and cannot be undone.
          All your data will be lost.
        </p>
        <button onClick={openModal} disabled={isLoading} style={{ backgroundColor: '#dc3545', color: 'white', border: 'none', padding: '0.5rem 1rem', cursor: 'pointer' }}>
          {isLoading ? 'Loading...' : 'Delete Account'}
        </button>
      </div>

      {/* Confirmation Modal */}
      {isModalOpen && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 1000,
          }}
        >
          <div
            style={{
              background: 'white',
              padding: '2rem',
              borderRadius: '8px',
              width: '90%',
              maxWidth: '500px',
              textAlign: 'center',
            }}
          >
            <h2>Confirm Account Deletion</h2>
            <p>
              <strong>Are you sure?</strong> This action is <strong>permanent</strong> and{' '}
              <strong>cannot be undone</strong>. All your data will be permanently removed.
            </p>

            {error && (
              <div
                style={{
                  color: '#721c24',
                  backgroundColor: '#f8d7da',
                  borderColor: '#f5c6cb',
                  padding: '0.75rem 1.25rem',
                  marginBottom: '1rem',
                  border: '1px solid transparent',
                  borderRadius: '0.25rem',
                }}
              >
                {error}
                <button
                  onClick={() => {
                    setError(null);
                    handleDeleteAccount();
                  }}
                  style={{
                    marginLeft: '0.5rem',
                    padding: '0.25rem 0.5rem',
                    cursor: 'pointer',
                  }}
                >
                  Retry
                </button>
              </div>
            )}

            <div style={{ marginTop: '1.5rem', display: 'flex', justifyContent: 'center', gap: '1rem' }}>
              <button
                onClick={closeModal}
                disabled={isLoading}
                style={{
                  padding: '0.5rem 1rem',
                  backgroundColor: '#6c757d',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteAccount}
                disabled={isLoading}
                style={{
                  padding: '0.5rem 1rem',
                  backgroundColor: '#dc3545',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                }}
              >
                {isLoading ? 'Deleting...' : 'Confirm Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AccountSettingsPage;
