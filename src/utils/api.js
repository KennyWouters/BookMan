// API URL configuration
const PRODUCTION_API = 'https://book-man-b65d9d654296.herokuapp.com';
const DEVELOPMENT_API = 'http://localhost:3001';
// Debug environment
console.log('Current environment:', process.env.NODE_ENV);
console.log('VITE_NODE_ENV:', import.meta.env.VITE_NODE_ENV);
console.log('Production mode:', import.meta.env.PROD);
console.log('Hostname:', window.location.hostname);
console.log('Origin:', window.location.origin);

// Initialize API URL based on environment
let currentAPI = window.location.hostname === 'localhost' ? DEVELOPMENT_API : PRODUCTION_API;
export let API_URL = currentAPI;

// Function to check if an API endpoint is available
async function isAPIAvailable(url) {
    try {
        const response = await fetch(`${url}/api/hello`, {
            method: 'GET',
            mode: 'cors',
            headers: {
                'Accept': 'application/json',
                'Origin': window.location.origin
            }
        });
        return response.ok;
    } catch (error) {
        console.warn(`API at ${url} is not available:`, error.message);
        return false;
    }
}

// Function to update the API URL with fallback logic
async function updateAPIUrl() {
    if (window.location.hostname !== 'localhost') {
        API_URL = PRODUCTION_API;
        return;
    }

    // Try local first
    if (await isAPIAvailable(DEVELOPMENT_API)) {
        API_URL = DEVELOPMENT_API;
        console.log('Using local API:', API_URL);
        return;
    }

    // Fallback to Heroku
    console.log('Local API not available, falling back to Heroku');
    API_URL = PRODUCTION_API;
    console.log('Using Heroku API:', API_URL);
}

// Initial API URL setup
updateAPIUrl().catch(console.error);

// Helper function to check if the server is available
const checkServerAvailability = async () => {
    try {
        console.log('Checking server availability...');
        console.log('Current origin:', window.location.origin);
        console.log('Checking endpoint:', `${API_URL}/api/hello`);

        const response = await fetch(`${API_URL}/api/hello`, {
            method: 'GET',
            mode: 'cors',
            credentials: 'include',
            headers: {
                'Accept': 'application/json',
                'Origin': window.location.origin
            }
        });

        if (!response.ok) {
            console.warn('Server returned error status:', response.status);
            // If current API is local and it's not responding, try falling back to Heroku
            if (API_URL === DEVELOPMENT_API) {
                await updateAPIUrl();
                // Retry the check with the new API URL
                return await checkServerAvailability();
            }
            return false;
        }

        const data = await response.json();
        console.log('Server response data:', data);
        return true;
    } catch (error) {
        console.error('Server availability check failed:', error);
        // If current API is local and it failed, try falling back to Heroku
        if (API_URL === DEVELOPMENT_API) {
            await updateAPIUrl();
            // Retry the check with the new API URL
            return await checkServerAvailability();
        }
        return false;
    }
};

// Helper function for API calls with proper CORS settings
// export async function fetchWithCors(endpoint, options = {}, retryCount = 3) {
//     console.log('fetchWithCors called with:', {
//         endpoint,
//         API_URL,
//         fullUrl: `${API_URL}${endpoint}`
//     });
//
//     let serverAvailable = await checkServerAvailability();
//     let retryAttempt = 0;
//
//     while (!serverAvailable && retryAttempt < 2) {
//         console.log(`Attempting to wake up server (attempt ${retryAttempt + 1}/2)...`);
//         await new Promise(resolve => setTimeout(resolve, 3000));
//         serverAvailable = await checkServerAvailability();
//         retryAttempt++;
//     }
//
//     if (!serverAvailable) {
//         throw new Error('Server is currently unavailable. Please try again later.');
//     }
//
//     const defaultOptions = {
//         mode: 'cors',
//         credentials: 'include',
//         headers: {
//             'Accept': 'application/json',
//             'Origin': window.location.origin
//         }
//     };
//
//     // Only add Content-Type for POST, PUT, PATCH requests with a body
//     if (options.method && ['POST', 'PUT', 'PATCH'].includes(options.method.toUpperCase()) && options.body) {
//         defaultOptions.headers['Content-Type'] = 'application/json';
//     }
//
//     const finalOptions = {
//         ...defaultOptions,
//         ...options,
//         headers: {
//             ...defaultOptions.headers,
//             ...options.headers
//         }
//     };
//
//     console.log('Making API request:', {
//         url: `${API_URL}${endpoint}`,
//         method: finalOptions.method || 'GET',
//         headers: finalOptions.headers,
//         mode: finalOptions.mode,
//         credentials: finalOptions.credentials
//     });
//
//     let lastError;
//     let attempts = 0;
//
//     while (attempts < retryCount) {
//         try {
//             const response = await fetch(`${API_URL}${endpoint}`, finalOptions);
//
//             console.debug('API Response:', {
//                 status: response.status,
//                 statusText: response.statusText,
//                 headers: Object.fromEntries(response.headers.entries()),
//                 url: response.url,
//             });
//
//             // Handle various status codes
//             if (response.status === 503) {
//                 console.warn('Service temporarily unavailable, retrying...');
//                 lastError = new Error('Service temporarily unavailable');
//                 await new Promise(resolve => setTimeout(resolve, 3000 + (attempts * 2000))); // Progressive delay
//                 attempts++;
//                 continue;
//             }
//
//             if (response.status === 404) {
//                 throw new Error(`API endpoint not found: ${endpoint}`);
//             }
//
//             if (!response.ok) {
//                 const errorData = await response.json().catch(() => ({}));
//                 throw new Error(errorData.error || `API call failed: ${response.status} ${response.statusText}`);
//             }
//
//             const contentType = response.headers.get('content-type');
//             if (contentType && contentType.includes('application/json')) {
//                 const data = await response.json();
//                 return data;
//             } else {
//                 console.warn('Response is not JSON:', contentType);
//                 return { message: 'Response received but not JSON' };
//             }
//         } catch (error) {
//             console.error(`API call failed (attempt ${attempts + 1}/${retryCount}):`, error);
//             lastError = error;
//
//             if (attempts < retryCount - 1) {
//                 await new Promise(resolve => setTimeout(resolve, 3000 + (attempts * 2000))); // Progressive delay
//                 attempts++;
//                 continue;
//             }
//             break;
//         }
//     }
//
//     console.error('All retry attempts failed:', lastError);
//     throw new Error(`Failed to fetch after ${retryCount} attempts: ${lastError.message}`);
// }

export async function fetchWithCors(endpoint, options = {}) {
    const defaultOptions = {
        mode: 'cors',
        credentials: 'include',
        headers: {
            'Accept': 'application/json',
            'Origin': window.location.origin
        }
    };

    if (options.method && ['POST', 'PUT', 'PATCH'].includes(options.method.toUpperCase()) && options.body) {
        defaultOptions.headers['Content-Type'] = 'application/json';
    }

    const finalOptions = {
        ...defaultOptions,
        ...options,
        headers: {
            ...defaultOptions.headers,
            ...options.headers
        }
    };

    const response = await fetch(`${API_URL}${endpoint}`, finalOptions);

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `API call failed: ${response.status} ${response.statusText}`);
    }

    return response.json();
}