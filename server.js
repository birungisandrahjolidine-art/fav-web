require("dotenv").config();

const dns = require("dns");
dns.setServers(["8.8.8.8", "8.8.4.4"]);

const express = require("express");
const path = require("path");
const mongoose = require("mongoose");
const session = require("express-session");
const connectMongo = require("connect-mongo");
const bcrypt = require("bcryptjs");
const nodemailer = require("nodemailer");

// ==================================================
// CONNECT-MONGO
// ==================================================

const MongoStore = connectMongo.default || connectMongo;

// ==================================================
// MODELS
// ==================================================

const Booking = require("./models/booking");
const Admin = require("./models/admin");
const Review = require("./models/review");

// ==================================================
// APP
// ==================================================

const app = express();

const PORT = process.env.PORT || 5000;

const MONGO_URI =
  process.env.MONGO_URI ||
  "mongodb://127.0.0.1:27017/queen_trails_safaris";

// ==================================================
// EMAIL TRANSPORTER
// ==================================================

const emailTransporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD,
  },
});

// ==================================================
// MIDDLEWARE
// ==================================================

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ==================================================
// SESSION
// ==================================================

app.use(
  session({
    secret: process.env.SESSION_SECRET || "queen-trails-secret-key",

    resave: false,

    saveUninitialized: false,

    store:
      typeof MongoStore.create === "function"
        ? MongoStore.create({
            mongoUrl: MONGO_URI,
            collectionName: "sessions",
          })
        : new MongoStore({
            url: MONGO_URI,
            collection: "sessions",
          }),

    cookie: {
      httpOnly: true,
      maxAge: 1000 * 60 * 60,
      secure: process.env.NODE_ENV === "production",
    },
  })
);

// ==================================================
// CLEAN PAGE URLS
// ==================================================

// HOME
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "home.html"));
});

// ABOUT
app.get(["/about", "/aboutus"], (req, res) => {
  res.sendFile(path.join(__dirname, "public", "aboutus.html"));
});

// TOURS
app.get("/tours", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "tours.html"));
});

// BOOKING
app.get("/booking", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "contact.html"));
});

// CONTACT
app.get("/contact", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "contact.html"));
});

// REVIEWS
app.get("/reviews", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "Reviews.html"));
});

// ==================================================
// REDIRECT OLD .HTML URLS TO CLEAN URLS
// ==================================================

// home.html -> /
app.get("/home.html", (req, res) => {
  res.redirect(301, "/");
});

// about.html -> /about
app.get("/about.html", (req, res) => {
  res.redirect(301, "/about");
});

// aboutus.html -> /about
app.get("/aboutus.html", (req, res) => {
  res.redirect(301, "/about");
});

// tours.html -> /tours
app.get("/tours.html", (req, res) => {
  res.redirect(301, "/tours");
});

// booking.html -> /booking
app.get("/booking.html", (req, res) => {
  res.redirect(301, "/booking");
});

// contact.html -> /contact
app.get("/contact.html", (req, res) => {
  res.redirect(301, "/contact");
});

// reviews.html -> /reviews
app.get("/reviews.html", (req, res) => {
  res.redirect(301, "/reviews");
});

// Reviews.html -> /reviews
app.get("/Reviews.html", (req, res) => {
  res.redirect(301, "/reviews");
});

// ==================================================
// ADMIN LOGIN PAGE
// ==================================================

app.get("/admin-login", (req, res) => {
  res.sendFile(
    path.join(__dirname, "public", "admin-login.html")
  );
});

// Redirect old admin login URL
app.get("/admin-login.html", (req, res) => {
  res.redirect(301, "/admin-login");
});

// ==================================================
// ADMIN DASHBOARD
// ==================================================

app.get("/admin", (req, res) => {
  if (!req.session.adminId) {
    return res.redirect("/admin-login");
  }

  res.sendFile(
    path.join(__dirname, "public", "admin.html")
  );
});

// Redirect old admin dashboard URL
app.get("/admin.html", (req, res) => {
  if (!req.session.adminId) {
    return res.redirect(301, "/admin-login");
  }

  return res.redirect(301, "/admin");
});

// ==================================================
// SERVE FRONTEND FILES
// ==================================================

app.use(
  express.static(path.join(__dirname, "public"))
);

// ==================================================
// ADMIN LOGIN API
// ==================================================

app.post("/api/admin/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    console.log("---------------------------------");
    console.log("ADMIN LOGIN ATTEMPT");
    console.log("Email:", email);
    console.log("---------------------------------");

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and password are required.",
      });
    }

    const admin = await Admin.findOne({
      email: email.toLowerCase().trim(),
    });

    if (!admin) {
      console.log("ADMIN NOT FOUND");

      return res.status(401).json({
        success: false,
        message: "Invalid email or password.",
      });
    }

    const passwordMatch = await bcrypt.compare(
      password,
      admin.password
    );

    if (!passwordMatch) {
      console.log("WRONG PASSWORD");

      return res.status(401).json({
        success: false,
        message: "Invalid email or password.",
      });
    }

    req.session.adminId = admin._id.toString();
    req.session.adminName = admin.name;
    req.session.adminEmail = admin.email;

    console.log("ADMIN LOGIN SUCCESSFUL");

    res.json({
      success: true,
      message: "Login successful!",
    });
  } catch (error) {
    console.error("ADMIN LOGIN ERROR:");
    console.error(error);

    res.status(500).json({
      success: false,
      message: "Login failed.",
      error: error.message,
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
      message: "Not authenticated.",
    });
  }

  res.json({
    success: true,

    admin: {
      id: req.session.adminId,
      name: req.session.adminName,
      email: req.session.adminEmail,
    },
  });
});

// ==================================================
// ADMIN LOGOUT
// ==================================================

app.post("/api/admin/logout", (req, res) => {
  req.session.destroy((error) => {
    if (error) {
      console.error("LOGOUT ERROR:", error);

      return res.status(500).json({
        success: false,
        message: "Logout failed.",
      });
    }

    res.json({
      success: true,
      message: "Logged out successfully.",
    });
  });
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

    const booking = new Booking(req.body);

    const savedBooking = await booking.save();

    console.log("BOOKING SAVED SUCCESSFULLY");
    console.log(savedBooking);

    // ==================================================
    // SEND APPRECIATION EMAIL TO CLIENT
    // ==================================================

    try {
      if (
        process.env.EMAIL_USER &&
        process.env.EMAIL_PASSWORD
      ) {
        const mailOptions = {
          from: `"Queen Trails Safaris" <${process.env.EMAIL_USER}>`,

          to: savedBooking.email,

          subject:
            "Thank You for Trusting Queen Trails Safaris",

          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 30px auto; padding: 30px; color: #333; border: 1px solid #ddd; border-radius: 10px; background-color: #ffffff;">

              <h2 style="color: #0f3f25;">
                Thank You, ${savedBooking.fullname}!
              </h2>

              <p>
                Thank you for trusting
                <strong>Queen Trails Safaris</strong>
                with your travel experience.
              </p>

              <p>
                We are delighted to receive your booking request
                and truly appreciate you choosing us for your adventure.
              </p>

              <h3 style="color: #0f3f25;">
                Your Booking Details
              </h3>

              <p>
                <strong>Destination:</strong>
                ${savedBooking.destination}
              </p>

              <p>
                <strong>Package:</strong>
                ${savedBooking.package}
              </p>

              <p>
                <strong>Duration:</strong>
                ${savedBooking.duration}
              </p>

              <p>
                <strong>Travel Date:</strong>
                ${new Date(
                  savedBooking.travelDate
                ).toLocaleDateString()}
              </p>

              <p>
                <strong>Number of Travelers:</strong>
                ${savedBooking.travelers}
              </p>

              <p>
                Your booking has been received successfully.
                Our team will review your request and contact you
                shortly with confirmation and any additional information.
              </p>

              <p>
                We look forward to giving you an unforgettable experience
                with <strong>Queen Trails Safaris</strong>.
              </p>

              <p>
                <strong>
                  Thank you for choosing and trusting
                  Queen Trails Safaris.
                </strong>
              </p>

              <br>

              <p>
                Warm regards,<br>
                <strong>Queen Trails Safaris</strong>
              </p>

            </div>
          `,
        };

        await emailTransporter.sendMail(mailOptions);

        console.log(
          "APPRECIATION EMAIL SENT TO:",
          savedBooking.email
        );
      } else {
        console.log(
          "EMAIL NOT SENT: EMAIL_USER or EMAIL_PASSWORD is missing."
        );
      }
    } catch (emailError) {
      console.error("EMAIL FAILED:");
      console.error(emailError.message);
    }

    // ==================================================
    // SEND BOOKING NOTIFICATION TO MANAGER
    // ==================================================

    try {
      if (
        process.env.EMAIL_USER &&
        process.env.EMAIL_PASSWORD &&
        process.env.MANAGER_EMAIL
      ) {
        const managerMailOptions = {
          from: `"Queen Trails Safaris" <${process.env.EMAIL_USER}>`,

          to: process.env.MANAGER_EMAIL,

          subject:
            "New Booking Received - Queen Trails Safaris",

          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 30px auto; padding: 30px; color: #333; border: 1px solid #ddd; border-radius: 10px; background-color: #ffffff;">

              <h2 style="color: #0f3f25;">
                New Booking Received
              </h2>

              <p>
                A new client has submitted a booking through the
                Queen Trails Safaris website.
              </p>

              <h3>Booking Details</h3>

              <p>
                <strong>Client:</strong>
                ${savedBooking.fullname}
              </p>

              <p>
                <strong>Email:</strong>
                ${savedBooking.email}
              </p>

              <p>
                <strong>Destination:</strong>
                ${savedBooking.destination}
              </p>

              <p>
                <strong>Package:</strong>
                ${savedBooking.package}
              </p>

              <p>
                <strong>Duration:</strong>
                ${savedBooking.duration}
              </p>

              <p>
                <strong>Travel Date:</strong>
                ${new Date(
                  savedBooking.travelDate
                ).toLocaleDateString()}
              </p>

              <p>
                <strong>Number of Travelers:</strong>
                ${savedBooking.travelers}
              </p>

              <p>
                Please log in to the admin dashboard
                to review this booking.
              </p>

              <p>
                <strong>Queen Trails Safaris</strong>
              </p>

            </div>
          `,
        };

        await emailTransporter.sendMail(
          managerMailOptions
        );

        console.log(
          "NEW BOOKING NOTIFICATION SENT TO MANAGER:",
          process.env.MANAGER_EMAIL
        );
      } else {
        console.log(
          "MANAGER EMAIL NOT SENT: Email configuration is incomplete."
        );
      }
    } catch (managerEmailError) {
      console.error(
        "MANAGER BOOKING EMAIL FAILED:"
      );

      console.error(
        managerEmailError.message
      );
    }

    // ==================================================
    // RESPONSE
    // ==================================================

    res.status(201).json({
      success: true,
      message: "Booking submitted successfully.",
      booking: savedBooking,
    });
  } catch (error) {
    console.error("BOOKING ERROR:");
    console.error(error);

    res.status(500).json({
      success: false,
      message: "Failed to save booking.",
      error: error.message,
    });
  }
});

// ==================================================
// GET ALL BOOKINGS
// ==================================================

app.get("/api/bookings", async (req, res) => {
  try {
    const bookings = await Booking.find().sort({
      createdAt: -1,
    });

    res.json({
      success: true,
      bookings: bookings,
    });
  } catch (error) {
    console.error("ERROR GETTING BOOKINGS:");
    console.error(error);

    res.status(500).json({
      success: false,
      message: "Failed to retrieve bookings.",
      error: error.message,
    });
  }
});

// ==================================================
// UPDATE BOOKING STATUS
// ==================================================

app.put(
  "/api/bookings/:id/status",
  async (req, res) => {
    try {
      const { status } = req.body;

      const allowedStatuses = [
        "Pending",
        "Confirmed",
        "Rejected",
        "Cancelled",
        "Completed",
      ];

      if (!allowedStatuses.includes(status)) {
        return res.status(400).json({
          success: false,
          message: "Invalid booking status.",
        });
      }

      const booking =
        await Booking.findByIdAndUpdate(
          req.params.id,
          {
            status: status,
          },
          {
            new: true,
            runValidators: true,
          }
        );

      if (!booking) {
        return res.status(404).json({
          success: false,
          message: "Booking not found.",
        });
      }

      console.log(
        `Booking ${booking._id} changed to ${status}`
      );

      res.json({
        success: true,

        message:
          `Booking ${status.toLowerCase()} successfully!`,

        booking: booking,
      });
    } catch (error) {
      console.error("STATUS UPDATE ERROR:");
      console.error(error);

      res.status(500).json({
        success: false,
        message: "Failed to update booking.",
        error: error.message,
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
          message: "Booking not found.",
        });
      }

      console.log(
        `Booking ${booking._id} deleted`
      );

      res.json({
        success: true,
        message:
          "Booking deleted successfully!",
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
          error.message,
      });
    }
  }
);

// ==================================================
// SUBMIT CLIENT REVIEW
// ==================================================

app.post(
  "/api/reviews",
  async (req, res) => {
    try {
      const {
        clientName,
        email,
        bookingId,
        destination,
        tour,
        rating,
        reviewMessage,
      } = req.body;

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
            "Please fill in all required fields.",
        });
      }

      const review = new Review({
        clientName:
          clientName.trim(),

        email:
          email
            .toLowerCase()
            .trim(),

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
          "Pending",
      });

      const savedReview =
        await review.save();

      // ==================================================
      // SEND REVIEW NOTIFICATION TO MANAGER
      // ==================================================

      try {
        if (
          process.env.EMAIL_USER &&
          process.env.EMAIL_PASSWORD &&
          process.env.MANAGER_EMAIL
        ) {
          const managerReviewMailOptions = {
            from:
              `"Queen Trails Safaris" <${process.env.EMAIL_USER}>`,

            to:
              process.env.MANAGER_EMAIL,

            subject:
              "New Customer Review - Queen Trails Safaris",

            html: `
              <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 30px auto; padding: 30px; color: #333; border: 1px solid #ddd; border-radius: 10px; background-color: #ffffff;">

                <h2 style="color: #0f3f25;">
                  New Customer Review
                </h2>

                <p>
                  A new customer review has been submitted
                  on the Queen Trails Safaris website
                  and is awaiting approval.
                </p>

                <h3>Review Details</h3>

                <p>
                  <strong>Client:</strong>
                  ${savedReview.clientName}
                </p>

                <p>
                  <strong>Email:</strong>
                  ${savedReview.email}
                </p>

                <p>
                  <strong>Destination:</strong>
                  ${savedReview.destination}
                </p>

                <p>
                  <strong>Tour:</strong>
                  ${savedReview.tour}
                </p>

                <p>
                  <strong>Rating:</strong>
                  ${savedReview.rating} / 5
                </p>

                <p>
                  <strong>Review:</strong>
                  ${savedReview.reviewMessage}
                </p>

                <p>
                  <strong>Status:</strong>
                  Pending Approval
                </p>

                <p>
                  Please log in to the admin dashboard
                  to review and approve this review.
                </p>

                <p>
                  <strong>Queen Trails Safaris</strong>
                </p>

              </div>
            `,
          };

          await emailTransporter.sendMail(
            managerReviewMailOptions
          );

          console.log(
            "NEW REVIEW NOTIFICATION SENT TO MANAGER:",
            process.env.MANAGER_EMAIL
          );
        } else {
          console.log(
            "MANAGER REVIEW EMAIL NOT SENT: Email configuration is incomplete."
          );
        }
      } catch (
        managerReviewEmailError
      ) {
        console.error(
          "MANAGER REVIEW EMAIL FAILED:"
        );

        console.error(
          managerReviewEmailError.message
        );
      }

      console.log(
        "REVIEW SAVED SUCCESSFULLY"
      );

      console.log(savedReview);

      res.status(201).json({
        success: true,

        message:
          "Thank you! Your review has been submitted and is awaiting approval.",

        review:
          savedReview,
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
          error.message,
      });
    }
  }
);

// ==================================================
// GET APPROVED REVIEWS
// ==================================================

app.get(
  "/api/reviews",
  async (req, res) => {
    try {
      const reviews =
        await Review.find({
          status: "Approved",
        }).sort({
          createdAt: -1,
        });

      res.json({
        success: true,
        reviews: reviews,
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
          error.message,
      });
    }
  }
);

// ==================================================
// GET ALL REVIEWS FOR ADMIN
// ==================================================

app.get(
  "/api/admin/reviews",
  async (req, res) => {
    try {
      const reviews =
        await Review.find().sort({
          createdAt: -1,
        });

      res.json({
        success: true,
        reviews: reviews,
      });
    } catch (error) {
      console.error(
        "ERROR GETTING ADMIN REVIEWS:"
      );

      console.error(error);

      res.status(500).json({
        success: false,

        message:
          "Failed to retrieve reviews.",

        error:
          error.message,
      });
    }
  }
);

// ==================================================
// UPDATE REVIEW STATUS
// ==================================================

app.put(
  "/api/admin/reviews/:id/status",
  async (req, res) => {
    try {
      const { status } = req.body;

      const allowedStatuses = [
        "Pending",
        "Approved",
        "Rejected",
      ];

      if (!allowedStatuses.includes(status)) {
        return res.status(400).json({
          success: false,
          message:
            "Invalid review status.",
        });
      }

      const review =
        await Review.findByIdAndUpdate(
          req.params.id,
          {
            status: status,
          },
          {
            new: true,
            runValidators: true,
          }
        );

      if (!review) {
        return res.status(404).json({
          success: false,
          message:
            "Review not found.",
        });
      }

      console.log(
        `Review ${review._id} changed to ${status}`
      );

      res.json({
        success: true,

        message:
          `Review ${status.toLowerCase()} successfully!`,

        review:
          review,
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
          error.message,
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
          message:
            "Review not found.",
        });
      }

      console.log(
        `Review ${review._id} deleted`
      );

      res.json({
        success: true,

        message:
          "Review deleted successfully!",
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
          error.message,
      });
    }
  }
);

// ==================================================
// START SERVER
// ==================================================

async function startServer() {
  try {
    await mongoose.connect(MONGO_URI);

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

    if (
      process.env.EMAIL_USER &&
      process.env.EMAIL_PASSWORD
    ) {
      console.log(
        "Email configuration detected"
      );
    } else {
      console.log(
        "WARNING: Email credentials are not configured."
      );

      console.log(
        "Bookings will still be saved."
      );
    }

    app.listen(
      PORT,
      "0.0.0.0",
      () => {
        console.log(
          `Queen Trails Safaris running on port ${PORT}`
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
// RUN SERVER
// ==================================================

startServer();