const mongoose = require("mongoose");

const bookingSchema = new mongoose.Schema(
  {
    fullname: {
      type: String,
      required: true,
      trim: true,
    },

    email: {
      type: String,
      required: true,
      trim: true,
    },

    phone: {
      type: String,
      required: true,
      trim: true,
    },

    destination: {
      type: String,
      required: true,
    },

    package: {
      type: String,
      required: true,
    },
    duration: {
      type: String,
      required: true,
      trim: true,
    },
    travelDate: {
      type: Date,
      required: true,
    },

    travelers: {
      type: Number,
      required: true,
      min: 1,
    },

    message: {
      type: String,
      trim: true,
    },

    status: {
      type: String,
      enum: ["Pending", "Confirmed", "Rejected", "Completed", "Cancelled"],
      default: "Pending",
    },
  },
  {
    timestamps: true,
  },
);

module.exports = mongoose.model("Booking", bookingSchema);
