import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import './styles/Calendar.css';
import { API_URL } from "../utils/api.js";
import AvailabilityForm from "./components/AvailabilityForm.jsx";
import BookingsList from "./components/BookingsList.jsx";

const AdminDashboard = () => {
    const navigate = useNavigate();
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [bookings, setBookings] = useState([]);
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');
    const [unavailableDates, setUnavailableDates] = useState([]);
    const [isAvailable, setIsAvailable] = useState(true);
    const [adminName, setAdminName] = useState('');

    const fetchAdminName = async () => {
        try {
            const response = await fetch(`${API_URL}/api/admin/name`, {
                credentials: 'include'
            });
            if (response.ok) {
                const data = await response.json();
                setAdminName(data.name);
            } else {
                setMessage('Failed to fetch admin name');
            }
        } catch (error) {
            console.error('Error fetching admin name:', error);
            setMessage('Failed to fetch admin name');
        }
    };

    useEffect(() => {
        fetchAdminName();
    }, []);

    const fetchData = async (date) => {
        setLoading(true);
        try {
            const year = date.getFullYear();
            const month = String(date.getMonth() + 1).padStart(2, '0');
            const day = String(date.getDate()).padStart(2, '0');
            const formattedDate = `${year}-${month}-${day}`;

            const bookingsResponse = await fetch(`${API_URL}/api/admin/bookings?day=${formattedDate}`, {
                credentials: 'include'
            });
            if (bookingsResponse.ok) {
                const bookingsData = await bookingsResponse.json();
                setBookings(bookingsData);
            }

            const availabilityResponse = await fetch(`${API_URL}/api/availability-status/${formattedDate}`, {
                credentials: 'include'
            });
            if (availabilityResponse.ok) {
                const availabilityData = await availabilityResponse.json();
                if (availabilityData.id) {
                    setIsAvailable(availabilityData.status);
                } else {
                    const dayOfWeek = date.getDay();
                    const isFirstSaturday = date.getDate() <= 7 && dayOfWeek === 6;
                    const defaultAvailable = [4, 5, 6].includes(dayOfWeek) && !isFirstSaturday;
                    setIsAvailable(defaultAvailable);
                }
            } else if (availabilityResponse.status === 403) {
                setMessage('Session expired. Please log in again.');
                handleLogout();
            }
        } catch (error) {
            console.error('Error fetching data:', error);
            setMessage('Failed to fetch data');
        } finally {
            setLoading(false);
        }
    };

    const handleDateChange = (date) => {
        setSelectedDate(date);
        fetchData(date);
    };

    const handleLogout = () => {
        localStorage.removeItem('adminId');
        navigate('/admin/login');
    };

    const handleDeleteBooking = async (bookingId) => {
        try {
            const response = await fetch(`${API_URL}/api/bookings/${bookingId}`, {
                method: 'DELETE',
                credentials: 'include'
            });

            if (response.ok) {
                setBookings(prevBookings => prevBookings.filter(booking => booking.id !== bookingId));
                setMessage('Booking deleted successfully');
                setTimeout(() => setMessage(''), 3000);
            } else {
                setMessage('Failed to delete booking');
            }
        } catch (error) {
            console.error('Error deleting booking:', error);
            setMessage('Failed to delete booking');
        }
    };

    const handleAvailabilityUpdate = (newStatus) => {
        setIsAvailable(newStatus);
        // Optionally refresh all data
        fetchData(selectedDate);
    };

    useEffect(() => {
        fetchData(selectedDate);
    }, [selectedDate]);

    return (
        <div className="min-h-screen bg-gray-100 p-8">
            <div className="max-w-4xl mx-auto bg-white p-6 rounded-lg shadow-lg">
                <div className="flex justify-between items-center mb-6">
                    <h1 className="text-3xl font-bold">Welcome, {adminName}</h1>
                    <button
                        onClick={handleLogout}
                        className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 transition-colors"
                    >
                        Logout
                    </button>
                </div>

                <div className="mb-8 bg-white rounded-xl shadow-sm p-6">
                    <div className="flex flex-col items-center">
                        <Calendar
                            onChange={handleDateChange}
                            value={selectedDate}
                            className="mx-auto mb-4 border-0 shadow-none"
                            tileClassName="rounded-full hover:bg-blue-100 transition-colors"
                        />
                        <div className="w-full space-y-4">
                            <h2 className="text-xl font-semibold text-gray-800 text-center mt-4 px-4 py-2 bg-blue-50 rounded-full">
                                {selectedDate.toLocaleDateString('fr-FR', {
                                    weekday: 'long',
                                    year: 'numeric',
                                    month: 'long',
                                    day: 'numeric'
                                })}
                            </h2>
                            
                            {/* Status Fields */}
                            <div className="grid grid-cols-2 gap-4">
                                {/* Reservations Count */}
                                <div className="bg-white rounded-xl border border-gray-200 p-4 text-center">
                                    <p className="text-sm text-gray-600 mb-1">Réservations</p>
                                    <div className="flex items-center justify-center space-x-2">
                                        <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
                                        <span className="text-2xl font-bold text-gray-900">
                                            {loading ? '-' : bookings.length}
                                        </span>
                                    </div>
                                </div>

                                {/* Availability Status */}
                                <div className="bg-white rounded-xl border border-gray-200 p-4 text-center">
                                    <p className="text-sm text-gray-600 mb-1">Disponibilité</p>
                                    <div className="flex items-center justify-center space-x-2">
                                        {loading ? (
                                            <span className="text-2xl font-bold text-gray-400">-</span>
                                        ) : (
                                            <>
                                                <svg 
                                                    className={`w-5 h-5 ${isAvailable ? 'text-green-500' : 'text-red-500'}`} 
                                                    fill="none" 
                                                    stroke="currentColor" 
                                                    viewBox="0 0 24 24"
                                                >
                                                    {isAvailable ? (
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                    ) : (
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                    )}
                                                </svg>
                                                <span className={`text-2xl font-bold ${isAvailable ? 'text-green-600' : 'text-red-600'}`}>
                                                    {isAvailable ? 'Disponible' : 'Indisponible'}
                                                </span>
                                            </>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                    <div>
                        <AvailabilityForm 
                            selectedDate={selectedDate} 
                            setUnavailableDates={setUnavailableDates}
                            onAvailabilityUpdate={handleAvailabilityUpdate}
                        />
                    </div>
                    <div>
                        <BookingsList
                            selectedDate={selectedDate}
                            bookings={bookings}
                            loading={loading}
                            setBookings={setBookings}
                            setMessage={setMessage}
                        />
                    </div>
                </div>

                {message && (
                    <div className={`mt-4 p-4 rounded ${
                        message.includes('success')
                            ? 'bg-green-50 text-green-800 border border-green-200'
                            : 'bg-red-50 text-red-800 border border-red-200'
                    }`}>
                        {message}
                    </div>
                )}
            </div>
        </div>
    );
};

export default AdminDashboard;