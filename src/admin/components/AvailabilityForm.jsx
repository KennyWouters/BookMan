import React, { useEffect, useState } from 'react';
import { API_URL } from "../../utils/api.js";

const AvailabilityForm = ({ selectedDate, setUnavailableDates, onAvailabilityUpdate }) => {
    const [status, setStatus] = useState(null);
    const [comment, setComment] = useState('');
    const [message, setMessage] = useState('');
    const [statusCache, setStatusCache] = useState({});
    const [isFormVisible, setIsFormVisible] = useState(false);

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
                // Call the callback with the new status
                onAvailabilityUpdate?.(status === 'true');
            } else {
                setMessage('Failed to update availability status');
            }
        } catch (error) {
            console.error('Error updating availability status:', error);
            setMessage('Failed to update availability status');
        }
    };

    return (
        <div className="w-full bg-white rounded-2xl shadow-lg p-8 transition-all duration-300 ease-in-out hover:shadow-xl border border-gray-100">
            <div 
                className="group cursor-pointer text-center transition-all duration-300 ease-in-out"
                onClick={() => setIsFormVisible(!isFormVisible)}
            >
                <div className="flex flex-col items-center space-y-3 mb-6">
                    <h2 className="text-2xl font-bold text-gray-800 group-hover:text-blue-600 transition-colors">
                        Modifier la disponibilité
                    </h2>
                    <div className="px-6 py-2 bg-blue-50 rounded-full">
                        <span className="text-lg text-blue-700">
                            {selectedDate.toLocaleDateString('fr-FR', { 
                                weekday: 'long',
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric'
                            })}
                        </span>
                    </div>
                    <span className="inline-flex items-center text-sm text-gray-500 group-hover:text-blue-500 font-medium">
                        {isFormVisible ? (
                            <>
                                <span>Masquer le formulaire</span>
                                <svg className="w-4 h-4 ml-1 transform rotate-180 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                                </svg>
                            </>
                        ) : (
                            <>
                                <span>Afficher le formulaire</span>
                                <svg className="w-4 h-4 ml-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                                </svg>
                            </>
                        )}
                    </span>
                </div>
            </div>
            
            <div className={`transition-all duration-500 ease-in-out ${
                isFormVisible 
                    ? 'opacity-100 max-h-[800px] translate-y-0' 
                    : 'opacity-0 max-h-0 -translate-y-4 overflow-hidden'
            }`}>
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="space-y-2">
                        <label className="block text-sm font-semibold text-gray-700">Date sélectionnée</label>
                        <input
                            type="text"
                            value={selectedDate.toLocaleDateString('fr-FR', { 
                                weekday: 'long',
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric'
                            })}
                            readOnly
                            className="w-full px-4 py-3 border border-gray-200 rounded-lg bg-gray-50 text-gray-500 cursor-not-allowed focus:ring-2 focus:ring-blue-100 transition-all duration-200"
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="block text-sm font-semibold text-gray-700">Statut de disponibilité</label>
                        <select
                            value={status || ''}
                            onChange={(e) => setStatus(e.target.value || null)}
                            className="w-full px-4 py-3 border border-gray-200 rounded-lg bg-white hover:border-blue-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all duration-200"
                        >
                            <option value="">Sélectionnez un statut</option>
                            <option value="true">Disponible</option>
                            <option value="false">Indisponible</option>
                        </select>
                    </div>
                    <div className="space-y-2">
                        <label className="block text-sm font-semibold text-gray-700">Commentaire (optionnel)</label>
                        <textarea
                            value={comment}
                            onChange={(e) => setComment(e.target.value)}
                            className="w-full px-4 py-3 border border-gray-200 rounded-lg bg-white hover:border-blue-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all duration-200 min-h-[100px] resize-y"
                            placeholder="Ajoutez un commentaire explicatif..."
                        />
                    </div>
                    <button
                        type="submit"
                        className="w-full py-3 px-6 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 focus:ring-4 focus:ring-blue-200 transform hover:scale-[1.02] transition-all duration-200 flex items-center justify-center space-x-2"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                        </svg>
                        <span>Mettre à jour la disponibilité</span>
                    </button>
                    {message && (
                        <div className={`mt-4 p-4 rounded-lg shadow-sm transition-all duration-300 ${
                            message.includes('success') 
                                ? 'bg-green-50 text-green-800 border border-green-200' 
                                : 'bg-red-50 text-red-800 border border-red-200'
                        }`}>
                            <p className="text-center font-medium">{message}</p>
                        </div>
                    )}
                </form>
            </div>
        </div>
    );
};

export default AvailabilityForm;