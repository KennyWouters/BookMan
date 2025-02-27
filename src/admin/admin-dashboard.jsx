import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import { API_URL } from "../utils/api.js";
import AvailabilityForm from "./components/AvailabilityForm.jsx";

const AdminDashboard = () => {
    const navigate = useNavigate();
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [bookings, setBookings] = useState([]);
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');
    const [unavailableDates, setUnavailableDates] = useState([]);
    const [isAvailable, setIsAvailable] = useState(true);

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
                setIsAvailable(availabilityData.status);
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

    useEffect(() => {
        fetchData(selectedDate);
    }, [selectedDate]);

    return (
        <div className="min-h-screen bg-gray-100 p-8">
            <div className="max-w-4xl mx-auto bg-white p-6 rounded-lg shadow-lg">
                <div className="flex justify-between items-center mb-6">
                    <h1 className="text-3xl font-bold">Admin Dashboard</h1>
                    <button
                        onClick={handleLogout}
                        className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 transition-colors"
                    >
                        Logout
                    </button>
                </div>

                <div className="mb-6">
                    <h2 className="text-xl font-semibold mb-4">Select a Date</h2>
                    <Calendar
                        onChange={handleDateChange}
                        value={selectedDate}
                        className="mx-auto"
                    />
                </div>

                <AvailabilityForm selectedDate={selectedDate} setUnavailableDates={setUnavailableDates} />

                <div>
                    <h2 className="text-xl font-semibold mb-4">Bookings for {selectedDate.toDateString()}</h2>
                    {loading ? (
                        <p className="text-center text-gray-500">Loading...</p>
                    ) : bookings.length > 0 ? (
                        <ul className="space-y-4">
                            {bookings.map((booking) => (
                                <li key={booking.id} className="p-4 bg-gray-50 rounded-lg shadow">
                                    <strong className="block text-lg font-semibold">
                                        {booking.first_name} {booking.last_name}
                                    </strong>
                                    <p className="text-gray-700">Phone: {booking.phone_number}</p>
                                    <p className="text-gray-700">
                                        Time: {booking.start_hour}:00 - {booking.end_hour}:00
                                    </p>
                                    <button
                                        onClick={() => handleDeleteBooking(booking.id)}
                                        className="mt-2 px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 transition-colors"
                                    >
                                        Delete
                                    </button>
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <p className="text-center text-gray-500">No bookings for this date.</p>
                    )}
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