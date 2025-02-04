import express from "express";
import sqlite3 from "sqlite3";
import bodyParser from "body-parser";
import cors from "cors";
import cron from "node-cron";
import { sendEmail } from "./email.js"; // Import the email utility

const app = express();
const port = 3001;

// Middleware
app.use(cors());
app.use(bodyParser.json());

// Connect to SQLite database
const db = new sqlite3.Database("./bookings.db", (err) => {
    if (err) {
        console.error("Error connecting to database:", err);
    } else {
        console.log("Connected to database");
        db.run(`
            CREATE TABLE IF NOT EXISTS bookings (
                                                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                                                    phone_number TEXT NOT NULL,
                                                    first_name TEXT NOT NULL,
                                                    last_name TEXT NOT NULL,
                                                    day TEXT NOT NULL,
                                                    start_hour INTEGER NOT NULL,
                                                    end_hour INTEGER NOT NULL,
                                                    role TEXT DEFAULT "user"
            )
        `);

        db.run(`
            CREATE TABLE IF NOT EXISTS notifications (
                                                         id INTEGER PRIMARY KEY AUTOINCREMENT,
                                                         email TEXT NOT NULL,
                                                         day TEXT NOT NULL,
                                                         UNIQUE(email, day)
                )
        `);
    }
});

// Helper function to get the Monday of the current week
const getMondayOfCurrentWeek = () => {
    const today = new Date();
    const dayOfWeek = today.getDay(); // 0 (Sunday) to 6 (Saturday)
    const monday = new Date(today);
    monday.setDate(today.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek -2)); // Adjust to Monday
    monday.setHours(0, 0, 0, 0); // Normalize time to midnight
    return monday;
};

// API to fetch calendar dates (from Monday of the current week to Sunday of the next week)
app.get("/api/dates", (req, res) => {
    const monday = getMondayOfCurrentWeek();
    const dates = Array.from({ length: 14 }, (_, i) => {
        const date = new Date(monday);
        date.setDate(monday.getDate() + i);
        return date.toISOString().split("T")[0]; // Format as YYYY-MM-DD
    });
    res.json(dates);
});

// API to save a booking
app.post("/api/book", (req, res) => {
    const { phoneNumber, firstName, lastName, day, startHour, endHour } = req.body;

    // First, check the number of existing bookings for the given day
    db.get(
        `SELECT COUNT(*) as count FROM bookings WHERE day = ?`,
        [day],
        (err, row) => {
            if (err) {
                return res.status(500).json({ error: err.message });
            }

            // If there are already 10 bookings for the day, return an error
            if (row.count >= 10) {
                return res.status(400).json({ error: "Maximum bookings reached for this date" });
            }

            // If there are fewer than 10 bookings, proceed to insert the new booking
            db.run(
                `INSERT INTO bookings (phone_number, first_name, last_name, day, start_hour, end_hour) VALUES (?, ?, ?, ?, ?, ?)`,
                [phoneNumber, firstName, lastName, day, startHour, endHour],
                function (err) {
                    if (err) {
                        res.status(500).json({ error: err.message });
                    } else {
                        res.json({ id: this.lastID });
                    }
                }
            );
        }
    );
});

// API to check if a date is fully booked
app.get("/api/availability/:day", (req, res) => {
    const { day } = req.params;

    db.get(
        `SELECT COUNT(*) as count FROM bookings WHERE day = ?`,
        [day],
        (err, row) => {
            if (err) {
                return res.status(500).json({ error: err.message });
            }

            // If there are 10 or more bookings, the date is fully booked
            const isFullyBooked = row.count >= 10;
            res.json({ isFullyBooked });
        }
    );
});

// API to subscribe for notifications
app.post("/api/notify", (req, res) => {
    const { email, day } = req.body;

    // Insert the email and day into the notifications table
    db.run(
        `INSERT INTO notifications (email, day) VALUES (?, ?)`,
        [email, day],
        function (err) {
            if (err) {
                if (err.message.includes("UNIQUE constraint failed")) {
                    return res.status(400).json({ error: "You are already subscribed for notifications for this date." });
                }
                return res.status(500).json({ error: err.message });
            } else {
                res.json({ message: "You will be notified when this date becomes available." });
            }
        }
    );
});

// Function to notify users when a date becomes available
const notifyUsers = async (day) => {
    try {
        // Fetch all users who subscribed for notifications for this date
        db.all(
            `SELECT email FROM notifications WHERE day = ?`,
            [day],
            async (err, rows) => {
                if (err) {
                    console.error("Error fetching notifications:", err);
                    return;
                }

                // Send emails to all subscribers
                for (const row of rows) {
                    const { email } = row;
                    const subject = "Une place s'est libérée !";
                    const text = `Bonjour, une place s'est libérée pour le ${day}. Réservez vite !`;

                    await sendEmail(email, subject, text);

                    // Optionally, delete the notification after sending the email
                    db.run(
                        `DELETE FROM notifications WHERE email = ? AND day = ?`,
                        [email, day],
                        (err) => {
                            if (err) {
                                console.error("Error deleting notification:", err);
                            }
                        }
                    );
                }
            }
        );
    } catch (error) {
        console.error("Error notifying users:", error);
    }
};

// Example: Call this function when a booking is canceled
app.delete("/api/bookings/:id", (req, res) => {
    const { id } = req.params;

    db.run(`DELETE FROM bookings WHERE id = ?`, [id], function (err) {
        if (err) {
            return res.status(500).json({ error: err.message });
        }

        // Notify users when a booking is canceled
        db.get(
            `SELECT day FROM bookings WHERE id = ?`,
            [id],
            (err, row) => {
                if (err) {
                    console.error("Error fetching booking:", err);
                } else if (row) {
                    notifyUsers(row.day);
                }
            }
        );

        res.json({ message: "Booking deleted successfully." });
    });
});

// Schedule a task to delete all bookings every Monday at midnight
cron.schedule("0 0 * * 1", () => {
    db.run(`DELETE FROM bookings`, (err) => {
        if (err) {
            console.error("Error deleting bookings:", err);
        } else {
            console.log("All bookings deleted (scheduled Monday cleanup).");
        }
    });
});

// Check for availability and notify users every hour
cron.schedule("0 * * * *", () => {
    const today = new Date().toISOString().split("T")[0];
    notifyUsers(today);
});

// Start the server
app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});