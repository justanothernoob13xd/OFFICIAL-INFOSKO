let idleTimer; // Declare idleTimer globally
let countdownTimer; // Declare countdownTimer globally
let countdown = 60; // Initialize countdown variable

function startIdleTimer() {
    countdown = 60; // Reset countdown to 1 minute
    console.log("Idle timer started. Redirecting in 1 minute...");
    countdownTimer = setInterval(function () {
        countdown--;
        console.log(`Redirecting in ${countdown} seconds...`); // Log countdown in console
        if (countdown <= 0) {
            clearInterval(countdownTimer);
            console.log("Redirecting now...");
            window.location.href = '/'; // Redirect to the index page
        }
    }, 1000); // 1-second intervals
}

function resetIdleTimer() {
    clearTimeout(idleTimer); // Clear the idle timeout
    clearInterval(countdownTimer); // Clear the countdown timer
    console.log("User activity detected. Idle timer reset.");
    idleTimer = setTimeout(startIdleTimer, 60000); // Restart idle timer for 1 minute
}

// Reset timer on scroll or click
$(document).on('scroll click', resetIdleTimer);

// Start idle timer on page load
idleTimer = setTimeout(startIdleTimer, 60000); // Initialize idleTimer
