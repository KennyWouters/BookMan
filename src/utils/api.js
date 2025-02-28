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