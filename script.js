
// ==========================================
// TASKORA - SMART TO-DO LIST
// ==========================================


// ---------- DOM ELEMENTS ----------

const authSection = document.getElementById("authSection");
const dashboardSection = document.getElementById("dashboardSection");

const loginForm = document.getElementById("loginForm");
const registerForm = document.getElementById("registerForm");

const loginTab = document.getElementById("loginTab");
const registerTab = document.getElementById("registerTab");

const authMessage = document.getElementById("authMessage");
const logoutBtn = document.getElementById("logoutBtn");

const taskForm = document.getElementById("taskForm");
const taskList = document.getElementById("taskList");

const taskTitle = document.getElementById("taskTitle");
const taskDueDate = document.getElementById("taskDueDate");
const taskReminder = document.getElementById("taskReminder");
const taskPriority = document.getElementById("taskPriority");

// New 12-hour reminder input fields
const reminderDate = document.getElementById("reminderDate");
const reminderHour = document.getElementById("reminderHour");
const reminderMinute = document.getElementById("reminderMinute");
const reminderPeriod = document.getElementById("reminderPeriod");

const editTaskId = document.getElementById("editTaskId");
const taskFormHeading = document.getElementById("taskFormHeading");
const submitTaskBtn = document.getElementById("submitTaskBtn");
const cancelEditBtn = document.getElementById("cancelEditBtn");

const filterButtons = document.querySelectorAll(".filter-btn");

const themeToggle = document.getElementById("themeToggle");
const notificationBtn = document.getElementById("notificationBtn");

const reminderList = document.getElementById("reminderList");


// ---------- APPLICATION DATA ----------

let currentUser = null;
let tasks = [];
let currentFilter = "all";

let notifiedReminders = new Set();

// Audio for the alarm
let alarmAudioContext = null;

const USERS_KEY = "taskora_users";
const SESSION_KEY = "taskora_current_user";


// ---------- STORAGE FUNCTIONS ----------

function getUsers() {
    return JSON.parse(localStorage.getItem(USERS_KEY)) || [];
}

function saveUsers(users) {
    localStorage.setItem(USERS_KEY, JSON.stringify(users));
}

function getTaskStorageKey() {
    return "taskora_tasks_" + currentUser.id;
}

function loadTasks() {
    if (!currentUser) return;

    tasks = JSON.parse(localStorage.getItem(getTaskStorageKey())) || [];
}

function saveTasks() {
    if (!currentUser) return;

    localStorage.setItem(
        getTaskStorageKey(),
        JSON.stringify(tasks)
    );
}


// ---------- REMINDER TIME FUNCTIONS ----------

// Convert 12-hour input into a 24-hour time.
// Example: 7:30 PM becomes 19:30.

function getReminderValue() {

    const date = reminderDate.value;
    const hour = Number(reminderHour.value);
    const minute = Number(reminderMinute.value);
    const period = reminderPeriod.value;

    if (!date || !reminderHour.value || !reminderMinute.value) {
        return "";
    }

    if (
        hour < 1 || hour > 12 ||
        minute < 0 || minute > 59
    ) {
        return null;
    }

    let hour24 = hour;

    if (period === "AM" && hour === 12) {
        hour24 = 0;
    }

    if (period === "PM" && hour !== 12) {
        hour24 = hour + 12;
    }

    const formattedHour = String(hour24).padStart(2, "0");
    const formattedMinute = String(minute).padStart(2, "0");

    // Store as a local date-time string.
    return `${date}T${formattedHour}:${formattedMinute}`;
}


// Convert a saved 24-hour reminder into the 12-hour input fields.
// This also supports reminders saved by the older version.

function setReminderInputs(savedReminder) {

    if (!savedReminder) {
        reminderDate.value = "";
        reminderHour.value = "";
        reminderMinute.value = "";
        reminderPeriod.value = "AM";
        taskReminder.value = "";
        return;
    }

    const date = new Date(savedReminder);

    if (isNaN(date.getTime())) {
        reminderDate.value = "";
        reminderHour.value = "";
        reminderMinute.value = "";
        reminderPeriod.value = "AM";
        taskReminder.value = "";
        return;
    }

    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");

    let hour = date.getHours();
    const minute = String(date.getMinutes()).padStart(2, "0");

    const period = hour >= 12 ? "PM" : "AM";

    hour = hour % 12;

    if (hour === 0) {
        hour = 12;
    }

    reminderDate.value = `${year}-${month}-${day}`;
    reminderHour.value = hour;
    reminderMinute.value = minute;
    reminderPeriod.value = period;

    taskReminder.value = savedReminder;
}


// Keep the hidden field updated when the user changes reminder inputs.

function updateReminderValue() {

    const reminder = getReminderValue();

    taskReminder.value = reminder || "";

}

reminderDate.addEventListener("change", updateReminderValue);
reminderHour.addEventListener("input", updateReminderValue);
reminderMinute.addEventListener("input", updateReminderValue);
reminderPeriod.addEventListener("change", updateReminderValue);


// ---------- ALARM SOUND ----------

// Prepare the browser audio after the user interacts with the page.
// Browsers may block sound until the user has interacted with the page.

function enableAlarmAudio() {

    const AudioContext =
        window.AudioContext || window.webkitAudioContext;

    if (!AudioContext) return;

    if (!alarmAudioContext) {
        alarmAudioContext = new AudioContext();
    }

    if (alarmAudioContext.state === "suspended") {
        alarmAudioContext.resume();
    }

}

document.addEventListener("click", enableAlarmAudio, { once: true });


// Play one short beep when a reminder becomes due.

function playAlarmSound() {

    if (!alarmAudioContext) return;

    if (alarmAudioContext.state !== "running") {
        return;
    }

    const oscillator = alarmAudioContext.createOscillator();
    const gain = alarmAudioContext.createGain();

    oscillator.connect(gain);
    gain.connect(alarmAudioContext.destination);

    oscillator.type = "sine";
    oscillator.frequency.setValueAtTime(
        750,
        alarmAudioContext.currentTime
    );

    gain.gain.setValueAtTime(
        0.25,
        alarmAudioContext.currentTime
    );

    gain.gain.exponentialRampToValueAtTime(
        0.001,
        alarmAudioContext.currentTime + 0.6
    );

    oscillator.start();
    oscillator.stop(alarmAudioContext.currentTime + 0.6);

}


// ---------- AUTHENTICATION ----------

function showLogin() {

    loginForm.classList.remove("hidden");
    registerForm.classList.add("hidden");

    loginTab.classList.add("active");
    registerTab.classList.remove("active");

    authMessage.textContent = "";

}

function showRegister() {

    registerForm.classList.remove("hidden");
    loginForm.classList.add("hidden");

    registerTab.classList.add("active");
    loginTab.classList.remove("active");

    authMessage.textContent = "";

}

loginTab.addEventListener("click", showLogin);
registerTab.addEventListener("click", showRegister);

document.getElementById("showRegister").addEventListener("click", showRegister);
document.getElementById("showLogin").addEventListener("click", showLogin);


// ---------- REGISTER ----------

registerForm.addEventListener("submit", function(event) {

    event.preventDefault();

    const name = document.getElementById("registerName").value.trim();

    const email = document.getElementById("registerEmail")
        .value.trim().toLowerCase();

    const password = document.getElementById("registerPassword").value;
    const confirmPassword = document.getElementById("confirmPassword").value;

    if (password.length < 6) {
        authMessage.textContent =
            "Password must contain at least 6 characters.";
        return;
    }

    if (password !== confirmPassword) {
        authMessage.textContent = "Passwords do not match.";
        return;
    }

    const users = getUsers();

    const existingUser = users.find(function(user) {
        return user.email === email;
    });

    if (existingUser) {
        authMessage.textContent = "This email is already registered.";
        return;
    }

    const newUser = {
        id: Date.now().toString(),
        name: name,
        email: email,
        password: password
    };

    users.push(newUser);
    saveUsers(users);

    registerForm.reset();

    showLogin();

    authMessage.style.color = "#35a879";
    authMessage.textContent =
        "Account created successfully! Please login.";

});


// ---------- LOGIN ----------

loginForm.addEventListener("submit", function(event) {

    event.preventDefault();

    const email = document.getElementById("loginEmail")
        .value.trim().toLowerCase();

    const password = document.getElementById("loginPassword").value;

    const users = getUsers();

    const user = users.find(function(item) {
        return item.email === email && item.password === password;
    });

    if (!user) {
        authMessage.style.color = "#e45c65";
        authMessage.textContent = "Invalid email or password.";
        return;
    }

    currentUser = user;

    localStorage.setItem(SESSION_KEY, user.id);

    loginForm.reset();

    startDashboard();

});


// ---------- START DASHBOARD ----------

function startDashboard() {

    authSection.classList.add("hidden");
    dashboardSection.classList.remove("hidden");

    document.getElementById("welcomeMessage").textContent =
        "Hello, " + currentUser.name + "!";

    document.getElementById("currentDate").textContent =
        new Date().toLocaleDateString("en-IN", {
            weekday: "long",
            day: "numeric",
            month: "long",
            year: "numeric"
        });

    loadTasks();

    renderTasks();
    updateStatistics();
    renderReminders();

    checkReminders();

}


// ---------- LOGOUT ----------

logoutBtn.addEventListener("click", function() {

    localStorage.removeItem(SESSION_KEY);

    currentUser = null;
    tasks = [];

    notifiedReminders.clear();

    dashboardSection.classList.add("hidden");
    authSection.classList.remove("hidden");

    loginForm.reset();
    registerForm.reset();

    showLogin();

});


// ---------- ADD AND UPDATE TASKS ----------

taskForm.addEventListener("submit", function(event) {

    event.preventDefault();

    if (!currentUser) return;

    const title = taskTitle.value.trim();

    if (title === "") {
        alert("Please enter a task name.");
        return;
    }

    const dueDate = taskDueDate.value;

    const reminder = getReminderValue();

    const priority = taskPriority.value;

    // Check whether the reminder inputs are valid.

    if (reminder === null) {
        alert("Please enter a valid reminder time.");
        return;
    }

    // Check that the reminder is not later than the due date.

    if (dueDate && reminder) {

        const reminderDateOnly = reminder.split("T")[0];

        if (reminderDateOnly > dueDate) {
            alert("Reminder cannot be later than the due date.");
            return;
        }

    }

    // EDIT EXISTING TASK

    if (editTaskId.value !== "") {

        const taskId = editTaskId.value;

        const task = tasks.find(function(item) {
            return item.id === taskId;
        });

        if (task) {

            const oldReminder = task.reminder;

            task.title = title;
            task.dueDate = dueDate;
            task.reminder = reminder;
            task.priority = priority;

            // Allow a changed reminder to notify again.

            if (oldReminder !== reminder) {
                const reminderKey = currentUser.id + "_" + task.id;
                notifiedReminders.delete(reminderKey);
            }

        }

        cancelEditing();

    }

    // ADD NEW TASK

    else {

        const newTask = {

            id: Date.now().toString() +
                Math.random().toString(16).slice(2),

            title: title,
            dueDate: dueDate,
            reminder: reminder,
            priority: priority,
            completed: false

        };

        tasks.push(newTask);

    }

    saveTasks();

    taskForm.reset();

    taskPriority.value = "Medium";

    taskReminder.value = "";

    renderTasks();
    updateStatistics();
    renderReminders();

});


// ---------- EDIT TASK ----------

function editTask(id) {

    const task = tasks.find(function(item) {
        return item.id === id;
    });

    if (!task) return;

    taskTitle.value = task.title;
    taskDueDate.value = task.dueDate || "";

    setReminderInputs(task.reminder || "");

    taskPriority.value = task.priority;

    editTaskId.value = task.id;

    taskFormHeading.textContent = "Edit Task";
    submitTaskBtn.textContent = "Update Task";

    cancelEditBtn.classList.remove("hidden");

    taskForm.scrollIntoView({
        behavior: "smooth",
        block: "center"
    });

}


// ---------- CANCEL EDIT ----------

function cancelEditing() {

    taskForm.reset();

    editTaskId.value = "";

    taskFormHeading.textContent = "Add a New Task";
    submitTaskBtn.textContent = "+ Add Task";

    cancelEditBtn.classList.add("hidden");

    taskPriority.value = "Medium";

    taskReminder.value = "";

}

cancelEditBtn.addEventListener("click", cancelEditing);


// ---------- DELETE TASK ----------

function deleteTask(id) {

    const confirmDelete =
        confirm("Are you sure you want to delete this task?");

    if (!confirmDelete) return;

    tasks = tasks.filter(function(task) {
        return task.id !== id;
    });

    const reminderKey = currentUser.id + "_" + id;
    notifiedReminders.delete(reminderKey);

    saveTasks();

    renderTasks();
    updateStatistics();
    renderReminders();

}


// ---------- COMPLETE TASK ----------

function toggleTask(id) {

    const task = tasks.find(function(item) {
        return item.id === id;
    });

    if (!task) return;

    task.completed = !task.completed;

    saveTasks();

    renderTasks();
    updateStatistics();
    renderReminders();

}


// ---------- EVENT DELEGATION ----------

// One click listener handles task edit and delete buttons.

taskList.addEventListener("click", function(event) {

    const button = event.target.closest("button");

    if (!button) return;

    const taskId = button.dataset.id;

    if (button.classList.contains("edit-btn")) {
        editTask(taskId);
    }

    if (button.classList.contains("delete-btn")) {
        deleteTask(taskId);
    }

});


// One change listener handles task completion checkboxes.

taskList.addEventListener("change", function(event) {

    if (event.target.classList.contains("task-checkbox")) {

        const taskId = event.target.dataset.id;

        toggleTask(taskId);

    }

});


// ---------- RENDER TASKS ----------

function renderTasks() {

    taskList.innerHTML = "";

    let filteredTasks = tasks;

    if (currentFilter === "active") {

        filteredTasks = tasks.filter(function(task) {
            return !task.completed;
        });

    }

    if (currentFilter === "completed") {

        filteredTasks = tasks.filter(function(task) {
            return task.completed;
        });

    }

    if (filteredTasks.length === 0) {

        taskList.innerHTML = `
            <p class="empty-message">
                No tasks found. Add a task to get started!
            </p>
        `;

        return;

    }

    filteredTasks.forEach(function(task) {

        const taskElement = document.createElement("div");

        taskElement.className = "task-item";

        if (task.completed) {
            taskElement.classList.add("completed");
        }

        const isOverdue =
            task.dueDate &&
            !task.completed &&
            task.dueDate < getTodayDate();

        const overdueHTML = isOverdue
            ? `<span class="overdue-label">Overdue</span>`
            : "";

        const dueDateHTML = task.dueDate
            ? `Due: ${formatDate(task.dueDate)} ${overdueHTML}`
            : "No due date";

        taskElement.innerHTML = `

            <div class="task-main">

                <input
                    type="checkbox"
                    class="task-checkbox"
                    data-id="${task.id}"
                    ${task.completed ? "checked" : ""}
                    aria-label="Mark task as completed"
                >

                <div class="task-info">

                    <h3>${escapeHTML(task.title)}</h3>

                    <p>${dueDateHTML}</p>

                    <span class="priority ${task.priority}">
                        ${escapeHTML(task.priority)} Priority
                    </span>

                </div>

            </div>

            <div class="task-actions">

                <button
                    type="button"
                    class="edit-btn"
                    data-id="${task.id}"
                >
                    Edit
                </button>

                <button
                    type="button"
                    class="delete-btn"
                    data-id="${task.id}"
                >
                    Delete
                </button>

            </div>

        `;

        taskList.appendChild(taskElement);

    });

}


// ---------- HTML SAFETY ----------

function escapeHTML(value) {

    return String(value).replace(/[&<>"']/g, function(character) {

        const characters = {
            "&": "&amp;",
            "<": "&lt;",
            ">": "&gt;",
            '"': "&quot;",
            "'": "&#39;"
        };

        return characters[character];

    });

}


// ---------- DATE FUNCTIONS ----------

function getTodayDate() {

    const today = new Date();

    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, "0");
    const day = String(today.getDate()).padStart(2, "0");

    return `${year}-${month}-${day}`;

}


function formatDate(date) {

    return new Date(date + "T00:00:00").toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric"
    });

}


// ---------- TASK STATISTICS ----------

function updateStatistics() {

    const total = tasks.length;

    const completed = tasks.filter(function(task) {
        return task.completed;
    }).length;

    const active = total - completed;

    const overdue = tasks.filter(function(task) {

        return task.dueDate &&
            !task.completed &&
            task.dueDate < getTodayDate();

    }).length;

    document.getElementById("totalTasks").textContent = total;
    document.getElementById("activeTasks").textContent = active;
    document.getElementById("completedTasks").textContent = completed;
    document.getElementById("overdueTasks").textContent = overdue;

}


// ---------- FILTER TASKS ----------

filterButtons.forEach(function(button) {

    button.addEventListener("click", function() {

        currentFilter = button.dataset.filter;

        filterButtons.forEach(function(item) {
            item.classList.remove("active");
        });

        button.classList.add("active");

        renderTasks();

    });

});


// ---------- CLEAR COMPLETED TASKS ----------

document.getElementById("clearCompleted").addEventListener("click", function() {

    const completedTasks = tasks.filter(function(task) {
        return task.completed;
    });

    if (completedTasks.length === 0) {
        alert("There are no completed tasks to clear.");
        return;
    }

    const confirmClear = confirm("Delete all completed tasks?");

    if (!confirmClear) return;

    tasks = tasks.filter(function(task) {
        return !task.completed;
    });

    saveTasks();

    renderTasks();
    updateStatistics();
    renderReminders();

});


// ---------- UPCOMING REMINDERS ----------

function renderReminders() {

    reminderList.innerHTML = "";

    const upcomingTasks = tasks

        .filter(function(task) {
            return task.reminder && !task.completed;
        })

        .sort(function(a, b) {
            return new Date(a.reminder) - new Date(b.reminder);
        });

    if (upcomingTasks.length === 0) {

        reminderList.innerHTML = `
            <p class="empty-message">
                No upcoming reminders.
            </p>
        `;

        return;

    }

    upcomingTasks.forEach(function(task) {

        const reminderElement = document.createElement("div");

        reminderElement.className = "reminder-item";

        const reminderDateTime = new Date(task.reminder);

        reminderElement.textContent =
            task.title + " — " +
            reminderDateTime.toLocaleString("en-IN", {
                day: "numeric",
                month: "short",
                year: "numeric",
                hour: "numeric",
                minute: "2-digit",
                hour12: true
            });

        reminderList.appendChild(reminderElement);

    });

}


// ---------- BROWSER NOTIFICATIONS ----------

notificationBtn.addEventListener("click", async function() {

    if (!("Notification" in window)) {

        alert("Your browser does not support notifications.");
        return;

    }

    const permission = await Notification.requestPermission();

    if (permission === "granted") {

        notificationBtn.textContent = "Notifications Enabled";

        alert("Notifications enabled successfully!");

        enableAlarmAudio();

        checkReminders();

    } else {

        alert("Notification permission was not granted.");

    }

});


// ---------- CHECK REMINDERS ----------

function checkReminders() {

    if (!currentUser) return;

    const now = new Date();

    tasks.forEach(function(task) {

        if (!task.reminder || task.completed) return;

        const reminderTime = new Date(task.reminder);

        const reminderKey = currentUser.id + "_" + task.id;

        if (
            reminderTime <= now &&
            !notifiedReminders.has(reminderKey)
        ) {

            // Mark this reminder as notified so it does not
            // repeatedly play during this page session.

            notifiedReminders.add(reminderKey);

            // Play one short beep.

            playAlarmSound();

            // Show browser notification if permission is granted.

            if (
                "Notification" in window &&
                Notification.permission === "granted"
            ) {

                new Notification("Taskora Reminder", {
                    body: "Reminder: " + task.title
                });

            } else {

                alert("Reminder: " + task.title);

            }

        }

    });

}


// Check reminders periodically while the page is open.

setInterval(function() {

    if (currentUser) {
        checkReminders();
    }

}, 30000);


// ---------- DARK AND LIGHT MODE ----------

themeToggle.addEventListener("click", function() {

    document.body.classList.toggle("dark-mode");

    const isDark = document.body.classList.contains("dark-mode");

    localStorage.setItem("taskora_theme", isDark ? "dark" : "light");

    themeToggle.textContent = isDark ? "☀️" : "🌙";

});


function loadTheme() {

    const savedTheme = localStorage.getItem("taskora_theme");

    if (savedTheme === "dark") {

        document.body.classList.add("dark-mode");
        themeToggle.textContent = "☀️";

    } else {

        document.body.classList.remove("dark-mode");
        themeToggle.textContent = "🌙";

    }

}


// ---------- RESTORE SESSION ----------

function restoreSession() {

    loadTheme();

    const savedUserId = localStorage.getItem(SESSION_KEY);

    if (!savedUserId) {
        showLogin();
        return;
    }

    const users = getUsers();

    const savedUser = users.find(function(user) {
        return user.id === savedUserId;
    });

    if (savedUser) {

        currentUser = savedUser;

        startDashboard();

    } else {

        localStorage.removeItem(SESSION_KEY);

        showLogin();

    }

}


// ---------- START APPLICATION ----------

restoreSession();
