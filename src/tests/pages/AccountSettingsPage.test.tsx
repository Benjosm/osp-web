import { describe, beforeEach, test, expect, vi } from 'vitest';
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { confirmAlert } from 'react-confirm-alert';
import AccountSettingsPage from '../../pages/AccountSettingsPage';
import axios from 'axios';
import * as authService from '../../services/auth.service';

// Mock dependencies
vi.mock('axios');
vi.mock('react-confirm-alert');
vi.mock('../../services/auth.service');

// Mock window object
const mockLocation = { href: '' };
const mockLocalStorage = {
  getItem: vi.fn(),
  removeItem: vi.fn(),
};

describe('AccountSettingsPage - Account Deletion', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Set up window mocks before each test
    Object.defineProperty(window, 'location', {
      writable: true,
      value: mockLocation,
    });
    Object.defineProperty(window, 'localStorage', {
      writable: true,
      value: mockLocalStorage,
    });
    mockLocalStorage.getItem.mockReturnValue('fake-jwt-token');
    mockLocation.href = '';
  });

  test('Clicking "Delete Account" button displays confirmation dialog', () => {
    render(<AccountSettingsPage />);

    const deleteButton = screen.getByRole('button', { name: /Delete Account/i });
    fireEvent.click(deleteButton);

    expect(confirmAlert).toHaveBeenCalledTimes(1);
    expect(confirmAlert).toHaveBeenCalledWith(
      expect.objectContaining({
        title: 'Confirm Account Deletion',
        message: 'Are you sure you want to delete your account? This action cannot be undone.',
      })
    );
  });

  test('Canceling confirmation dialog does not trigger deletion or state change', async () => {
    render(<AccountSettingsPage />);

    const deleteButton = screen.getByRole('button', { name: /Delete Account/i });
    fireEvent.click(deleteButton);

    // Simulate clicking "Cancel" button in dialog
    const cancelButton = { label: 'Cancel', onClick: expect.any(Function) };
    expect(confirmAlert).toHaveBeenCalledWith(
      expect.objectContaining({
        buttons: expect.arrayContaining([expect.objectContaining(cancelButton)]),
      })
    );

    // Extract and call the onClick for Cancel
    const args = (confirmAlert as any).mock.calls[0][0];
    const cancelButtonClick = args.buttons[0].onClick;
    cancelButtonClick();

    // Should not have called axios.delete
    expect(axios.delete).not.toHaveBeenCalled();
    expect(authService.signOut).not.toHaveBeenCalled();
  });

  test('Confirming deletion sends DELETE request and redirects on success', async () => {
    (axios.delete as any).mockResolvedValue({});

    render(<AccountSettingsPage />);

    const deleteButton = screen.getByRole('button', { name: /Delete Account/i });
    fireEvent.click(deleteButton);

    // Simulate clicking "Delete" button in dialog
    const args = (confirmAlert as any).mock.calls[0][0];
    const deleteButtonClick = args.buttons[1].onClick;
    deleteButtonClick();

    await waitFor(() => {
      expect(axios.delete).toHaveBeenCalledWith('/api/v1/users/current', {
        headers: { Authorization: 'Bearer fake-jwt-token' },
      });
    });

    expect(authService.signOut).toHaveBeenCalledTimes(1);
  });

  test('SignOut clears token and redirects to /signin', () => {
    render(<AccountSettingsPage />);

    authService.signOut();

    expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('token');
    expect(mockLocation.href).toBe('/signin');
  });

  test('Network error displays correct message', async () => {
    (axios.delete as any).mockRejectedValue({
      response: null,
    });

    render(<AccountSettingsPage />);

    const deleteButton = screen.getByRole('button', { name: /Delete Account/i });
    fireEvent.click(deleteButton);

    const args = (confirmAlert as any).mock.calls[0][0];
    const deleteButtonClick = args.buttons[1].onClick;
    deleteButtonClick();

    await waitFor(() => {
      expect(confirmAlert).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'Account Deletion Failed',
          message: 'Unable to connect to the server. Please check your internet connection and try again.',
        })
      );
    });
  });

  test.each([
    [401, 'Authentication expired. Please sign in again.'],
    [409, 'Account deletion is already in progress.'],
    [500, 'An error occurred while deleting your account. Please try again later.'],
  ])('HTTP error %s displays correct message', async (status, expectedMessage) => {
    (axios.delete as any).mockRejectedValue({
      response: { status },
    });

    render(<AccountSettingsPage />);

    const deleteButton = screen.getByRole('button', { name: /Delete Account/i });
    fireEvent.click(deleteButton);

    const args = (confirmAlert as any).mock.calls[0][0];
    const deleteButtonClick = args.buttons[1].onClick;
    deleteButtonClick();

    await waitFor(() => {
      expect(confirmAlert).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'Account Deletion Failed',
          message: expectedMessage,
        })
      );
    });
  });
});
