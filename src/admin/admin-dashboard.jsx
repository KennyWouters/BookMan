import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';

const AdminDashboard = () => {
    const navigate = useNavigate();
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [bookings, setBookings] = useState([]);
    const [loading, setLoading] = useState(false);

    // Fetch bookings for the selected date
    const fetchBookings = async (date) => {
        setLoading(true);
        try {
            const formattedDate = date.toISOString().split('T')[0];
            const response = await fetch(`http://localhost:3001/api/admin/bookings?day=${formattedDate}`);
            if (response.ok) {
                const data = await response.json();
                setBookings(data);
            } else {
                console.error('Failed to fetch bookings');
            }
        } catch (error) {
            console.error('Error fetching bookings:', error);
        } finally {
            setLoading(false);
        }
    };

    // Handle date change in the calendar
    const handleDateChange = (date) => {
        setSelectedDate(date);
        fetchBookings(date);
    };

    // Handle logout
    const handleLogout = () => {
        localStorage.removeItem('adminId');
        navigate('/admin/login');
    };

    // Handle booking deletion
    const handleDeleteBooking = async (id) => {
        try {
            const response = await fetch(`https://book-man-b65d9d654296.herokuapp.com/api/bookings/${id}`, {
                method: 'DELETE',
            });

            if (response.ok) {
                // Refresh the bookings list after deletion
                fetchBookings(selectedDate);
            } else {
                console.error('Failed to delete booking');
            }
        } catch (error) {
            console.error('Error deleting booking:', error);
        }
    };

    // Fetch bookings when the component mounts or the selected date changes
    useEffect(() => {
        fetchBookings(selectedDate);
    }, [selectedDate]);

    return (
        <div className="min-h-screen bg-gray-100 p-8">
            <div className="max-w-4xl mx-auto bg-white p-6 rounded-lg shadow-lg">
                <h1 className="text-3xl font-bold mb-6">Admin Dashboard</h1>
                <button
                    onClick={handleLogout}
                    className="mb-6 px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 transition-colors"
                >
                    Logout
                </button>

                {/* Calendar */}
                <div className="mb-6">
                    <h2 className="text-xl font-semibold mb-4">Select a Date</h2>
                    <Calendar
                        onChange={handleDateChange} // Callback when a date is selected
                        value={selectedDate} // The currently selected date
                        className="mx-auto"
                    />
                </div>

                {/* Display bookings for the selected date */}
                <div>
                    <h2 className="text-xl font-semibold mb-4">Bookings for {selectedDate.toDateString()}</h2>
                    {loading ? (
                        <p className="text-center text-gray-500">Loading...</p>
                    ) : bookings.length > 0 ? (
                        <ul className="space-y-4">
                            {bookings.map((booking) => (
                                <li key={booking.id} className="p-4 bg-gray-50 rounded-lg shadow">
                                    <strong className="block text-lg font-semibold">{booking.first_name} {booking.last_name}</strong>
                                    <p className="text-gray-700">Phone: {booking.phone_number}</p>
                                    <p className="text-gray-700">Time: {booking.start_hour}:00 - {booking.end_hour}:00</p>
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
            </div>
        </div>
    );
};

export default AdminDashboard;