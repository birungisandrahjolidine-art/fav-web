const bookingForm = document.getElementById("bookingForm");

bookingForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  const formData = new FormData(bookingForm);

  const bookingData = {
    fullname: formData.get("fullname"),
    email: formData.get("email"),
    phone: formData.get("phone"),
    destination: formData.get("destination"),
    package: formData.get("package"),
    travelDate: formData.get("travel-date"),
    travelers: formData.get("travelers"),
    message: formData.get("message")
  };

  console.log("Booking being sent:", bookingData);

  try {
    const response = await fetch("/api/bookings", {
      method: "POST",

      headers: {
        "Content-Type": "application/json"
      },

      body: JSON.stringify(bookingData)
    });

    const result = await response.json();

    if (result.success) {
      alert(result.message);

      bookingForm.reset();
    } else {
      alert("Booking could not be submitted.");
    }

  } catch (error) {
    console.error("Booking error:", error);

    alert("Something went wrong. Please try again.");
  }
});