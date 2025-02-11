import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const AdminLogin = () => {
    const [firstName, setFirstName] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const navigate = useNavigate();

    const handleLogin = async (e) => {
        e.preventDefault();

        try {
            // Send a request to your backend to authenticate the admin
            const response = await fetch('https://book-man-b65d9d654296.herokuapp.com/admin/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ firstName, password }),
            });

            if (response.ok) {
                const data = await response.json();
                console.log('Login successful:', data);

                // Store the admin ID in localStorage (or sessionStorage)
                localStorage.setItem('adminId', data.adminId); // Replace with the actual admin ID from the response

                // Redirect to the admin dashboard
                navigate('/admin/dashboard');
            } else {
                const errorData = await response.json();
                setError(errorData.error || 'Invalid credentials');
            }
        } catch (err) {
            setError('An error occurred. Please try again.');
        }
    };

    return (
        <div className="flex items-center justify-center min-h-screen bg-gray-100">
            <div className="w-full max-w-md p-8 space-y-6 bg-white rounded shadow-md">
                <h1 className="text-2xl font-bold text-center">Admin Login</h1>
                <form onSubmit={handleLogin} className="space-y-4">
                    <input
                        type="text"
                        placeholder="First Name"
                        value={firstName}
                        onChange={(e) => setFirstName(e.target.value)}
                        required
                        className="w-full px-4 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <input
                        type="password"
                        placeholder="Password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        className="w-full px-4 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <button
                        type="submit"
                        className="w-full px-4 py-2 font-bold text-white bg-blue-500 rounded hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                        Login
                    </button>
                </form>
                {error && <p className="mt-4 text-center text-red-500">{error}</p>}
            </div>
        </div>
    );
};

export default AdminLogin;