// API URL configuration
export const API_URL = process.env.NODE_ENV === 'production' 
    ? 'https://book-man-b65d9d654296.herokuapp.com'  // Replace with your actual production API URL
    : 'http://localhost:3001';

// Helper function for API calls with proper CORS settings
export const fetchWithCors = async (endpoint, options = {}, retryCount = 3) => {
    const defaultOptions = {
        credentials: 'include',
        headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
        },
    };

    const finalOptions = {
        ...defaultOptions,
        ...options,
        headers: {
            ...defaultOptions.headers,
            ...options.headers,
        },
    };

    let lastError;
    for (let i = 0; i < retryCount; i++) {
        try {
            const response = await fetch(`${API_URL}${endpoint}`, finalOptions);
            
            // Handle 503 Service Unavailable with retry
            if (response.status === 503) {
                lastError = new Error('Service temporarily unavailable');
                // Wait for 1 second before retrying
                await new Promise(resolve => setTimeout(resolve, 1000));
                continue;
            }

            if (!response.ok) {
                throw new Error(`API call failed: ${response.status} ${response.statusText}`);
            }

            return await response.json();
        } catch (error) {
            lastError = error;
            if (i < retryCount - 1) {
                // Wait for 1 second before retrying
                await new Promise(resolve => setTimeout(resolve, 1000));
                continue;
            }
        }
    }

    // If we get here, all retries failed
    throw lastError;
};