// ProtectedRoute.jsx
import { Navigate } from 'react-router-dom';
import PropTypes from 'prop-types';

const ProtectedRoute = ({ children }) => {
    // Check if the admin is authenticated
    const isAuthenticated = localStorage.getItem('adminId'); // Or use session storage

    if (!isAuthenticated) {
        // If not authenticated, redirect to the login page
        return <Navigate to="/admin/login" replace />;
    }

    // If authenticated, render the children (the protected component)
    return children;
};

ProtectedRoute.propTypes = {
    children: PropTypes.node.isRequired,
};

export default ProtectedRoute;