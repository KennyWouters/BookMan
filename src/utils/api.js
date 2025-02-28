// API URL configuration
const PRODUCTION_API = 'https://book-man-b65d9d654296.herokuapp.com';
const DEVELOPMENT_API = 'http://localhost:3001';

// Debug environment
console.log('Current environment:', process.env.NODE_ENV);
console.log('VITE_NODE_ENV:', import.meta.env.VITE_NODE_ENV);
console.log('Production mode:', import.meta.env.PROD);

// Determine API URL based on multiple environment indicators
export const API_URL = (
    import.meta.env.PROD || 
    process.env.NODE_ENV === 'production' ||
    window.location.hostname !== 'localhost'
) ? PRODUCTION_API : DEVELOPMENT_API;

console.log('Using API URL:', API_URL);

// Helper function to check if the server is available
const checkServerAvailability = async () => {
    try {
        const response = await fetch(`${API_URL}/api/hello`, {
            method: 'GET',
            mode: 'cors',
            credentials: 'include',
            headers: {
                'Accept': 'application/json',
                'Origin': window.location.origin
            }
        });

        console.log('Server check response:', {
            status: response.status,
            statusText: response.statusText,
            headers: Object.fromEntries(response.headers.entries())
        });

        if (response.status === 503) {
            console.warn('Server is in sleep mode, attempting to wake it...');
            return false;
        }

        return response.ok;
    } catch (error) {
        console.error('Server availability check failed:', error);
        return false;
    }
};

// Helper function for API calls with proper CORS settings
export const fetchWithCors = async (endpoint, options = {}, retryCount = 3) => {
    let serverAvailable = await checkServerAvailability();
    let retryAttempt = 0;

    // If server is not available initially, try to wake it up
    while (!serverAvailable && retryAttempt < 2) {
        console.log(`Attempting to wake up server (attempt ${retryAttempt + 1}/2)...`);
        await new Promise(resolve => setTimeout(resolve, 3000)); // Wait 3 seconds
        serverAvailable = await checkServerAvailability();
        retryAttempt++;
    }

    if (!serverAvailable) {
        throw new Error('Server is currently unavailable. Please try again later.');
    }

    const defaultOptions = {
        mode: 'cors',
        credentials: 'include',
        headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'Origin': window.location.origin
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
            
            console.debug('API Response:', {
                status: response.status,
                statusText: response.statusText,
                headers: Object.fromEntries(response.headers.entries()),
                url: response.url,
            });

            if (response.status === 503) {
                console.warn('Service temporarily unavailable, retrying...');
                lastError = new Error('Service temporarily unavailable');
                await new Promise(resolve => setTimeout(resolve, 3000 + (attempts * 2000))); // Progressive delay
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
                await new Promise(resolve => setTimeout(resolve, 3000 + (attempts * 2000))); // Progressive delay
                attempts++;
                continue;
            }
            break;
        }
    }

    console.error('All retry attempts failed:', lastError);
    throw new Error(`Failed to fetch after ${retryCount} attempts: ${lastError.message}`);
};