import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';

const AdminDashboard = () => {
    const navigate = useNavigate();
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [bookings, setBookings] = useState([]);
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');
    const [unavailableDates, setUnavailableDates] = useState([]);

    // Availability settings state
    const [availabilitySettings, setAvailabilitySettings] = useState({
        isOpen: true,
        maxBookings: 10,
        currentBookings: 0
    });

    // Fetch both bookings and availability for the selected date
    // Update the fetchData function to include authentication:

    const fetchData = async (date) => {
        setLoading(true);
        try {
            const year = date.getFullYear();
            const month = String(date.getMonth() + 1).padStart(2, '0');
            const day = String(date.getDate()).padStart(2, '0');
            const formattedDate = `${year}-${month}-${day}`;

            // Fetch bookings
            const bookingsResponse = await fetch(`https://book-man-b65d9d654296.herokuapp.com/api/admin/bookings?day=${formattedDate}`, {
                credentials: 'include' // Include cookies in the request
            });
            if (bookingsResponse.ok) {
                const bookingsData = await bookingsResponse.json();
                setBookings(bookingsData);
            }

            // Fetch availability settings
            const availabilityResponse = await fetch(`https://book-man-b65d9d654296.herokuapp.com/api/availability/${formattedDate}`, {
                credentials: 'include' // Include cookies in the request
            });
            if (availabilityResponse.ok) {
                const availabilityData = await availabilityResponse.json();
                setAvailabilitySettings({
                    isOpen: !availabilityData.isClosed,
                    maxBookings: availabilityData.maxBookings || 10,
                    currentBookings: availabilityData.currentBookings || 0
                });
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

    // Handle date change in the calendar
    const handleDateChange = (date) => {
        setSelectedDate(date);
        fetchData(date);
    };

    // Handle availability settings update
    // Update just the handleUpdateAvailability function in your component:

    const handleUpdateAvailability = async () => {
        const year = selectedDate.getFullYear();
        const month = String(selectedDate.getMonth() + 1).padStart(2, '0');
        const day = String(selectedDate.getDate()).padStart(2, '0');
        const formattedDate = `${year}-${month}-${day}`;

        try {
            const response = await fetch(`https://book-man-b65d9d654296.herokuapp.com/api/admin/availability/${formattedDate}`, {
                method: 'PUT',
                credentials: 'include', // Include cookies in the request
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    isOpen: availabilitySettings.isOpen,
                    maxBookings: parseInt(availabilitySettings.maxBookings)
                })
            });

            if (response.ok) {
                setMessage('Availability settings updated successfully');
                setTimeout(() => setMessage(''), 3000);
                fetchData(selectedDate);
            } else if (response.status === 403) {
                setMessage('Session expired. Please log in again.');
                handleLogout();
            } else {
                setMessage('Failed to update availability settings');
            }
        } catch (error) {
            console.error('Error updating availability:', error);
            setMessage('Failed to update availability settings');
        }
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
                fetchData(selectedDate);
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
                {/* Header */}
                <div className="flex justify-between items-center mb-6">
                    <h1 className="text-3xl font-bold">Admin Dashboard</h1>
                    <button
                        onClick={handleLogout}
                        className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 transition-colors"
                    >
                        Logout
                    </button>
                </div>

                {/* Calendar Section */}
                <div className="mb-6">
                    <h2 className="text-xl font-semibold mb-4">Select a Date</h2>
                    <Calendar
                        onChange={handleDateChange}
                        value={selectedDate}
                        tileDisabled={({ date }) => unavailableDates.some(unavailableDate =>
                            date.getFullYear() === unavailableDate.getFullYear() &&
                            date.getMonth() === unavailableDate.getMonth() &&
                            date.getDate() === unavailableDate.getDate()
                        )}
                        className="mx-auto"
                    />
                </div>

                {/* Availability Settings Section */}
                <div className="mb-6 bg-white rounded-lg shadow p-6 border border-gray-200">
                    <h2 className="text-xl font-semibold mb-4">Availability Settings</h2>
                    <div className="space-y-4">
                        <div className="flex items-center space-x-2">
                            <input
                                type="checkbox"
                                checked={availabilitySettings.isOpen}
                                onChange={(e) => setAvailabilitySettings({
                                    ...availabilitySettings,
                                    isOpen: e.target.checked
                                })}
                                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                            />
                            <span className="text-gray-700">Day is Open for Bookings</span>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Maximum Bookings
                            </label>
                            <input
                                type="number"
                                value={availabilitySettings.maxBookings}
                                onChange={(e) => setAvailabilitySettings({
                                    ...availabilitySettings,
                                    maxBookings: e.target.value
                                })}
                                min="1"
                                className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                            />
                        </div>
                        <div className="text-sm text-gray-600">
                            Current Bookings: {availabilitySettings.currentBookings}
                        </div>
                        <button
                            onClick={handleUpdateAvailability}
                            className="w-full p-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                        >
                            Update Availability
                        </button>
                    </div>
                </div>

                {/* Bookings Section */}
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

                {/* Message Display */}
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