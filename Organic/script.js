function updateClock() {
    const now = new Date();

    // Get the current time
    const time = now.toLocaleTimeString();

    // Get the current date
    const date = now.toLocaleDateString();

    // Display them in HTML
    document.getElementById("clock").textContent = time;
    document.getElementById("date").textContent = date;
}

// Update the clock every second
setInterval(updateClock, 1000);

// Display the clock immediately
updateClock();