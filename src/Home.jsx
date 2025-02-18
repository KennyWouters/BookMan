import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Bell, Check, RefreshCw, AlertTriangle } from "lucide-react";

function Home() {
    const [dates, setDates] = useState([]);
    const [selectedDay, setSelectedDay] = useState("");
    const [phoneNumber, setPhoneNumber] = useState("");
    const [firstName, setFirstName] = useState("");
    const [lastName, setLastName] = useState("");
    const [startHour, setStartHour] = useState(14);
    const [endHour, setEndHour] = useState(16);
    const [isFullyBooked, setIsFullyBooked] = useState(false);
    const [notificationEmail, setNotificationEmail] = useState("");
    const [notificationMessage, setNotificationMessage] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [showModal, setShowModal] = useState(false);
    const [modalMessage, setModalMessage] = useState("");
    const navigate = useNavigate();

    useEffect(() => {
        const fetchDates = async () => {
            try {
                const response = await fetch("https://book-man-b65d9d654296.herokuapp.com/api/dates");
                if (!response.ok) {
                    throw new Error("Erreur lors de la récupération des dates.");
                }
                const data = await response.json();
                setDates(data);
            } catch (error) {
                console.error("Erreur :", error);
                setModalMessage("Une erreur s'est produite. Veuillez réessayer.");
                setShowModal(true);
            }
        };

        fetchDates();
    }, []);

    useEffect(() => {
        if (selectedDay) {
            const checkAvailability = async () => {
                try {
                    const response = await fetch(`https://book-man-b65d9d654296.herokuapp.com/api/availability/${selectedDay}`);
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

            checkAvailability();
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
            const response = await fetch("https://book-man-b65d9d654296.herokuapp.com/api/book", {
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
            const response = await fetch("https://book-man-b65d9d654296.herokuapp.com/api/notify", {
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
            <div className="bg-white w-96 p-6 rounded-2xl shadow-2xl border border-gray-200 text-center">
                <div className="flex justify-center mb-4">
                    <AlertTriangle className="text-yellow-500" size={48} />
                </div>
                <p className="text-lg font-medium text-gray-700 mb-6">{message}</p>
                <button
                    onClick={onClose}
                    className="w-full py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
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

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-4xl mx-auto space-y-8">
                <div className="text-center">
                    <h1 className="text-4xl font-extrabold text-gray-900 mb-4">Réservation de l'atelier bois</h1>
                    <p className="text-xl text-gray-600">Sélectionnez votre date et heure</p>
                </div>

                {/* Date Selection Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                    {dates.map((date, index) => {
                        const day = new Date(date).getDay();
                        const isFirstSaturday = new Date(date).getDate() <= 7 && day === 6;
                        const isSelectable = [4, 5, 6].includes(day) && !isFirstSaturday;

                        return (
                            <div
                                key={index}
                                className={`p-4 rounded-xl shadow-md text-center transition-all duration-300 ${
                                    isSelectable
                                        ? "bg-white hover:bg-blue-50 hover:shadow-lg cursor-pointer border-2 border-transparent hover:border-blue-500"
                                        : "bg-gray-100 opacity-60 cursor-not-allowed"
                                }`}
                                onClick={() => isSelectable && setSelectedDay(date)}
                            >
                                <p className="text-lg font-semibold text-gray-800">
                                    {new Date(date).toLocaleDateString("fr-FR", {
                                        weekday: "short",
                                        day: "numeric",
                                    })}
                                </p>
                                {isSelectable && (
                                    <div className="mt-2 text-sm text-blue-600 font-medium">
                                        {/*Disponible*/}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>

                {/* Fully Booked Notification */}
                {selectedDay && isFullyBooked && (
                    <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded-lg">
                        <div className="flex items-center">
                            <Bell className="text-yellow-500 mr-3" />
                            <p className="text-yellow-800 font-semibold">
                                Ce jour est complet. Souhaitez-vous être notifié si une place se libère ?
                            </p>
                        </div>
                        <form onSubmit={handleNotificationSubmit} className="mt-4 space-y-4">
                            <input
                                type="email"
                                value={notificationEmail}
                                onChange={(e) => setNotificationEmail(e.target.value)}
                                placeholder="Votre email"
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                required
                            />
                            <button
                                type="submit"
                                className="w-full py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center"
                            >
                                <Bell className="mr-2" size={20} />
                                Me notifier
                            </button>
                            {notificationMessage && (
                                <p className="text-green-600 text-center mt-2">{notificationMessage}</p>
                            )}
                        </form>
                    </div>
                )}

                {/* Booking Form */}
                {selectedDay && !isFullyBooked && (
                    <form
                        onSubmit={handleSubmit}
                        className="bg-white shadow-2xl rounded-2xl border border-gray-200 p-8 space-y-6"
                    >
                        <div className="grid md:grid-cols-2 gap-4">
                            <div>
                                <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 mb-2">
                                    Prénom
                                </label>
                                <input
                                    id="firstName"
                                    type="text"
                                    value={firstName}
                                    onChange={(e) => setFirstName(e.target.value)}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    required
                                />
                            </div>
                            <div>
                                <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 mb-2">
                                    Nom de famille
                                </label>
                                <input
                                    id="lastName"
                                    type="text"
                                    value={lastName}
                                    onChange={(e) => setLastName(e.target.value)}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    required
                                />
                            </div>
                        </div>

                        <div>
                            <label htmlFor="phoneNumber" className="block text-sm font-medium text-gray-700 mb-2">
                                Numéro de téléphone
                            </label>
                            <input
                                id="phoneNumber"
                                type="tel"
                                value={phoneNumber}
                                onChange={(e) => setPhoneNumber(e.target.value)}
                                placeholder="Ex: 0612345678"
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                required
                            />
                        </div>

                        <div>
                            <label htmlFor="selectedDay" className="block text-sm font-medium text-gray-700 mb-2">
                                Jour sélectionné
                            </label>
                            <input
                                id="selectedDay"
                                type="text"
                                value={formattedSelectedDay}
                                readOnly
                                className="w-full px-4 py-2 bg-gray-100 border border-gray-300 rounded-lg cursor-not-allowed"
                                required
                            />
                        </div>

                        <div className="grid md:grid-cols-2 gap-4">
                            <div>
                                <label htmlFor="startHour" className="block text-sm font-medium text-gray-700 mb-2">
                                    Heure de début
                                </label>
                                <select
                                    id="startHour"
                                    value={startHour}
                                    onChange={(e) => setStartHour(parseInt(e.target.value))}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    required
                                >
                                    {Array.from({ length: 6 }, (_, i) => (
                                        <option key={i} value={14 + i}>
                                            {14 + i}:00
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label htmlFor="endHour" className="block text-sm font-medium text-gray-700 mb-2">
                                    Heure de fin
                                </label>
                                <select
                                    id="endHour"
                                    value={endHour}
                                    onChange={(e) => setEndHour(parseInt(e.target.value))}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    required
                                >
                                    {Array.from({ length: 6 }, (_, i) => (
                                        <option key={i} value={14 + i}>
                                            {14 + i}:00
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center"
                        >
                            {isLoading ? (
                                <><RefreshCw className="mr-2 animate-spin" /> Chargement...</>
                            ) : (
                                <><Check className="mr-2" /> Réserver</>
                            )}
                        </button>
                    </form>
                )}

                {/* Admin Login Button */}
                <div className="text-center mt-8">
                    <button
                        onClick={() => navigate("/admin/login")}
                        className="py-2 px-4 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                    >
                        Admin Login
                    </button>
                </div>
            </div>

            {/* Modal */}
            {showModal && <Modal message={modalMessage} onClose={() => setShowModal(false)} />}
        </div>
    );
}

export default Home;