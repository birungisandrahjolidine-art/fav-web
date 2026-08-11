/* =========================================
   QUEEN TRAILS SAFARIS ADMIN DASHBOARD
========================================= */

let allBookings = [];


// =========================================
// LOAD BOOKINGS
// =========================================

async function loadBookings() {

    const table = document.getElementById("bookingTable");

    try {

        table.innerHTML = `
            <tr>
                <td colspan="7">Loading bookings...</td>
            </tr>
        `;

        const response = await fetch("/api/bookings");

        const data = await response.json();

        if (!data.success) {
            throw new Error(data.message);
        }

        allBookings = data.bookings;

        updateStatistics(allBookings);

        displayBookings(allBookings);

    } catch (error) {

        console.error("Error loading bookings:", error);

        table.innerHTML = `
            <tr>
                <td colspan="7">
                    Failed to load bookings.
                </td>
            </tr>
        `;
    }
}


// =========================================
// UPDATE STATISTICS
// =========================================

function updateStatistics(bookings) {

    const total = bookings.length;

    const pending = bookings.filter(
        booking => booking.status === "Pending"
    ).length;

    const confirmed = bookings.filter(
        booking => booking.status === "Confirmed"
    ).length;

    const cancelled = bookings.filter(
        booking =>
            booking.status === "Cancelled" ||
            booking.status === "Rejected"
    ).length;


    document.getElementById("totalBookings").textContent = total;

    document.getElementById("pendingBookings").textContent = pending;

    document.getElementById("confirmedBookings").textContent = confirmed;

    document.getElementById("cancelledBookings").textContent = cancelled;
}


// =========================================
// DISPLAY BOOKINGS
// =========================================

function displayBookings(bookings) {

    const table = document.getElementById("bookingTable");

    table.innerHTML = "";

    if (bookings.length === 0) {

        table.innerHTML = `
            <tr>
                <td colspan="7">
                    No bookings found.
                </td>
            </tr>
        `;

        return;
    }


    bookings.forEach(booking => {

        const row = document.createElement("tr");

        const travelDate = booking.travelDate
            ? new Date(booking.travelDate).toLocaleDateString()
            : "Not provided";

        const status = booking.status || "Pending";

        const statusClass = status.toLowerCase();


        row.innerHTML = `

            <td>
                <strong>
                    ${booking.fullname || "N/A"}
                </strong>
            </td>

            <td>
                ${booking.email || "N/A"}<br>
                ${booking.phone || "N/A"}
            </td>

            <td>
                ${booking.destination || "N/A"}
            </td>

            <td>
                ${travelDate}
            </td>

            <td>
                ${booking.travelers || 0}
            </td>

            <td>
                <span class="status ${statusClass}">
                    ${status}
                </span>
            </td>

            <td class="actions">

                <button
                    class="action-btn view-btn"
                    onclick="viewBooking('${booking._id}')"
                >
                    <i class="fas fa-eye"></i>
                </button>

                <button
                    class="action-btn confirm-btn"
                    onclick="confirmBooking('${booking._id}')"
                    ${status !== "Pending" ? "disabled" : ""}
                >
                    <i class="fas fa-check"></i>
                </button>

                <button
                    class="action-btn reject-btn"
                    onclick="rejectBooking('${booking._id}')"
                    ${status !== "Pending" ? "disabled" : ""}
                >
                    <i class="fas fa-times"></i>
                </button>

                <button
                    class="action-btn delete-btn"
                    onclick="deleteBooking('${booking._id}')"
                >
                    <i class="fas fa-trash"></i>
                </button>

            </td>

        `;

        table.appendChild(row);

    });
}


// =========================================
// VIEW BOOKING
// =========================================

function viewBooking(id) {

    const booking = allBookings.find(
        booking => booking._id === id
    );

    if (!booking) {

        alert("Booking not found.");

        return;
    }


    alert(
        `BOOKING DETAILS\n\n` +

        `Tourist: ${booking.fullname || "N/A"}\n` +

        `Email: ${booking.email || "N/A"}\n` +

        `Phone: ${booking.phone || "N/A"}\n` +

        `Destination: ${booking.destination || "N/A"}\n` +

        `Package: ${booking.package || "N/A"}\n` +

        `Travel Date: ${
            booking.travelDate
                ? new Date(
                    booking.travelDate
                ).toLocaleDateString()
                : "N/A"
        }\n` +

        `Travelers: ${
            booking.travelers || "N/A"
        }\n` +

        `Status: ${
            booking.status || "Pending"
        }\n\n` +

        `Message: ${
            booking.message || "No message"
        }`
    );
}


// =========================================
// CONFIRM BOOKING
// =========================================

async function confirmBooking(id) {

    const confirmAction = confirm(
        "Are you sure you want to confirm this booking?"
    );

    if (!confirmAction) {
        return;
    }


    try {

        const response = await fetch(
            `/api/bookings/${id}/status`,
            {
                method: "PUT",

                headers: {
                    "Content-Type": "application/json"
                },

                body: JSON.stringify({
                    status: "Confirmed"
                })
            }
        );


        const data = await response.json();


        if (!data.success) {

            alert(data.message);

            return;
        }


        alert("Booking confirmed successfully!");

        loadBookings();

    } catch (error) {

        console.error(error);

        alert("Failed to confirm booking.");

    }
}


// =========================================
// REJECT BOOKING
// =========================================

async function rejectBooking(id) {

    const confirmAction = confirm(
        "Are you sure you want to reject this booking?"
    );

    if (!confirmAction) {
        return;
    }


    try {

        const response = await fetch(
            `/api/bookings/${id}/status`,
            {
                method: "PUT",

                headers: {
                    "Content-Type": "application/json"
                },

                body: JSON.stringify({
                    status: "Rejected"
                })
            }
        );


        const data = await response.json();


        if (!data.success) {

            alert(data.message);

            return;
        }


        alert("Booking rejected successfully!");

        loadBookings();

    } catch (error) {

        console.error(error);

        alert("Failed to reject booking.");

    }
}


// =========================================
// DELETE BOOKING
// =========================================

async function deleteBooking(id) {

    const confirmAction = confirm(
        "Are you sure you want to permanently delete this booking?"
    );

    if (!confirmAction) {
        return;
    }


    try {

        const response = await fetch(
            `/api/bookings/${id}`,
            {
                method: "DELETE"
            }
        );


        const data = await response.json();


        if (!data.success) {

            alert(data.message);

            return;
        }


        alert("Booking deleted successfully!");

        loadBookings();

    } catch (error) {

        console.error(error);

        alert("Failed to delete booking.");

    }
}


// =========================================
// SEARCH BOOKINGS
// =========================================

document
    .getElementById("searchInput")
    .addEventListener("input", function () {

        const searchText =
            this.value.toLowerCase();


        const filteredBookings =
            allBookings.filter(booking => {

                const name =
                    (booking.fullname || "")
                    .toLowerCase();

                const email =
                    (booking.email || "")
                    .toLowerCase();


                return (
                    name.includes(searchText) ||
                    email.includes(searchText)
                );

            });


        displayBookings(filteredBookings);

    });


// =========================================
// FILTER BOOKINGS
// =========================================

document
    .getElementById("statusFilter")
    .addEventListener("change", function () {

        const selectedStatus = this.value;


        if (selectedStatus === "All") {

            displayBookings(allBookings);

            return;
        }


        const filteredBookings =
            allBookings.filter(
                booking =>
                    booking.status === selectedStatus
            );


        displayBookings(filteredBookings);

    });


// =========================================
// LOAD WHEN PAGE OPENS
// =========================================

document.addEventListener(
    "DOMContentLoaded",
    () => {

        loadBookings();

    }
);