import React, { useState } from 'react';
import axios from 'axios';
import { confirmAlert } from 'react-confirm-alert';
import 'react-confirm-alert/src/react-confirm-alert.css';
import authService from '../services/auth.service';

const AccountSettingsPage: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Get user ID from token (assuming JWT and available in localStorage)
  const handleDeleteAccount = async () => {
    setIsLoading(true);
    setError(null);
  
    try {
      await axios.delete(`/api/v1/users/current`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      });

      // On success: clear auth state and redirect
      authService.signOut();
    } catch (err: any) {
      let message = 'An unknown error occurred.';
      let shouldSignOut = false;
      
      if (!err.response) {
        // Network error (e.g., no connection, timeout)
        message = 'Unable to connect to the server. Please check your internet connection and try again.';
      } else {
        switch (err.response.status) {
          case 401:
            // Unauthorized: invalid or expired token
            message = 'Authentication expired. Please sign in again.';
            shouldSignOut = true;
            break;
          case 409:
            // Conflict: deletion already in progress
            message = 'Account deletion is already in progress.';
            break;
          case 500:
            // Internal Server Error
            message = 'An error occurred while deleting your account. Please try again later.';
            break;
          default:
            // Other server errors
            message = 'An error occurred while deleting your account. Please try again later.';
            break;
        }
      }
      
      // Use react-confirm-alert for user-friendly display
      confirmAlert({
        title: 'Account Deletion Failed',
        message: message,
        buttons: [
          {
            label: 'OK',
            onClick: () => {
              if (shouldSignOut) {
                authService.signOut();
              }
            }
          }
        ],
        closeOnClickOutside: true,
        closeOnEscape: true
      });

      setIsLoading(false);
    }
  };

  // No modal state needed — using react-confirm-alert instead

  return (
    <div style={{ padding: '2rem' }}>
      <h1>Account Settings</h1>

      <div>
        <h2>Delete Account</h2>
        <p>
          <strong>Warning:</strong> This action is permanent and cannot be undone.
          All your data will be lost.
        </p>
        <button
          onClick={() => {
            confirmAlert({
              title: 'Confirm Account Deletion',
              message: 'Are you sure you want to delete your account? This action cannot be undone.',
              buttons: [
                {
                  label: 'Cancel',
                  onClick: () => { /* No action needed */ }
                },
                {
                  label: 'Delete',
                  className: 'delete-button',
                  onClick: handleDeleteAccount
                }
              ],
              closeOnClickOutside: false,
              closeOnEscape: false
            });
            setError(null);
          }}
          disabled={isLoading}
          style={{
            backgroundColor: '#dc3545',
            color: 'white',
            border: 'none',
            padding: '0.5rem 1rem',
            cursor: 'pointer',
            marginTop: '0.5rem'
          }}
        >
          {isLoading ? 'Deleting...' : 'Delete Account'}
        </button>
      </div>

            // No modal needed — using react-confirm-alert instead
    </div>
  );
};

export default AccountSettingsPage;
