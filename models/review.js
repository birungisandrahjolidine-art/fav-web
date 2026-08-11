const mongoose = require("mongoose");

const reviewSchema = new mongoose.Schema(
    {
        clientName: {
            type: String,
            required: true,
            trim: true
        },

        email: {
            type: String,
            required: true,
            trim: true,
            lowercase: true
        },

        bookingId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Booking",
            required: false
        },

        destination: {
            type: String,
            required: true,
            trim: true
        },

        tour: {
            type: String,
            trim: true
        },

        rating: {
            type: Number,
            required: true,
            min: 1,
            max: 5
        },

        reviewMessage: {
            type: String,
            required: true,
            trim: true
        },

        status: {
            type: String,
            enum: [
                "Pending",
                "Approved",
                "Rejected"
            ],
            default: "Pending"
        }
    },

    {
        timestamps: true
    }
);

module.exports = mongoose.model(
    "Review",
    reviewSchema
);