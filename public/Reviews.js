/* ==================================================
QUEEN TRAILS SAFARIS
REVIEWS JAVASCRIPT
================================================== */

/* ================= VARIABLES ================= */

const reviewForm = document.getElementById("reviewForm");
const stars = document.querySelectorAll("#stars span");
const ratingInput = document.getElementById("rating");
const ratingText = document.getElementById("ratingText");
const message = document.getElementById("message");

const reviewModal = document.getElementById("reviewModal");
const openReviewBtn = document.getElementById("openReviewBtn");
const closeModalBtn = document.getElementById("closeModalBtn");

const reviewsContainer = document.getElementById("approvedReviews");
const loadMoreBtn = document.getElementById("loadMoreBtn");
const loadMoreContainer = document.getElementById("loadMoreContainer");

const menuToggle = document.getElementById("menuToggle");
const mainNav = document.getElementById("mainNav");

let selectedRating = 0;
let allReviews = [];
let currentFilter = "all";

let visibleReviews = 6;
const REVIEWS_PER_LOAD = 6;

/* ================= MOBILE NAVIGATION ================= */

if (menuToggle && mainNav) {


menuToggle.addEventListener("click", () => {

    mainNav.classList.toggle("show");

});


}

/* Close mobile menu when link is clicked */

if (mainNav) {


document.querySelectorAll("#mainNav a").forEach(link => {

    link.addEventListener("click", () => {

        mainNav.classList.remove("show");

    });

});


}

/* ================= REVIEW MODAL ================= */

if (openReviewBtn && reviewModal) {


openReviewBtn.addEventListener("click", () => {

    reviewModal.classList.add("show");

    document.body.style.overflow = "hidden";

});


}

function closeReviewModal() {


if (!reviewModal) return;

reviewModal.classList.remove("show");

document.body.style.overflow = "";


}

if (closeModalBtn) {


closeModalBtn.addEventListener(
    "click",
    closeReviewModal
);


}

if (reviewModal) {


reviewModal.addEventListener("click", event => {

    if (event.target === reviewModal) {

        closeReviewModal();

    }

});


}

/* Close modal with ESC */

document.addEventListener("keydown", event => {


if (
    event.key === "Escape" &&
    reviewModal &&
    reviewModal.classList.contains("show")
) {

    closeReviewModal();

}


});

/* ================= STAR RATING ================= */

stars.forEach(star => {


star.addEventListener("mouseover", () => {

    const rating = Number(star.dataset.rating);

    highlightStars(rating);

});


star.addEventListener("click", () => {

    selectedRating = Number(star.dataset.rating);

    if (ratingInput) {

        ratingInput.value = selectedRating;

    }

    highlightStars(selectedRating);


    const ratingMessages = {

        1: "Poor",
        2: "Fair",
        3: "Good",
        4: "Very Good",
        5: "Excellent!"

    };


    if (ratingText) {

        ratingText.textContent =
            ratingMessages[selectedRating];

    }

});


star.addEventListener("mouseout", () => {

    highlightStars(selectedRating);

});


});

function highlightStars(rating) {


stars.forEach(star => {

    const starRating =
        Number(star.dataset.rating);

    if (starRating <= rating) {

        star.classList.add("active");

    } else {

        star.classList.remove("active");

    }

});


}

/* ================= SUBMIT REVIEW ================= */

if (reviewForm) {


reviewForm.addEventListener("submit", async event => {

    event.preventDefault();


    if (selectedRating === 0) {

        showMessage(
            "Please select a rating.",
            "error"
        );

        return;

    }


    const clientNameElement =
        document.getElementById("clientName");

    const emailElement =
        document.getElementById("email");

    const destinationElement =
        document.getElementById("destination");

    const tourElement =
        document.getElementById("tour");

    const reviewMessageElement =
        document.getElementById("reviewMessage");


    const reviewData = {

        clientName:
            clientNameElement
                ? clientNameElement.value.trim()
                : "",

        email:
            emailElement
                ? emailElement.value.trim()
                : "",

        destination:
            destinationElement
                ? destinationElement.value.trim()
                : "",

        tour:
            tourElement
                ? tourElement.value.trim()
                : "",

        rating: selectedRating,

        reviewMessage:
            reviewMessageElement
                ? reviewMessageElement.value.trim()
                : ""

    };


    const submitButton =
        reviewForm.querySelector(".submit-review-btn");


    if (submitButton) {

        submitButton.disabled = true;

        submitButton.textContent = "Submitting...";

    }


    try {

        const response = await fetch(
            "/api/reviews",
            {

                method: "POST",

                headers: {
                    "Content-Type":
                        "application/json"
                },

                body:
                    JSON.stringify(reviewData)

            }
        );


        const data = await response.json();


        if (data.success) {

            showMessage(
                data.message ||
                "Review submitted successfully!",
                "success"
            );


            reviewForm.reset();

            selectedRating = 0;


            if (ratingInput) {

                ratingInput.value = "";

            }


            if (ratingText) {

                ratingText.textContent =
                    "Select your rating";

            }


            highlightStars(0);


            if (submitButton) {

                submitButton.textContent =
                    "Review Submitted ✓";

            }


            setTimeout(() => {

                closeReviewModal();


                if (submitButton) {

                    submitButton.disabled = false;

                    submitButton.textContent =
                        "Submit Review";

                }


                hideMessage();

            }, 2200);


        } else {

            showMessage(
                data.message ||
                "Failed to submit review.",
                "error"
            );


            if (submitButton) {

                submitButton.disabled = false;

                submitButton.textContent =
                    "Submit Review";

            }

        }


    } catch (error) {

        console.error(
            "REVIEW SUBMISSION ERROR:",
            error
        );


        showMessage(
            "Something went wrong. Please try again.",
            "error"
        );


        if (submitButton) {

            submitButton.disabled = false;

            submitButton.textContent =
                "Submit Review";

        }

    }

});


}

/* ================= MESSAGE FUNCTIONS ================= */

function showMessage(text, type) {


if (!message) return;

message.textContent = text;

message.className =
    `form-message ${type}`;


}

function hideMessage() {


if (!message) return;

message.textContent = "";

message.className = "form-message";


}

/* ================= LOAD APPROVED REVIEWS ================= */

async function loadApprovedReviews() {


if (!reviewsContainer) return;


try {

    const response =
        await fetch("/api/reviews");


    if (!response.ok) {

        throw new Error(
            `HTTP error: ${response.status}`
        );

    }


    const data =
        await response.json();


    if (!data.success) {

        showReviewsError();

        return;

    }


    allReviews =
        Array.isArray(data.reviews)
            ? data.reviews
            : [];


    updateRatingSummary();

    displayReviews();


} catch (error) {

    console.error(
        "ERROR LOADING REVIEWS:",
        error
    );

    showReviewsError();

}


}

/* ================= RATING SUMMARY ================= */

function updateRatingSummary() {


const total = allReviews.length;


const totalElement =
    document.getElementById(
        "totalPublicReviews"
    );


const averageElement =
    document.getElementById(
        "averageRating"
    );


if (totalElement) {

    totalElement.textContent = total;

}


if (averageElement) {

    if (total === 0) {

        averageElement.textContent = "0.0";

    } else {

        const sum =
            allReviews.reduce(
                (total, review) => {

                    return total +
                        Number(review.rating || 0);

                },
                0
            );


        const average =
            sum / total;


        averageElement.textContent =
            average.toFixed(1);

    }

}


}

/* ================= FILTER REVIEWS ================= */

document
.querySelectorAll(".filter-btn")
.forEach(button => {


    button.addEventListener("click", () => {


        document
            .querySelectorAll(".filter-btn")
            .forEach(btn => {

                btn.classList.remove("active");

            });


        button.classList.add("active");


        currentFilter =
            button.dataset.filter || "all";


        visibleReviews =
            REVIEWS_PER_LOAD;


        displayReviews();

    });

});


function getFilteredReviews() {


if (currentFilter === "all") {

    return allReviews;

}


return allReviews.filter(review => {

    return Number(review.rating) ===
        Number(currentFilter);

});


}

/* ================= DISPLAY REVIEWS ================= */

function displayReviews() {


if (!reviewsContainer) return;


const filteredReviews =
    getFilteredReviews();


if (filteredReviews.length === 0) {

    reviewsContainer.innerHTML = `

        <div class="no-reviews">

            <h3>No reviews found</h3>

            <p>
                There are no approved reviews
                for this rating yet.
            </p>

        </div>

    `;


    if (loadMoreContainer) {

        loadMoreContainer.style.display =
            "none";

    }


    return;

}


const reviewsToShow =
    filteredReviews.slice(
        0,
        visibleReviews
    );


reviewsContainer.innerHTML =
    reviewsToShow
        .map(createReviewCard)
        .join("");


if (
    loadMoreContainer &&
    loadMoreBtn
) {

    if (
        visibleReviews <
        filteredReviews.length
    ) {

        loadMoreContainer.style.display =
            "block";

    } else {

        loadMoreContainer.style.display =
            "none";

    }

}


}

/* ================= CREATE REVIEW CARD ================= */

function createReviewCard(review) {


const rating =
    Number(review.rating) || 0;


const stars =
    "★".repeat(rating) +
    "☆".repeat(5 - rating);


const initials =
    getInitials(review.clientName);


const date =
    formatDate(review.createdAt);


return `

    <article class="review-card">

        <div class="review-card-top">

            <div class="guest-info">

                <div class="guest-avatar">

                    ${escapeHTML(initials)}

                </div>


                <div>

                    <div class="guest-name">

                        ${escapeHTML(
                            review.clientName ||
                            "Anonymous Guest"
                        )}

                    </div>


                    <span class="verified">

                        ✓ Verified Guest

                    </span>

                </div>

            </div>


            <div class="card-stars">

                ${stars}

            </div>

        </div>


        <div class="review-destination">

            📍

            <span>

                ${escapeHTML(
                    review.destination ||
                    "Queen Trails Safaris"
                )}

            </span>

        </div>


        <p class="review-message">

            "${escapeHTML(
                review.reviewMessage ||
                ""
            )}"

        </p>


        <div class="review-date">

            ${date}

        </div>

    </article>

`;


}

/* ================= LOAD MORE ================= */

if (loadMoreBtn) {


loadMoreBtn.addEventListener("click", () => {

    visibleReviews +=
        REVIEWS_PER_LOAD;

    displayReviews();

});


}

/* ================= HELPERS ================= */

function getInitials(name) {


if (!name) return "?";


const parts =
    name
        .trim()
        .split(/\s+/);


if (parts.length === 1) {

    return parts[0]
        .substring(0, 2)
        .toUpperCase();

}


return (
    parts[0][0] +
    parts[parts.length - 1][0]
).toUpperCase();


}

function formatDate(dateValue) {


if (!dateValue) {

    return "Recent trip";

}


const date =
    new Date(dateValue);


if (
    Number.isNaN(
        date.getTime()
    )
) {

    return "Recent trip";

}


return date.toLocaleDateString(
    "en-US",
    {
        year: "numeric",
        month: "long",
        day: "numeric"
    }
);


}

/* ================= SECURITY ================= */

function escapeHTML(value) {


if (
    value === null ||
    value === undefined
) {

    return "";

}


return String(value)

    .replace(/&/g, "&amp;")

    .replace(/</g, "&lt;")

    .replace(/>/g, "&gt;")

    .replace(/"/g, "&quot;")

    .replace(/'/g, "&#039;");


}

/* ================= ERROR DISPLAY ================= */

function showReviewsError() {


if (!reviewsContainer) return;


reviewsContainer.innerHTML = `

    <div class="no-reviews">

        <h3>
            Unable to load reviews
        </h3>

        <p>
            Please refresh the page and try again.
        </p>

    </div>

`;


if (loadMoreContainer) {

    loadMoreContainer.style.display =
        "none";

}


}

/* ================= INITIALIZE ================= */

document.addEventListener(
"DOMContentLoaded",
() => {


    loadApprovedReviews();

}


);
