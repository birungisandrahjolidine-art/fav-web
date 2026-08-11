const express = require("express");
const path = require("path");
const mongoose = require("mongoose");
const session = require("express-session");
const bcrypt = require("bcryptjs");

const Booking = require("./models/Booking");
const Admin = require("./models/Admin");
const Review = require("./models/Review");

const app = express();
const PORT = 5000;


// ==================================================
// MIDDLEWARE
// ==================================================

app.use(express.json());

app.use(
    express.urlencoded({
        extended: true
    })
);


// ==================================================
// SESSION
// ==================================================

app.use(
    session({
        secret: "queen-trails-secret-key",

        resave: false,

        saveUninitialized: false,

        cookie: {
            httpOnly: true,
            maxAge: 1000 * 60 * 60
        }
    })
);


// ==================================================
// HOME PAGE
// ==================================================

app.get("/", (req, res) => {

    res.sendFile(
        path.join(
            __dirname,
            "public",
            "home.html"
        )
    );

});


// ==================================================
// ADMIN LOGIN
// ==================================================

app.post("/api/admin/login", async (req, res) => {

    try {

        const { email, password } = req.body;


        console.log("---------------------------------");
        console.log("ADMIN LOGIN ATTEMPT");
        console.log("Email:", email);
        console.log("---------------------------------");


        // Check required fields

        if (!email || !password) {

            return res.status(400).json({

                success: false,

                message:
                    "Email and password are required."

            });

        }


        // Find admin

        const admin = await Admin.findOne({

            email:
                email.toLowerCase().trim()

        });


        // Admin not found

        if (!admin) {

            console.log("ADMIN NOT FOUND");

            return res.status(401).json({

                success: false,

                message:
                    "Invalid email or password."

            });

        }


        // Compare password

        const passwordMatch =
            await bcrypt.compare(
                password,
                admin.password
            );


        // Password incorrect

        if (!passwordMatch) {

            console.log("WRONG PASSWORD");

            return res.status(401).json({

                success: false,

                message:
                    "Invalid email or password."

            });

        }


        // Create login session

        req.session.adminId =
            admin._id.toString();

        req.session.adminName =
            admin.name;

        req.session.adminEmail =
            admin.email;


        console.log(
            "ADMIN LOGIN SUCCESSFUL"
        );


        res.json({

            success: true,

            message:
                "Login successful!"

        });


    } catch (error) {

        console.error(
            "ADMIN LOGIN ERROR:"
        );

        console.error(error);


        res.status(500).json({

            success: false,

            message:
                "Login failed.",

            error:
                error.message

        });

    }

});


// ==================================================
// CHECK ADMIN LOGIN
// ==================================================

app.get("/api/admin/check", (req, res) => {

    if (!req.session.adminId) {

        return res.status(401).json({

            success: false,

            message:
                "Not authenticated."

        });

    }


    res.json({

        success: true,

        admin: {

            id:
                req.session.adminId,

            name:
                req.session.adminName,

            email:
                req.session.adminEmail

        }

    });

});


// ==================================================
// PROTECT ADMIN DASHBOARD
// ==================================================

app.get("/admin.html", (req, res) => {

    if (!req.session.adminId) {

        return res.redirect(
            "/admin-login.html"
        );

    }


    res.sendFile(

        path.join(
            __dirname,
            "public",
            "admin.html"
        )

    );

});


// ==================================================
// SERVE FRONTEND FILES
// ==================================================

app.use(
    express.static(
        path.join(
            __dirname,
            "public"
        )
    )
);


// ==================================================
// ADMIN LOGOUT
// ==================================================

app.post(
    "/api/admin/logout",
    (req, res) => {

        req.session.destroy((error) => {

            if (error) {

                console.error(
                    "LOGOUT ERROR:",
                    error
                );

                return res.status(500).json({

                    success: false,

                    message:
                        "Logout failed."

                });

            }


            res.json({

                success: true,

                message:
                    "Logged out successfully."

            });

        });

    }
);


// ==================================================
// CREATE NEW BOOKING
// ==================================================

app.post(
    "/api/bookings",
    async (req, res) => {

        try {

            console.log(
                "---------------------------------"
            );

            console.log(
                "NEW BOOKING RECEIVED"
            );

            console.log(req.body);

            console.log(
                "---------------------------------"
            );


            // Create booking

            const booking =
                new Booking(req.body);


            // Save booking

            const savedBooking =
                await booking.save();


            console.log(
                "BOOKING SAVED TO MONGODB"
            );

            console.log(
                savedBooking
            );


            res.status(201).json({

                success: true,

                message:
                    "Booking saved successfully!",

                booking:
                    savedBooking

            });


        } catch (error) {

            console.error(
                "BOOKING SAVE ERROR:"
            );

            console.error(error);


            res.status(500).json({

                success: false,

                message:
                    "Failed to save booking.",

                error:
                    error.message

            });

        }

    }
);


// ==================================================
// GET ALL BOOKINGS
// ==================================================

app.get(
    "/api/bookings",
    async (req, res) => {

        try {

            const bookings =
                await Booking
                    .find()
                    .sort({
                        createdAt: -1
                    });


            res.json({

                success: true,

                bookings:
                    bookings

            });


        } catch (error) {

            console.error(
                "ERROR GETTING BOOKINGS:"
            );

            console.error(error);


            res.status(500).json({

                success: false,

                message:
                    "Failed to retrieve bookings.",

                error:
                    error.message

            });

        }

    }
);


// ==================================================
// UPDATE BOOKING STATUS
// ==================================================

app.put(
    "/api/bookings/:id/status",
    async (req, res) => {

        try {

            const { status } =
                req.body;


            // Allowed statuses

            const allowedStatuses = [

                "Pending",

                "Confirmed",

                "Rejected",

                "Cancelled",

                "Completed"

            ];


            if (
                !allowedStatuses.includes(
                    status
                )
            ) {

                return res.status(400).json({

                    success: false,

                    message:
                        "Invalid booking status."

                });

            }


            // Update booking

            const booking =
                await Booking.findByIdAndUpdate(

                    req.params.id,

                    {
                        status:
                            status
                    },

                    {
                        new: true,

                        runValidators: true
                    }

                );


            // Booking not found

            if (!booking) {

                return res.status(404).json({

                    success: false,

                    message:
                        "Booking not found."

                });

            }


            console.log(
                `Booking ${booking._id} changed to ${status}`
            );


            res.json({

                success: true,

                message:
                    `Booking ${status.toLowerCase()} successfully!`,

                booking:
                    booking

            });


        } catch (error) {

            console.error(
                "STATUS UPDATE ERROR:"
            );

            console.error(error);


            res.status(500).json({

                success: false,

                message:
                    "Failed to update booking.",

                error:
                    error.message

            });

        }

    }
);


// ==================================================
// DELETE BOOKING
// ==================================================

app.delete(
    "/api/bookings/:id",
    async (req, res) => {

        try {

            const booking =
                await Booking.findByIdAndDelete(
                    req.params.id
                );


            if (!booking) {

                return res.status(404).json({

                    success: false,

                    message:
                        "Booking not found."

                });

            }


            console.log(
                `Booking ${booking._id} deleted`
            );


            res.json({

                success: true,

                message:
                    "Booking deleted successfully!"

            });


        } catch (error) {

            console.error(
                "DELETE BOOKING ERROR:"
            );

            console.error(error);


            res.status(500).json({

                success: false,

                message:
                    "Failed to delete booking.",

                error:
                    error.message

            });

        }

    }
);

// ==================================================
// SUBMIT CLIENT REVIEW
// ==================================================

app.post("/api/reviews", async (req, res) => {

    try {

        const {
            clientName,
            email,
            bookingId,
            destination,
            tour,
            rating,
            reviewMessage
        } = req.body;


        // Check required information

        if (
            !clientName ||
            !email ||
            !destination ||
            !tour ||
            !rating ||
            !reviewMessage
        ) {

            return res.status(400).json({

                success: false,

                message:
                    "Please fill in all required fields."

            });

        }


        // Create review

        const review = new Review({

            clientName:
                clientName.trim(),

            email:
                email.toLowerCase().trim(),

            bookingId:
                bookingId || undefined,

            destination:
                destination.trim(),

            tour:
                tour.trim(),

            rating:
                Number(rating),

            reviewMessage:
                reviewMessage.trim(),

            status:
                "Pending"

        });


        // Save review

        const savedReview =
            await review.save();


        console.log(
            "REVIEW SAVED SUCCESSFULLY"
        );

        console.log(savedReview);


        res.status(201).json({

            success: true,

            message:
                "Thank you! Your review has been submitted and is awaiting approval.",

            review:
                savedReview

        });


    } catch (error) {

        console.error(
            "REVIEW SAVE ERROR:"
        );

        console.error(error);


        res.status(500).json({

            success: false,

            message:
                "Failed to submit review.",

            error:
                error.message

        });

    }

});

// ==================================================
// GET APPROVED REVIEWS
// ==================================================

app.get("/api/reviews", async (req, res) => {

    try {

        const reviews =
            await Review.find({
                status: "Approved"
            })
            .sort({
                createdAt: -1
            });


        res.json({

            success: true,

            reviews:
                reviews

        });


    } catch (error) {

        console.error(
            "ERROR GETTING REVIEWS:"
        );

        console.error(error);


        res.status(500).json({

            success: false,

            message:
                "Failed to retrieve reviews.",

            error:
                error.message

        });

    }

});

// ==================================================
// START SERVER
// ==================================================

async function startServer() {

    try {

        // Connect to MongoDB

        await mongoose.connect(
            "mongodb://127.0.0.1:27017/queen_trails_safaris"
        );


        console.log(
            "================================="
        );

        console.log(
            "MongoDB connected successfully"
        );

        console.log(
            "Database:",
            mongoose.connection.name
        );

        console.log(
            "================================="
        );


        // Start Express

        app.listen(
            PORT,
            () => {

                console.log(
                    `Queen Trails Safaris running on http://localhost:${PORT}`
                );

            }
        );


    } catch (error) {

        console.error(
            "MongoDB connection failed:"
        );

        console.error(error);

        process.exit(1);

    }

}

// ==================================================
// GET ALL REVIEWS FOR ADMIN
// ==================================================

app.get("/api/admin/reviews", async (req, res) => {

    try {

        const reviews = await Review.find()
            .sort({ createdAt: -1 });

        res.json({

            success: true,

            reviews: reviews

        });

    } catch (error) {

        console.error(
            "ERROR GETTING ADMIN REVIEWS:"
        );

        console.error(error);

        res.status(500).json({

            success: false,

            message: "Failed to retrieve reviews.",

            error: error.message

        });

    }

});


// ==================================================
// UPDATE REVIEW STATUS
// APPROVE OR REJECT
// ==================================================

app.put(
    "/api/admin/reviews/:id/status",
    async (req, res) => {

        try {

            const { status } = req.body;

            const allowedStatuses = [
                "Pending",
                "Approved",
                "Rejected"
            ];

            if (!allowedStatuses.includes(status)) {

                return res.status(400).json({

                    success: false,

                    message: "Invalid review status."

                });

            }

            const review =
                await Review.findByIdAndUpdate(

                    req.params.id,

                    {
                        status: status
                    },

                    {
                        new: true,
                        runValidators: true
                    }

                );

            if (!review) {

                return res.status(404).json({

                    success: false,

                    message: "Review not found."

                });

            }

            console.log(
                `Review ${review._id} changed to ${status}`
            );

            res.json({

                success: true,

                message:
                    `Review ${status.toLowerCase()} successfully!`,

                review: review

            });

        } catch (error) {

            console.error(
                "REVIEW STATUS UPDATE ERROR:"
            );

            console.error(error);

            res.status(500).json({

                success: false,

                message:
                    "Failed to update review.",

                error:
                    error.message

            });

        }

    }
);


// ==================================================
// DELETE REVIEW
// ==================================================

app.delete(
    "/api/admin/reviews/:id",
    async (req, res) => {

        try {

            const review =
                await Review.findByIdAndDelete(
                    req.params.id
                );

            if (!review) {

                return res.status(404).json({

                    success: false,

                    message: "Review not found."

                });

            }

            console.log(
                `Review ${review._id} deleted`
            );

            res.json({

                success: true,

                message:
                    "Review deleted successfully!"

            });

        } catch (error) {

            console.error(
                "DELETE REVIEW ERROR:"
            );

            console.error(error);

            res.status(500).json({

                success: false,

                message:
                    "Failed to delete review.",

                error:
                    error.message

            });

        }

    }
);

// ==================================================
// RUN SERVER
// ==================================================

startServer();
