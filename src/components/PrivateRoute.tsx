import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';

const PrivateRoute: React.FC<{ children: JSX.Element }> = ({ children }) => {
  const location = useLocation();
  const token = localStorage.getItem('token');

  if (!token) {
    // Redirect to sign-in page if no token exists
    return <Navigate to="/sign-in" state={{ from: location }} replace />;
  }

  // Render the requested component if authenticated
  return children;
};

export default PrivateRoute;
