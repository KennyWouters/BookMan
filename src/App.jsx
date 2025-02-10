// App.jsx
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import AdminLogin from './admin/admin-login';
import AdminDashboard from './admin/admin-dashboard';
import Home from './Home';
import ProtectedRoute from './ProtectedRoute.jsx'; // Import the ProtectedRoute component

function App() {
    return (
        <Router>
            <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/admin/login" element={<AdminLogin />} />
                <Route
                    path="/admin/dashboard"
                    element={
                        <ProtectedRoute>
                            <AdminDashboard />
                        </ProtectedRoute>
                    }
                />
            </Routes>
        </Router>
    );
}

export default App;