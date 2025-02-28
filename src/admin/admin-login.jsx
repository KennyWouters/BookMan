import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { API_URL } from "../utils/api.js";

const AdminLogin = () => {
    const [firstName, setFirstName] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const navigate = useNavigate();

    const handleLogin = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');

        try {
            const response = await fetch(`${API_URL}/admin/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ firstName, password }),
            });

            if (response.ok) {
                const data = await response.json();
                console.log('Login successful:', data);
                localStorage.setItem('adminId', data.adminId);
                navigate('/admin/dashboard');
            } else {
                const errorData = await response.json();
                setError(errorData.error || 'Identifiants invalides');
            }
        } catch (err) {
            setError('Une erreur est survenue. Veuillez réessayer.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50 flex items-center justify-center px-4 sm:px-6 lg:px-8">
            <div className="w-full max-w-md">
                {/* Back to Home Button */}
                <div className="mb-8">
                    <button
                        onClick={() => navigate("/")}
                        className="text-gray-600 hover:text-gray-900 flex items-center space-x-2 transition-colors duration-200"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
                        </svg>
                        <span>Retour à l'accueil</span>
                    </button>
                </div>

                {/* Login Card */}
                <div className="bg-white shadow-2xl rounded-2xl border border-gray-100 p-8 space-y-8">
                    <div className="text-center">
                        <h1 className="text-2xl font-bold text-gray-900">Espace administrateur</h1>
                        <p className="mt-2 text-gray-600">Connectez-vous pour gérer les réservations</p>
                    </div>

                    <form onSubmit={handleLogin} className="space-y-6">
                        <div className="space-y-2">
                            <label className="block text-sm font-medium text-gray-700">
                                Prénom
                            </label>
                            <input
                                type="text"
                                value={firstName}
                                onChange={(e) => setFirstName(e.target.value)}
                                required
                                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-100 focus:border-blue-500 transition-colors duration-200"
                                placeholder="Entrez votre prénom"
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="block text-sm font-medium text-gray-700">
                                Mot de passe
                            </label>
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-100 focus:border-blue-500 transition-colors duration-200"
                                placeholder="Entrez votre mot de passe"
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full py-4 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-all duration-300 flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-[1.02] focus:ring-4 focus:ring-blue-200"
                        >
                            {isLoading ? (
                                <>
                                    <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                    </svg>
                                    <span>Connexion en cours...</span>
                                </>
                            ) : (
                                <>
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                                    </svg>
                                    <span>Se connecter</span>
                                </>
                            )}
                        </button>
                    </form>

                    {error && (
                        <div className="p-4 bg-red-50 border border-red-200 rounded-xl">
                            <p className="text-center text-red-600 text-sm font-medium">{error}</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default AdminLogin;