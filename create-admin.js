console.log("STARTING ADMIN CREATION...");

require("dotenv").config();

const dns = require("dns");
dns.setServers(["8.8.8.8", "8.8.4.4"]);

const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const Admin = require("./models/admin");

const name = "Daniel Oscar Katooto";
const email = "queentrailssafaris@gmail.com";
const password = "Ronnie@345#";

async function createAdmin() {
    console.log("Connecting to MongoDB...");

    try {
        await mongoose.connect(process.env.MONGO_URI);

        console.log("MongoDB connected!");

        const existing = await Admin.findOne({ email });

        if (existing) {
            console.log("Admin already exists:", email);
            await mongoose.disconnect();
            return;
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        await Admin.create({
            name,
            email,
            password: hashedPassword,
            role: "Admin"
        });

        console.log("=================================");
        console.log("✅ ADMIN CREATED SUCCESSFULLY");
        console.log("Email:", email);
        console.log("=================================");

        await mongoose.disconnect();

    } catch (error) {
        console.error("❌ ERROR:", error.message);
    }
}

createAdmin();