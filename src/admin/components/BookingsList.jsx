import React from 'react';
import { API_URL } from "../../utils/api.js";

const BookingsList = ({ selectedDate, bookings, loading, setBookings, setMessage }) => {
    const handleDeleteBooking = async (bookingId) => {
        try {
            const response = await fetch(`${API_URL}/api/bookings/${bookingId}`, {
                method: 'DELETE',
                credentials: 'include'
            });

            if (response.ok) {
                setBookings(prevBookings => prevBookings.filter(booking => booking.id !== bookingId));
                setMessage('Réservation supprimée avec succès');
                setTimeout(() => setMessage(''), 3000);
            } else {
                setMessage('Échec de la suppression de la réservation');
            }
        } catch (error) {
            console.error('Error deleting booking:', error);
            setMessage('Échec de la suppression de la réservation');
        }
    };

    return (
        <div className="mt-8">
            <h2 className="text-2xl font-bold text-gray-800 group-hover:text-blue-600 transition-colors">
                Réservations pour le {selectedDate.toLocaleDateString('fr-FR', { 
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                })}
            </h2>
            
            {loading ? (
                <div className="flex justify-center items-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                </div>
            ) : bookings.length > 0 ? (
                <ul className="space-y-4">
                    {bookings.map((booking) => (
                        <li key={booking.id} className="p-4 bg-gray-50 rounded-lg shadow-sm hover:shadow-md transition-shadow duration-200">
                            <div className="flex justify-between items-start">
                                <div>
                                    <strong className="block text-lg font-semibold text-gray-800">
                                        {booking.first_name} {booking.last_name}
                                    </strong>
                                    <p className="text-gray-600 mt-1">
                                        <span className="inline-block mr-4">
                                            📱 {booking.phone_number}
                                        </span>
                                        <span className="inline-block">
                                            🕒 {booking.start_hour}:00 - {booking.end_hour}:00
                                        </span>
                                    </p>
                                </div>
                                <button
                                    onClick={() => handleDeleteBooking(booking.id)}
                                    className="px-4 py-2 bg-red-500 text-white text-sm font-medium rounded-lg hover:bg-red-600 focus:ring-4 focus:ring-red-200 transition-all duration-200 transform hover:scale-[1.02]"
                                    aria-label="Supprimer la réservation"
                                >
                                    Supprimer
                                </button>
                            </div>
                        </li>
                    ))}
                </ul>
            ) : (
                <div className="text-center py-8">
                    <p className="text-gray-500">Pas de réservations pour cette date.</p>
                </div>
            )}
        </div>
    );
};

export default BookingsList; 