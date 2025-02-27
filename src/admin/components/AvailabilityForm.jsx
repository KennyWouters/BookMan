import React, { useEffect, useState } from 'react';
import { API_URL } from "../../utils/api.js";

const AvailabilityForm = ({ selectedDate, setUnavailableDates }) => {
    const [status, setStatus] = useState(null);
    const [comment, setComment] = useState('');
    const [message, setMessage] = useState('');
    const [statusCache, setStatusCache] = useState({});

    useEffect(() => {
        console.log('Date changed, checking cache');
        setComment('');

        const formattedDate = formatDate(selectedDate);
        
        // Check if we have this date in cache
        if (statusCache[formattedDate]) {
            console.log('Found in cache:', statusCache[formattedDate]);
            setStatus(statusCache[formattedDate].status);
            setComment(statusCache[formattedDate].comment || '');
            return;
        }

        // If not in cache, fetch from API
        const fetchAvailability = async () => {
            try {
                console.log('Fetching availability for:', formattedDate);
                const response = await fetch(`${API_URL}/api/availability-status/${formattedDate}`, {
                    credentials: 'include'
                });
                if (response.ok) {
                    const data = await response.json();
                    console.log('API Response:', data);
                    
                    // Only cache and set status if we have an actual record
                    if (data.id) {
                        const newStatus = data.status ? 'true' : 'false';
                        console.log('Record exists, setting status to:', newStatus);
                        
                        // Update cache
                        setStatusCache(prev => ({
                            ...prev,
                            [formattedDate]: {
                                status: newStatus,
                                comment: data.comment || ''
                            }
                        }));
                        
                        setStatus(newStatus);
                        setComment(data.comment || '');
                    } else {
                        console.log('No existing record, keeping status as null');
                        setStatus(null);
                        // Cache the null status too
                        setStatusCache(prev => ({
                            ...prev,
                            [formattedDate]: {
                                status: null,
                                comment: ''
                            }
                        }));
                    }
                } else {
                    console.log('API response not OK, status:', response.status);
                    setStatus(null);
                }
            } catch (error) {
                console.error('Error fetching availability:', error);
                setStatus(null);
            }
        };

        const timeoutId = setTimeout(fetchAvailability, 100);
        return () => clearTimeout(timeoutId);
    }, [selectedDate, statusCache]);

    // Helper function to format date consistently
    const formatDate = (date) => {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (status === null) {
            setMessage('Please select a status');
            return;
        }
        try {
            const formattedDate = formatDate(selectedDate);

            const response = await fetch(`${API_URL}/api/admin/availability-status`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    date: formattedDate,
                    status: status === 'true',
                    comment
                }),
                credentials: 'include'
            });

            if (response.ok) {
                // Update cache after successful submission
                setStatusCache(prev => ({
                    ...prev,
                    [formattedDate]: {
                        status,
                        comment
                    }
                }));
                
                setUnavailableDates(prev => [...prev, new Date(formattedDate)]);
                setMessage('Availability status updated successfully');
            } else {
                setMessage('Failed to update availability status');
            }
        } catch (error) {
            console.error('Error updating availability status:', error);
            setMessage('Failed to update availability status');
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div>
                <label className="block text-sm font-medium text-gray-700">Date</label>
                <input
                    type="text"
                    value={selectedDate.toDateString()}
                    readOnly
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-100 cursor-not-allowed"
                />
            </div>
            <div>
                <label className="block text-sm font-medium text-gray-700">Status</label>
                <select
                    value={status || ''}
                    onChange={(e) => setStatus(e.target.value || null)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                >
                    <option value="">Select a status</option>
                    <option value="true">Available</option>
                    <option value="false">Unavailable</option>
                </select>
            </div>
            <div>
                <label className="block text-sm font-medium text-gray-700">Comment</label>
                <textarea
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                />
            </div>
            <button
                type="submit"
                className="w-full py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
                Update Availability
            </button>
            {message && (
                <div className={`mt-4 p-4 rounded ${message.includes('success') ? 'bg-green-50 text-green-800 border border-green-200' : 'bg-red-50 text-red-800 border border-red-200'}`}>
                    {message}
                </div>
            )}
        </form>
    );
};

export default AvailabilityForm;