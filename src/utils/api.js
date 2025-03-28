// API URL configuration
const PRODUCTION_API = 'https://book-man-b65d9d654296.herokuapp.com';
const DEVELOPMENT_API = 'http://localhost:3001';



// Initialize API URL based on environment
let currentAPI = window.location.hostname === 'localhost' ? DEVELOPMENT_API : PRODUCTION_API;
export let API_URL = currentAPI;



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