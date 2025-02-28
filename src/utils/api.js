// API URL configuration
const PRODUCTION_API = 'https://book-man-b65d9d654296.herokuapp.com';
const DEVELOPMENT_API = 'http://localhost:3001';

export const API_URL = process.env.NODE_ENV === 'production' 
    ? PRODUCTION_API
    : DEVELOPMENT_API;

// Helper function to check if the server is available
const checkServerAvailability = async () => {
    try {
        const response = await fetch(`${API_URL}/api/hello`, {
            method: 'GET',
            mode: 'cors',
            credentials: 'include',
        });
        return response.ok;
    } catch (error) {
        console.error('Server availability check failed:', error);
        return false;
    }
};

// Helper function for API calls with proper CORS settings
export const fetchWithCors = async (endpoint, options = {}, retryCount = 3) => {
    // First check if server is available
    const isServerAvailable = await checkServerAvailability();
    if (!isServerAvailable) {
        throw new Error('Server is currently unavailable. Please try again later.');
    }

    const defaultOptions = {
        mode: 'cors',
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
    let attempts = 0;

    while (attempts < retryCount) {
        try {
            const response = await fetch(`${API_URL}${endpoint}`, finalOptions);
            
            // Log response details for debugging
            console.debug('API Response:', {
                status: response.status,
                statusText: response.statusText,
                headers: Object.fromEntries(response.headers.entries()),
                url: response.url,
            });

            if (response.status === 503) {
                console.warn('Service temporarily unavailable, retrying...');
                lastError = new Error('Service temporarily unavailable');
                await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, attempts))); // Exponential backoff
                attempts++;
                continue;
            }

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.error || `API call failed: ${response.status} ${response.statusText}`);
            }

            const data = await response.json();
            return data;
        } catch (error) {
            console.error(`API call failed (attempt ${attempts + 1}/${retryCount}):`, error);
            lastError = error;

            if (attempts < retryCount - 1) {
                await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, attempts))); // Exponential backoff
                attempts++;
                continue;
            }
            break;
        }
    }

    // If we get here, all retries failed
    console.error('All retry attempts failed:', lastError);
    throw new Error(`Failed to fetch after ${retryCount} attempts: ${lastError.message}`);
};