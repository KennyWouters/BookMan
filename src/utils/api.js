// API URL configuration
export const API_URL = process.env.NODE_ENV === 'production' 
    ? 'https://book-man-b65d9d654296.herokuapp.com'  // Replace with your actual production API URL
    : 'http://localhost:3001';

// Helper function for API calls with proper CORS settings
export const fetchWithCors = async (endpoint, options = {}) => {
    const defaultOptions = {
        credentials: 'include',
        headers: {
            'Content-Type': 'application/json',
        },
    };

    const response = await fetch(`${API_URL}${endpoint}`, {
        ...defaultOptions,
        ...options,
        headers: {
            ...defaultOptions.headers,
            ...options.headers,
        },
    });

    if (!response.ok) {
        throw new Error(`API call failed: ${response.statusText}`);
    }

    return response.json();
};