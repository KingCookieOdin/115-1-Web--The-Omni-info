
/* =====================================
   THE OMNI-INFO
   MAIN APPLICATION
===================================== */


/* =====================================
   1. DATA STORAGE
===================================== */

function loadData(key, fallback) {

    try {
        const saved = localStorage.getItem(key);

        return saved ? JSON.parse(saved) : fallback;

    } catch (error) {

        console.error("Could not load:", key, error);

        return fallback;

    }

}


function saveData(key, data) {

    localStorage.setItem(
        key,
        JSON.stringify(data)
    );

}


/* =====================================
   2. INITIAL DATA
===================================== */

let notifications = loadData("omniNotifications", [

    {
        id: "n1",
        source: "Discord",
        title: "New message in Tech Community",
        content: "You received a new message.",
        time: "2 minutes ago",
        read: false
    },

    {
        id: "n2",
        source: "Steam",
        title: "Gaming activity updated",
        content: "Your gaming statistics have changed.",
        time: "5 minutes ago",
        read: false
    },

    {
        id: "n3",
        source: "Gmail",
        title: "New email received",
        content: "You have a new email.",
        time: "8 minutes ago",
        read: true
    },

    {
        id: "n4",
        source: "YouTube",
        title: "New video uploaded",
        content: "A channel you follow uploaded a video.",
        time: "12 minutes ago",
        read: false
    }

]);


let archive = loadData("omniArchive", []);

let events = loadData("omniEvents", []);

let activity = loadData("omniActivity", []);


/* =====================================
   3. GENERAL HELPERS
===================================== */

function createId() {

    if (crypto.randomUUID) {
        return crypto.randomUUID();
    }

    return Date.now().toString() +
        Math.random().toString(36).slice(2);

}


function escapeHTML(value) {

    return String(value ?? "").replace(
        /[&<>"']/g,
        char => ({
            "&": "&amp;",
            "<": "&lt;",
            ">": "&gt;",
            '"': "&quot;",
            "'": "&#39;"
        })[char]
    );

}


function addActivity(message) {

    activity.unshift({

        id: createId(),

        message: message,

        time: new Date().toLocaleString()

    });

    activity = activity.slice(0, 20);

    saveData("omniActivity", activity);

    renderActivity();

}


/* =====================================
   4. NAVIGATION
===================================== */

const navigationButtons =
    document.querySelectorAll(".nav-btn");


function openPage(pageName) {

    const target = document.getElementById(pageName);

    if (!target) return;

    document.querySelectorAll(".page").forEach(page => {

        page.classList.remove("active");

    });

    target.classList.add("active");


    navigationButtons.forEach(button => {

        button.classList.toggle(
            "active",
            button.dataset.page === pageName
        );

    });


    if (pageName === "calendar") {

        renderCalendar();

        renderEvents();

    }

    if (pageName === "statistics") {

        renderStatistics();

    }

    if (pageName === "dashboard") {

        renderDashboard();

    }

}


navigationButtons.forEach(button => {

    button.addEventListener("click", () => {

        openPage(button.dataset.page);

    });

});


document.querySelectorAll("[data-open]").forEach(button => {

    button.addEventListener("click", () => {

        openPage(button.dataset.open);

    });

});


document.getElementById("notificationShortcut")
    .addEventListener("click", () => {

        openPage("notifications");

    });


/* =====================================
   5. NOTIFICATIONS
===================================== */

function renderNotifications() {

    const dashboardList =
        document.getElementById("dashboardNotifications");

    const allList =
        document.getElementById("allNotifications");


    const unreadCount = notifications.filter(
        item => !item.read
    ).length;


    document.getElementById("notificationCount")
        .textContent = unreadCount;

    document.getElementById("navNotificationCount")
        .textContent = unreadCount;

    document.getElementById("topNotificationCount")
        .textContent = unreadCount;


    document.getElementById("totalNotifications")
        .textContent = notifications.length;

    document.getElementById("totalUnread")
        .textContent = unreadCount;


    const notificationHTML = notifications.map(item => `

        <div class="notification ${item.read ? "" : "unread"}">

            <h3>${escapeHTML(item.title)}</h3>

            <p>${escapeHTML(item.content)}</p>

            <small>
                ${escapeHTML(item.source)} ·
                ${escapeHTML(item.time)}
            </small>

            ${item.read ? "" : `

                <button data-read="${escapeHTML(item.id)}">
                    Mark as read
                </button>

            `}

        </div>

    `).join("");


    const emptyMessage = `
        <p class="empty-message">
            No notifications available.
        </p>
    `;


    dashboardList.innerHTML =
        notifications.length
            ? notificationHTML.slice(0, 12000)
            : emptyMessage;

    allList.innerHTML =
        notifications.length
            ? notificationHTML
            : emptyMessage;


    document.querySelectorAll("[data-read]").forEach(button => {

        button.addEventListener("click", () => {

            markAsRead(button.dataset.read);

        });

    });

}


function markAsRead(id) {

    notifications = notifications.map(item => {

        if (item.id === id) {

            return {
                ...item,
                read: true
            };

        }

        return item;

    });

    saveData("omniNotifications", notifications);

    renderNotifications();

}


document.getElementById("markAllRead")
    .addEventListener("click", () => {

        notifications = notifications.map(item => ({
            ...item,
            read: true
        }));

        saveData("omniNotifications", notifications);

        renderNotifications();

    });


/* =====================================
   6. INFORMATION ARCHIVE
===================================== */

const noteForm = document.getElementById("noteForm");


document.getElementById("showNoteForm")
    .addEventListener("click", () => {

        noteForm.classList.remove("hidden");

    });


document.getElementById("cancelNote")
    .addEventListener("click", () => {

        noteForm.classList.add("hidden");

    });


document.getElementById("saveNote")
    .addEventListener("click", () => {

        const title =
            document.getElementById("noteTitle").value.trim();

        const category =
            document.getElementById("noteCategory").value;

        const content =
            document.getElementById("noteContent").value.trim();


        if (!title || !content) {

            alert("Please enter a title and some information.");

            return;

        }


        archive.unshift({

            id: createId(),

            title: title,

            category: category,

            content: content,

            date: new Date().toLocaleString()

        });


        saveData("omniArchive", archive);

        addActivity("Saved information: " + title);


        document.getElementById("noteTitle").value = "";

        document.getElementById("noteContent").value = "";

        noteForm.classList.add("hidden");


        renderArchive();

        renderDashboard();

    });


function renderArchive() {

    const archiveList =
        document.getElementById("archiveList");


    document.getElementById("archiveCount")
        .textContent = archive.length;

    document.getElementById("totalArchive")
        .textContent = archive.length;


    if (archive.length === 0) {

        archiveList.innerHTML = `
            <p class="empty-message">
                Your archive is empty. Add some information!
            </p>
        `;

        return;

    }


    archiveList.innerHTML = archive.map(item => `

        <div class="archive-item">

            <h3>${escapeHTML(item.title)}</h3>

            <span class="event-category">
                ${escapeHTML(item.category)}
            </span>

            <p>${escapeHTML(item.content)}</p>

            <small>${escapeHTML(item.date)}</small>

            <button data-delete-note="${escapeHTML(item.id)}">
                Delete
            </button>

        </div>

    `).join("");


    document.querySelectorAll("[data-delete-note]")
        .forEach(button => {

            button.addEventListener("click", () => {

                deleteNote(button.dataset.deleteNote);

            });

        });

}


function deleteNote(id) {

    archive = archive.filter(item => item.id !== id);

    saveData("omniArchive", archive);

    addActivity("Deleted saved information");

    renderArchive();

    renderDashboard();

}


/* =====================================
   7. CALENDAR
===================================== */

let currentDate = new Date();

let selectedDate = getDateKey(new Date());


function getDateKey(date) {

    const year = date.getFullYear();

    const month = String(
        date.getMonth() + 1
    ).padStart(2, "0");

    const day = String(
        date.getDate()
    ).padStart(2, "0");

    return `${year}-${month}-${day}`;

}


function saveEvents() {

    saveData("omniEvents", events);

    document.getElementById("totalEvents")
        .textContent = events.length;

}


/* =====================================
   8. CALENDAR DISPLAY
===================================== */

function renderCalendar() {

    const year = currentDate.getFullYear();

    const month = currentDate.getMonth();

    const firstDay = new Date(year, month, 1);

    const startDay = firstDay.getDay();


    document.getElementById("calendarMonth")
        .textContent = currentDate.toLocaleDateString(
            "en-US",
            {
                month: "long",
                year: "numeric"
            }
        );


    const grid =
        document.getElementById("calendarGrid");

    grid.innerHTML = "";


    // WEEKDAY HEADERS

    const weekdays = [
        "Sun", "Mon", "Tue",
        "Wed", "Thu", "Fri", "Sat"
    ];


    weekdays.forEach(day => {

        const header = document.createElement("div");

        header.className = "calendar-weekday";

        header.textContent = day;

        grid.appendChild(header);

    });


    // CALENDAR DAYS

    for (let i = 0; i < 42; i++) {

        const dayNumber = i - startDay + 1;

        const date = new Date(year, month, dayNumber);

        const dateKey = getDateKey(date);


        const dayEvents = events.filter(
            event => event.date === dateKey
        );


        const button = document.createElement("button");

        button.type = "button";

        button.className = "calendar-day";


        if (date.getMonth() !== month) {

            button.classList.add("other-month");

        }

        if (dateKey === selectedDate) {

            button.classList.add("selected");

        }

        if (dateKey === getDateKey(new Date())) {

            button.classList.add("today");

        }


        const number = document.createElement("span");

        number.className = "day-number";

        number.textContent = date.getDate();

        button.appendChild(number);


        const dots = document.createElement("div");

        dots.className = "day-events";


        dayEvents.slice(0, 5).forEach(() => {

            const dot = document.createElement("span");

            dot.className = "event-dot";

            dots.appendChild(dot);

        });


        button.appendChild(dots);


        button.addEventListener("click", () => {

            selectedDate = dateKey;

            currentDate = new Date(
                date.getFullYear(),
                date.getMonth(),
                1
            );

            renderCalendar();

            renderEvents();

        });


        grid.appendChild(button);

    }

}


/* =====================================
   9. DISPLAY SELECTED DATE EVENTS
===================================== */

function renderEvents() {

    const eventList =
        document.getElementById("eventList");

    const dateTitle =
        document.getElementById("selectedDateTitle");

    const count =
        document.getElementById("selectedEventCount");


    const date = new Date(
        selectedDate + "T12:00:00"
    );


    dateTitle.textContent =
        date.toLocaleDateString("en-US", {

            weekday: "long",

            month: "long",

            day: "numeric",

            year: "numeric"

        });


    const selectedEvents = events

        .filter(event => event.date === selectedDate)

        .sort((a, b) =>
            (a.time || "").localeCompare(b.time || "")
        );


    count.textContent =
        selectedEvents.length + " events";


    eventList.innerHTML = "";


    if (selectedEvents.length === 0) {

        eventList.innerHTML = `
            <p class="empty-message">
                No events scheduled for this date.
            </p>
        `;

        return;

    }


    selectedEvents.forEach(event => {

        const item = document.createElement("div");

        item.className = "event-item";


        const title = document.createElement("h3");

        title.textContent = event.title;


        const time = document.createElement("p");

        time.textContent =
            "Time: " + (event.time || "Not specified");


        const category = document.createElement("span");

        category.className = "event-category";

        category.textContent = event.category;


        const description = document.createElement("p");

        description.textContent =
            event.description || "No description";


        const deleteButton = document.createElement("button");

        deleteButton.textContent = "Delete Event";


        deleteButton.addEventListener("click", () => {

            deleteEvent(event.id);

        });


        item.appendChild(title);

        item.appendChild(time);

        item.appendChild(category);

        item.appendChild(description);

        item.appendChild(deleteButton);


        eventList.appendChild(item);

    });

}


/* =====================================
   10. CALENDAR NAVIGATION
===================================== */

document.getElementById("previousMonth")
    .addEventListener("click", () => {

        currentDate.setMonth(
            currentDate.getMonth() - 1
        );

        renderCalendar();

    });


document.getElementById("nextMonth")
    .addEventListener("click", () => {

        currentDate.setMonth(
            currentDate.getMonth() + 1
        );

        renderCalendar();

    });


document.getElementById("todayButton")
    .addEventListener("click", () => {

        currentDate = new Date();

        selectedDate = getDateKey(new Date());

        renderCalendar();

        renderEvents();

    });


/* =====================================
   11. ADD CALENDAR EVENT
===================================== */

const eventForm =
    document.getElementById("eventForm");


document.getElementById("addEventButton")
    .addEventListener("click", () => {

        eventForm.classList.remove("hidden");

        document.getElementById("eventDate").value =
            selectedDate;

        document.getElementById("eventTitle").focus();

    });


document.getElementById("cancelEvent")
    .addEventListener("click", () => {

        eventForm.classList.add("hidden");

    });


document.getElementById("saveEvent")
    .addEventListener("click", () => {

        const title =
            document.getElementById("eventTitle").value.trim();

        const date =
            document.getElementById("eventDate").value;

        const time =
            document.getElementById("eventTime").value;

        const category =
            document.getElementById("eventCategory").value;

        const description =
            document.getElementById("eventDescription").value.trim();


        if (!title || !date) {

            alert("Please enter an event title and date.");

            return;

        }


        events.push({

            id: createId(),

            title: title,

            date: date,

            time: time,

            category: category,

            description: description

        });


        saveEvents();

        addActivity("Created event: " + title);


        selectedDate = date;

        const [year, month] = date.split("-").map(Number);

        currentDate = new Date(year, month - 1, 1);


        document.getElementById("eventTitle").value = "";

        document.getElementById("eventDate").value = "";

        document.getElementById("eventTime").value = "";

        document.getElementById("eventDescription").value = "";


        eventForm.classList.add("hidden");


        renderCalendar();

        renderEvents();

        renderDashboard();

    });


/* =====================================
   12. DELETE CALENDAR EVENT
===================================== */

function deleteEvent(id) {

    events = events.filter(event => event.id !== id);

    saveEvents();

    addActivity("Deleted a calendar event");

    renderCalendar();

    renderEvents();

    renderDashboard();

}


/* =====================================
   13. UPCOMING EVENTS
===================================== */

function renderUpcomingEvents() {

    const container =
        document.getElementById("dashboardEvents");


    const today = getDateKey(new Date());


    const upcoming = events

        .filter(event => event.date >= today)

        .sort((a, b) => {

            const dateCompare =
                a.date.localeCompare(b.date);

            if (dateCompare !== 0) {
                return dateCompare;
            }

            return (a.time || "").localeCompare(b.time || "");

        })

        .slice(0, 5);


    container.innerHTML = "";


    if (upcoming.length === 0) {

        container.innerHTML = `
            <p class="empty-message">
                No upcoming events. Add something to your calendar!
            </p>
        `;

        return;

    }


    upcoming.forEach(event => {

        const item = document.createElement("div");

        item.className = "upcoming-item";


        const title = document.createElement("strong");

        title.textContent = event.title;


        const details = document.createElement("p");

        details.textContent =
            `${event.date} · ${event.time || "No time"} · ${event.category}`;


        item.appendChild(title);

        item.appendChild(details);


        container.appendChild(item);

    });

}


/* =====================================
   14. RECENT ACTIVITY
===================================== */

function renderActivity() {

    const container =
        document.getElementById("dashboardActivity");


    container.innerHTML = "";


    if (activity.length === 0) {

        container.innerHTML = `
            <p class="empty-message">
                No recent activity yet.
            </p>
        `;

        return;

    }


    activity.slice(0, 5).forEach(item => {

        const element = document.createElement("div");

        element.className = "activity-item";


        const message = document.createElement("strong");

        message.textContent = item.message;


        const time = document.createElement("p");

        time.textContent = item.time;


        element.appendChild(message);

        element.appendChild(time);


        container.appendChild(element);

    });

}


/* =====================================
   15. DASHBOARD
===================================== */

function renderDashboard() {

    renderNotifications();

    renderArchive();

    renderUpcomingEvents();

    renderActivity();

    renderStatistics();

}


/* =====================================
   16. STATISTICS
===================================== */

function renderStatistics() {

    document.getElementById("totalNotifications")
        .textContent = notifications.length;

    document.getElementById("totalArchive")
        .textContent = archive.length;

    document.getElementById("totalEvents")
        .textContent = events.length;

    document.getElementById("totalUnread")
        .textContent = notifications.filter(
            item => !item.read
        ).length;

}


/* =====================================
   17. UNIVERSAL SEARCH
===================================== */

const searchInput =
    document.getElementById("searchInput");


searchInput.addEventListener("keydown", event => {

    if (event.key !== "Enter") return;

    const query = searchInput.value.trim().toLowerCase();

    if (!query) return;


    const results = [];


    notifications.forEach(item => {

        if (
            item.title.toLowerCase().includes(query) ||
            item.content.toLowerCase().includes(query) ||
            item.source.toLowerCase().includes(query)
        ) {

            results.push({
                type: "Notification",
                title: item.title,
                detail: item.source,
                page: "notifications"
            });

        }

    });


    archive.forEach(item => {

        if (
            item.title.toLowerCase().includes(query) ||
            item.content.toLowerCase().includes(query) ||
            item.category.toLowerCase().includes(query)
        ) {

            results.push({
                type: "Archive",
                title: item.title,
                detail: item.category,
                page: "archive"
            });

        }

    });


    events.forEach(item => {

        if (
            item.title.toLowerCase().includes(query) ||
            item.description.toLowerCase().includes(query) ||
            item.category.toLowerCase().includes(query)
        ) {

            results.push({
                type: "Calendar Event",
                title: item.title,
                detail: item.date,
                page: "calendar",
                date: item.date
            });

        }

    });


    if (results.length === 0) {

        alert("No matching information found.");

        return;

    }


    const message = results.map((item, index) => {

        return `${index + 1}. ${item.type}: ${item.title} (${item.detail})`;

    }).join("\n");


    alert("Search Results:\n\n" + message);


    if (results.length === 1) {

        if (results[0].date) {

            selectedDate = results[0].date;

            const [year, month] =
                selectedDate.split("-").map(Number);

            currentDate = new Date(year, month - 1, 1);

        }

        openPage(results[0].page);

    }

});


/* =====================================
   18. DARK / LIGHT MODE
===================================== */

document.getElementById("themeToggle")
    .addEventListener("click", () => {

        document.body.classList.toggle("light");

        const theme = document.body.classList.contains("light")
            ? "light"
            : "dark";

        localStorage.setItem("omniTheme", theme);

    });


const savedTheme = localStorage.getItem("omniTheme");

if (savedTheme === "light") {

    document.body.classList.add("light");

}


/* =====================================
   19. CLOCK AND DATE
===================================== */

function updateClock() {

    const now = new Date();


    document.getElementById("currentDate")
        .textContent = now.toLocaleDateString("en-US", {

            weekday: "short",

            month: "short",

            day: "numeric",

            year: "numeric"

        });


    document.getElementById("currentTime")
        .textContent = now.toLocaleTimeString("en-US", {

            hour: "2-digit",

            minute: "2-digit",

            hour12: false

        });

}


updateClock();

setInterval(updateClock, 1000);


/* =====================================
   20. EXPORT DATA
===================================== */

document.getElementById("exportData")
    .addEventListener("click", () => {

        const data = {

            notifications: notifications,

            archive: archive,

            events: events,

            activity: activity,

            exportedAt: new Date().toISOString()

        };


        const blob = new Blob(
            [JSON.stringify(data, null, 4)],
            { type: "application/json" }
        );


        const url = URL.createObjectURL(blob);

        const link = document.createElement("a");

        link.href = url;

        link.download = "omni-info-backup.json";

        link.click();

        URL.revokeObjectURL(url);

    });


/* =====================================
   21. INITIALIZE APPLICATION
===================================== */

function initializeApp() {

    renderNotifications();

    renderArchive();

    renderCalendar();

    renderEvents();

    renderUpcomingEvents();

    renderActivity();

    renderStatistics();

    console.log("The Omni-info initialized successfully.");

}


initializeApp();
