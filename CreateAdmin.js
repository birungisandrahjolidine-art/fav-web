const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const Admin = require("./models/admin");

const MONGO_URI =
    "mongodb://127.0.0.1:27017/queen_trails_safaris";

async function createAdmin() {

    try {

        // Connect to MongoDB
        await mongoose.connect(MONGO_URI);

        console.log("MongoDB connected.");


        // Admin details
        const name = "Queen Trails Admin";

        const email = "admin@queentrailssafaris.com";

        const password = "ChangeMe123!";


        // Check whether admin already exists
        const existingAdmin =
            await Admin.findOne({ email });


        if (existingAdmin) {

            console.log(
                "An admin with this email already exists."
            );

            await mongoose.connection.close();

            return;
        }


        // Hash password
        const hashedPassword =
            await bcrypt.hash(password, 10);


        // Create admin
        const admin = new Admin({

            name: name,

            email: email,

            password: hashedPassword,

            role: "Admin"

        });


        await admin.save();


        console.log("--------------------------------");
        console.log("ADMIN CREATED SUCCESSFULLY");
        console.log("--------------------------------");

        console.log("Email:", email);
        console.log("Temporary password:", password);

        console.log("--------------------------------");
        console.log(
            "IMPORTANT: Change the temporary password later."
        );
        console.log("--------------------------------");


        await mongoose.connection.close();


    } catch (error) {

        console.error(
            "Failed to create admin:"
        );

        console.error(error);

        await mongoose.connection.close();

    }

}
createAdmin();