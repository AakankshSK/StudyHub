// Get references to the Login/SignUp button, the form wrapper, and the overlay
const loginSignupButton = document.getElementById("loginSignupButton");
const loginSignupForm = document.getElementById("loginSignupForm");
const overlay = document.getElementById("overlay");

// Function to open the Login/SignUp modal
const openModal = () => {
    loginSignupForm.classList.add("active");
    overlay.classList.add("active");
    document.body.style.overflow = "hidden"; // Disable scrolling on the page
};

// Function to close the Login/SignUp modal
const closeModal = () => {
    loginSignupForm.classList.remove("active");
    overlay.classList.remove("active");
    document.body.style.overflow = ""; // Re-enable scrolling
};

// Open the modal on Login/SignUp button click
loginSignupButton.addEventListener("click", openModal);

// Close the modal when clicking the overlay
overlay.addEventListener("click", closeModal);
