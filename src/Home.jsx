import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Bell, Check, RefreshCw, AlertTriangle, Users } from "lucide-react";
import { API_URL, fetchWithCors } from "./utils/api.js";

function Home() {
    const [dates, setDates] = useState([]);
    const [availabilityStatuses, setAvailabilityStatuses] = useState([]);
    const [selectedDay, setSelectedDay] = useState("");
    const [phoneNumber, setPhoneNumber] = useState("");
    const [firstName, setFirstName] = useState("");
    const [lastName, setLastName] = useState("");
    const [startHour, setStartHour] = useState(14);
    const [endHour, setEndHour] = useState(16);
    const [isFullyBooked, setIsFullyBooked] = useState(false);
    const [notificationEmail, setNotificationEmail] = useState("");
    const [notificationMessage, setNotificationMessage] = useState("");
    const [isLoading, setIsLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [modalMessage, setModalMessage] = useState("");
    const [error, setError] = useState(null);
    const [bookings, setBookings] = useState([]);
    const [isBookingsClosed, setIsBookingsClosed] = useState(false);
    const navigate = useNavigate();

    const isBookingsClosedForDay = (date) => {
        const today = new Date();
        const selectedDate = new Date(date);
        const isToday = selectedDate.toDateString() === today.toDateString();
        const currentHour = today.getHours();
        
        return isToday && currentHour >= 14;
    };

    useEffect(() => {
        const fetchDates = async () => {
            setIsLoading(true);
            setError(null);
            try {
                console.log('Fetching dates from:', `${API_URL}/api/dates`);
                const response = await fetchWithCors('/api/dates');
                console.log('Dates response:', response);
                setDates(response);
            } catch (error) {
                console.error("Error fetching dates:", error);
                setError(error.message);
            } finally {
                setIsLoading(false);
            }
        };

        fetchDates();
    }, []);

    useEffect(() => {
        const fetchAvailabilityStatuses = async () => {
            try {
                console.log('Fetching availability statuses from:', `${API_URL}/api/admin/availability-status`);
                const response = await fetchWithCors('/api/admin/availability-status');
                console.log('Availability response:', response);
                setAvailabilityStatuses(response);

            } catch (error) {
                console.error("Error fetching availability:", error);
                setError(error.message);
            }
        };

        fetchAvailabilityStatuses();
    }, []);

    useEffect(() => {
        if (selectedDay) {
            setIsBookingsClosed(isBookingsClosedForDay(selectedDay));
            const checkAvailability = async () => {
                try {
                    const response = await fetch(`${API_URL}/api/availability/${selectedDay}`);
                    if (!response.ok) {
                        throw new Error("Erreur lors de la vérification de la disponibilité.");
                    }
                    const data = await response.json();
                    setIsFullyBooked(data.isFullyBooked);
                } catch (error) {
                    console.error("Erreur :", error);
                    setModalMessage("Une erreur s'est produite. Veuillez réessayer.");
                    setShowModal(true);
                }
            };

            const fetchBookings = async () => {
                try {
                    const year = new Date(selectedDay).getFullYear();
                    const month = String(new Date(selectedDay).getMonth() + 1).padStart(2, '0');
                    const day = String(new Date(selectedDay).getDate()).padStart(2, '0');
                    const formattedDate = `${year}-${month}-${day}`;
                    
                    const response = await fetchWithCors(`/api/admin/bookings?day=${formattedDate}`);
                    if (response) {
                        setBookings(response);
                    }
                } catch (error) {
                    console.error("Error fetching bookings:", error);
                }
            };

            checkAvailability();
            fetchBookings();
        }
    }, [selectedDay]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);

        if (!phoneNumber.match(/^\d{10}$/)) {
            setModalMessage("Veuillez entrer un numéro de téléphone valide (10 chiffres).");
            setShowModal(true);
            setIsLoading(false);
            return;
        }

        try {
            const response = await fetch(`${API_URL}/api/book`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    phoneNumber,
                    firstName,
                    lastName,
                    day: selectedDay,
                    startHour,
                    endHour,
                }),
            });

            const data = await response.json();

            if (response.ok) {
                setModalMessage("Réservation réussie !");
                setShowModal(true);
                setPhoneNumber("");
                setFirstName("");
                setLastName("");
                setSelectedDay("");
                setStartHour(14);
                setEndHour(16);
            } else {
                setModalMessage(data.error);
                setShowModal(true);
            }
        } catch (error) {
            console.error("Erreur :", error);
            setModalMessage("Une erreur s'est produite. Veuillez réessayer.");
            setShowModal(true);
        } finally {
            setIsLoading(false);
        }
    };

    const handleNotificationSubmit = async (e) => {
        e.preventDefault();

        if (!notificationEmail.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
            setNotificationMessage("Veuillez entrer une adresse email valide.");
            return;
        }

        try {
            const response = await fetch(`${API_URL}/api/notify`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    email: notificationEmail,
                    day: selectedDay,
                }),
            });

            const data = await response.json();

            if (response.ok) {
                setNotificationMessage(data.message);
                setNotificationEmail("");
            } else {
                setNotificationMessage(data.error);
            }
        } catch (error) {
            console.error("Erreur :", error);
            setNotificationMessage("Une erreur s'est produite. Veuillez réessayer.");
        }
    };

    const Modal = ({ message, onClose }) => (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
            <div className="bg-white w-96 p-8 rounded-2xl shadow-2xl border border-gray-200 transform transition-all duration-300 scale-100">
                <div className="flex justify-center mb-6">
                    <AlertTriangle className="text-yellow-500 w-12 h-12" />
                </div>
                <p className="text-lg font-medium text-gray-700 mb-8">{message}</p>
                <button
                    onClick={onClose}
                    className="w-full py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-all duration-300 transform hover:scale-[1.02] focus:ring-4 focus:ring-blue-200"
                >
                    Fermer
                </button>
            </div>
        </div>
    );

    const formattedSelectedDay = selectedDay
        ? new Date(selectedDay).toLocaleDateString("fr-FR", {
            weekday: "long",
            day: "numeric",
            month: "long",
        })
        : "";

    if (isLoading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50 py-12 px-4 sm:px-6 lg:px-8 flex items-center justify-center">
                <div className="text-center">
                    <h2 className="text-2xl font-semibold text-gray-900 mb-4">Chargement...</h2>
                    <p className="text-gray-600">Veuillez patienter pendant le chargement des données.</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50 py-12 px-4 sm:px-6 lg:px-8 flex items-center justify-center">
                <div className="text-center">
                    <h2 className="text-2xl font-semibold text-red-600 mb-4">Une erreur s'est produite</h2>
                    <p className="text-gray-600 mb-4">{error}</p>
                    <button 
                        onClick={() => window.location.reload()} 
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                        Réessayer
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-5xl mx-auto space-y-12">
                {/* Header Section */}
                <div className="text-center space-y-6 md:space-y-8">
                    <div className="space-y-2">
                        <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight">
                            <span className="block transform transition-all duration-300 hover:scale-[1.01]">
                                Réservation de l'atelier bois
                            </span>
                            <span className="block text-blue-700/90 mt-2 transform transition-all duration-300 hover:scale-[1.01]">
                                
                            </span>
                        </h1>
                    </div>
                    <div className="max-w-2xl mx-auto bg-white/50 backdrop-blur-sm rounded-2xl p-4 shadow-sm">
                        <p className="text-lg sm:text-xl text-gray-600">
                            <span className="block font-medium text-gray-700">
                                Sélectionnez une date disponible et réservez votre créneau
                            </span>
                        </p>
                    </div>
                </div>

                {/* Date Selection Grid */}
                <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-7 gap-2 sm:gap-3">
                    {dates.map((date, index) => {
                        const day = new Date(date).getDay();
                        const isFirstSaturday = new Date(date).getDate() <= 7 && day === 6;
                        const availabilityStatus = availabilityStatuses.find(status =>
                            new Date(status.targetDate).toDateString() === new Date(date).toDateString()
                        );
                        const isPastDate = new Date(date) < new Date().setHours(0, 0, 0, 0);
                        const isSelectable = !isPastDate && (availabilityStatus
                            ? availabilityStatus.status
                            : [4, 5, 6].includes(day) && !isFirstSaturday);

                        return (
                            <div
                                key={index}
                                onClick={() => isSelectable && setSelectedDay(date)}
                                className={`
                                    relative aspect-square flex flex-col items-center justify-center p-2 sm:p-3 rounded-lg sm:rounded-xl text-center transition-all duration-300
                                    ${isSelectable
                                        ? "bg-white shadow-sm hover:shadow-md cursor-pointer border border-transparent hover:border-blue-500 transform hover:-translate-y-1"
                                        : "bg-gray-50 cursor-not-allowed"}
                                `}
                            >
                                <p className={`text-xs sm:text-sm font-medium ${isSelectable ? 'text-gray-600' : 'text-gray-400'}`}>
                                    {new Date(date).toLocaleDateString("fr-FR", {
                                        month: "short",
                                    }).slice(0, 3)}
                                </p>
                                <p className={`text-sm sm:text-base font-semibold ${isSelectable ? 'text-gray-800' : 'text-gray-400'}`}>
                                    {new Date(date).toLocaleDateString("fr-FR", {
                                        weekday: "short",
                                    }).slice(0, 3)}
                                </p>
                                <p className={`text-lg sm:text-xl font-bold ${isSelectable ? 'text-gray-900' : 'text-gray-400'}`}>
                                    {new Date(date).getDate()}
                                </p>
                                {!isSelectable && availabilityStatus && availabilityStatus.comment && (
                                    <div className="absolute bottom-1 left-1 right-1">
                                        <div className="text-xs text-red-500 font-medium truncate">
                                            {availabilityStatus.comment}
                                        </div>
                                    </div>
                                )}
                                {isSelectable && selectedDay === date && (
                                    <div className="absolute inset-0 border-2 border-blue-500 rounded-lg sm:rounded-xl"></div>
                                )}
                            </div>
                        );
                    })}
                </div>

                {/* No Dates Available Message */}
                {dates.every(date => {
                    const day = new Date(date).getDay();
                    const isFirstSaturday = new Date(date).getDate() <= 7 && day === 6;
                    const availabilityStatus = availabilityStatuses.find(status =>
                        new Date(status.targetDate).toDateString() === new Date(date).toDateString()
                    );
                    const isPastDate = new Date(date) < new Date().setHours(0, 0, 0, 0);
                    return isPastDate || !(availabilityStatus ? availabilityStatus.status : [4, 5, 6].includes(day) && !isFirstSaturday);
                }) && (
                    <div className="max-w-2xl mx-auto bg-red-50 rounded-xl p-4 border border-red-100 shadow-sm">
                        <div className="flex items-center justify-center">
                            <AlertTriangle className="w-5 h-5 text-red-500 mr-2" />
                            <p className="text-center">
                                <span className="block text-base font-medium text-red-600">
                                    Aucune date n'est disponible pour une réservation pour le moment
                                </span>
                                <span className="block text-sm text-red-500 mt-1">
                                    Er zijn momenteel geen data beschikbaar voor reservering
                                </span>
                            </p>
                        </div>
                    </div>
                )}

                {/* Bookings List */}
                {selectedDay && bookings.length > 0 && (
                    <div className="max-w-2xl mx-auto bg-white rounded-xl p-6 shadow-sm border border-gray-200 mt-8">
                        <div className="flex items-center space-x-2 mb-4">
                            <Users className="w-5 h-5 text-blue-600" />
                            <h3 className="text-lg font-semibold text-gray-900">
                                Réservations du jour
                            </h3>
                        </div>
                        <ul className="space-y-2">
                            {bookings.map((booking, index) => (
                                <li key={index} className="text-gray-700">
                                    {booking.first_name} {booking.last_name.charAt(0)}.
                                </li>
                            ))}
                        </ul>
                    </div>
                )}

                {/* Notification Section */}
                {selectedDay && isFullyBooked && (
                    <div className="bg-yellow-50 border-l-4 border-yellow-400 p-6 rounded-xl shadow-sm">
                        <div className="flex items-center space-x-4">
                            <Bell className="text-yellow-500 w-6 h-6 flex-shrink-0" />
                            <div className="flex-1">
                                <p className="text-yellow-800 font-semibold mb-4">
                                    Ce jour est complet. Souhaitez-vous être notifié si une place se libère ?
                                </p>
                                <form onSubmit={handleNotificationSubmit} className="space-y-4">
                                    <input
                                        type="email"
                                        value={notificationEmail}
                                        onChange={(e) => setNotificationEmail(e.target.value)}
                                        placeholder="Votre email"
                                        className="w-full px-4 py-3 border border-yellow-200 rounded-xl focus:ring-2 focus:ring-yellow-200 focus:border-yellow-400 bg-white"
                                        required
                                    />
                                    <button
                                        type="submit"
                                        className="w-full py-3 bg-yellow-500 text-white rounded-xl hover:bg-yellow-600 transition-all duration-300 flex items-center justify-center space-x-2"
                                    >
                                        <Bell className="w-5 h-5" />
                                        <span>Me notifier</span>
                                    </button>
                                </form>
                                {notificationMessage && (
                                    <p className="mt-4 text-yellow-700 text-center">{notificationMessage}</p>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {/* Booking Form */}
                {selectedDay && !isFullyBooked && !isBookingsClosed && (
                    <div className="bg-white shadow-2xl rounded-2xl border border-gray-100 p-8">
                        <h2 className="text-2xl font-bold text-gray-900 mb-6">
                            Réserver pour le {new Date(selectedDay).toLocaleDateString("fr-FR", {
                                weekday: "long",
                                day: "numeric",
                                month: "long"
                            })}
                        </h2>
                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div className="grid md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="block text-sm font-medium text-gray-700">
                                        Prénom
                                    </label>
                                    <input
                                        type="text"
                                        value={firstName}
                                        onChange={(e) => setFirstName(e.target.value)}
                                        className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-100 focus:border-blue-500"
                                        required
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="block text-sm font-medium text-gray-700">
                                        Nom
                                    </label>
                                    <input
                                        type="text"
                                        value={lastName}
                                        onChange={(e) => setLastName(e.target.value)}
                                        className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-100 focus:border-blue-500"
                                        required
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="block text-sm font-medium text-gray-700">
                                    Téléphone
                                </label>
                                <input
                                    type="tel"
                                    value={phoneNumber}
                                    onChange={(e) => setPhoneNumber(e.target.value)}
                                    placeholder="0612345678"
                                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-100 focus:border-blue-500"
                                    required
                                />
                            </div>

                            <button
                                type="submit"
                                disabled={isLoading}
                                className="w-full py-4 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-all duration-300 flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-[1.02]"
                            >
                                {isLoading ? (
                                    <>
                                        <RefreshCw className="w-5 h-5 animate-spin" />
                                        <span>Chargement...</span>
                                    </>
                                ) : (
                                    <>
                                        <Check className="w-5 h-5" />
                                        <span>Réserver</span>
                                    </>
                                )}
                            </button>
                        </form>
                    </div>
                )}

                {/* Bookings Closed Message */}
                {selectedDay && isBookingsClosed && (
                    <div className="max-w-2xl mx-auto bg-red-50 rounded-xl p-6 border border-red-100 shadow-sm">
                        <div className="flex items-center justify-center">
                            <AlertTriangle className="w-5 h-5 text-red-500 mr-2" />
                            <p className="text-center">
                                <span className="block text-base font-medium text-red-600">
                                    Les réservations sont fermées pour aujourd&apos;hui
                                </span>
                                <span className="block text-sm text-red-500 mt-1">
                                    Reserveringen zijn gesloten voor vandaag
                                </span>
                            </p>
                        </div>
                    </div>
                )}

                {/* Admin Login Link - Moved to bottom right */}
                <div className="fixed bottom-8 right-8">
                    <button
                        onClick={() => navigate("/admin/login")}
                        className="px-6 py-3 bg-gray-600/90 backdrop-blur-sm text-white rounded-xl hover:bg-gray-700 transition-all duration-300 transform hover:scale-[1.02] focus:ring-4 focus:ring-gray-200 shadow-lg hover:shadow-xl"
                    >
                        Espace administrateur
                    </button>
                </div>
            </div>

            {/* Modal */}
            {showModal && <Modal message={modalMessage} onClose={() => setShowModal(false)} />}
        </div>
    );
}

export default Home;