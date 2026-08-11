const express = require("express");
const path = require("path");
const mongoose = require("mongoose");

const Booking = require("./models/Booking");

const app = express();
const PORT = 5000;


// ==================================================
// MIDDLEWARE
// ==================================================

app.use(express.json());
app.use(express.urlencoded({ extended: true }));


// ==================================================
// SERVE FRONTEND
// ==================================================

app.use(express.static(path.join(__dirname, "public")));


// ==================================================
// HOME PAGE
// ==================================================

app.get("/", (req, res) => {

    res.sendFile(
        path.join(__dirname, "public", "home.html")
    );

});


// ==================================================
// CREATE NEW BOOKING
// ==================================================

app.post("/api/bookings", async (req, res) => {

    try {

        console.log("---------------------------------");
        console.log("NEW BOOKING RECEIVED");
        console.log(req.body);
        console.log("---------------------------------");


        // Create booking
        const booking = new Booking(req.body);


        // Save booking to MongoDB
        const savedBooking = await booking.save();


        console.log("BOOKING SAVED TO MONGODB");
        console.log(savedBooking);


        res.status(201).json({

            success: true,

            message: "Booking saved successfully!",

            booking: savedBooking

        });


    } catch (error) {

        console.error("BOOKING SAVE ERROR:");
        console.error(error);


        res.status(500).json({

            success: false,

            message: "Failed to save booking.",

            error: error.message

        });

    }

});


// ==================================================
// GET ALL BOOKINGS
// ==================================================

app.get("/api/bookings", async (req, res) => {

    try {

        const bookings = await Booking
            .find()
            .sort({ createdAt: -1 });


        res.json({

            success: true,

            bookings: bookings

        });


    } catch (error) {

        console.error("ERROR GETTING BOOKINGS:");
        console.error(error);


        res.status(500).json({

            success: false,

            message: "Failed to retrieve bookings.",

            error: error.message

        });

    }

});


// ==================================================
// UPDATE BOOKING STATUS
// CONFIRM OR REJECT
// ==================================================

app.put("/api/bookings/:id/status", async (req, res) => {

    try {

        const { status } = req.body;


        // Only allow these statuses
        const allowedStatuses = [
            "Pending",
            "Confirmed",
            "Rejected",
            "Cancelled",
            "Completed"
        ];


        if (!allowedStatuses.includes(status)) {

            return res.status(400).json({

                success: false,

                message: "Invalid booking status."

            });

        }


        const booking =
            await Booking.findByIdAndUpdate(

                req.params.id,

                {
                    status: status
                },

                {
                    new: true,
                    runValidators: true
                }

            );


        if (!booking) {

            return res.status(404).json({

                success: false,

                message: "Booking not found."

            });

        }


        console.log(
            `Booking ${booking._id} changed to ${status}`
        );


        res.json({

            success: true,

            message:
                `Booking ${status.toLowerCase()} successfully!`,

            booking: booking

        });


    } catch (error) {

        console.error("STATUS UPDATE ERROR:");
        console.error(error);


        res.status(500).json({

            success: false,

            message: "Failed to update booking.",

            error: error.message

        });

    }

});


// ==================================================
// DELETE BOOKING
// ==================================================

app.delete("/api/bookings/:id", async (req, res) => {

    try {

        const booking =
            await Booking.findByIdAndDelete(
                req.params.id
            );


        if (!booking) {

            return res.status(404).json({

                success: false,

                message: "Booking not found."

            });

        }


        console.log(
            `Booking ${booking._id} deleted`
        );


        res.json({

            success: true,

            message: "Booking deleted successfully!"

        });


    } catch (error) {

        console.error("DELETE BOOKING ERROR:");
        console.error(error);


        res.status(500).json({

            success: false,

            message: "Failed to delete booking.",

            error: error.message

        });

    }

});


// ==================================================
// START SERVER
// ==================================================

async function startServer() {

    try {

        // Connect to Queen Trails database
        await mongoose.connect(
            "mongodb://127.0.0.1:27017/queen_trails_safaris"
        );


        console.log("=================================");
        console.log("MongoDB connected successfully");
        console.log(
            "Database:",
            mongoose.connection.name
        );
        console.log("=================================");


        // Start Express server
        app.listen(PORT, () => {

            console.log(
                `Queen Trails Safaris running on http://localhost:${PORT}`
            );

        });


    } catch (error) {

        console.error(
            "MongoDB connection failed:"
        );

        console.error(error);

    }

}


// Start application
startServer();