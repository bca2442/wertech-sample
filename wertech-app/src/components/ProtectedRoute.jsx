import { Navigate } from 'react-router-dom';

export const ProtectedRoute = ({ children, isAdmin = false }) => {
  // Replace this with actual auth logic tonight
  const user = { loggedIn: true, role: 'admin' }; 

  if (!user.loggedIn) {
    return <Navigate to="/login" />;
  }

  if (isAdmin && user.role !== 'admin') {
    return <Navigate to="/dashboard" />;
  }

  return children;
};