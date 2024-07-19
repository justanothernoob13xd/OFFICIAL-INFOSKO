// idle-timer.js
document.addEventListener('DOMContentLoaded', function() {
    var idleTime = 0;
    var idleInterval = setInterval(timerIncrement, 1000); // 1 second

    // Reset the idle timer on any of these events
    document.addEventListener('mousemove', resetTimer);
    document.addEventListener('keypress', resetTimer);
    document.addEventListener('click', resetTimer);
    document.addEventListener('scroll', resetTimer);

    function timerIncrement() {
        idleTime += 1;
        console.log("Idle time: " + idleTime + " seconds"); // Debug log
        if (idleTime >= 60) { // 60 seconds
            window.location.href = redirectUrl;
        }
    }

    function resetTimer() {
        idleTime = 0;
        console.log("Timer reset"); // Debug log
    }
});