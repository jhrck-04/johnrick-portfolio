// events_display.js - Enhanced with filtering, archiving, and ATTENDANCE INDICATORS
// This file handles loading real event data from the calendar_events table

// Store events data
let eventsData = [];
let currentFilter = "today"; // Default to 'today' instead of 'all'
let userAttendedEvents = []; // Store which events the current user attended

// Function to fetch which events the current user has attended
async function fetchUserAttendance() {
  try {
    const response = await fetch("./check_user_attendance.php");

    if (!response.ok) {
      console.error("Failed to fetch user attendance");
      return;
    }

    const data = await response.json();

    if (data.success) {
      userAttendedEvents = data.attended_events || [];
      console.log("User attended events:", userAttendedEvents);
    } else {
      console.error("Error fetching user attendance:", data.message);
    }
  } catch (error) {
    console.error("Error fetching user attendance:", error);
  }
}

// Function to fetch events from database
async function fetchEventsFromDatabase() {
  try {
    const response = await fetch("./fetch_events.php");

    if (!response.ok) {
      throw new Error("Failed to fetch events");
    }

    const data = await response.json();

    if (data.success) {
      // Store the events data
      eventsData = data.events;

      // Update dashboard event count
      updateEventCount();

      // Render events if we're on the events tab
      const eventsTab = document.getElementById("events-tab");
      if (eventsTab && !eventsTab.classList.contains("hidden")) {
        displayEvents();
      }
    } else {
      console.error("Error fetching events:", data.message);
      showEventsError("Failed to load events: " + data.message);
    }
  } catch (error) {
    console.error("Error:", error);
    showEventsError("Failed to load events. Please try again later.");
  }
}

// Function to categorize events
function categorizeEvents() {
  const today = new Date();
  const todayStr = `${today.getFullYear()}-${String(
    today.getMonth() + 1,
  ).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;

  const todayEvents = [];
  const upcomingEvents = [];
  const finishedEvents = [];

  eventsData.forEach((event) => {
    // ✅ NEW: Check is_finished flag FIRST
    if (event.is_finished == 1) {
      finishedEvents.push(event);
    } else if (event.event_date === todayStr) {
      todayEvents.push(event);
    } else if (event.event_date > todayStr) {
      upcomingEvents.push(event);
    } else {
      // Event is in the past but not marked finished
      finishedEvents.push(event);
    }
  });

  // Sort each category
  todayEvents.sort(
    (a, b) =>
      new Date(a.event_date + " " + a.event_time) -
      new Date(b.event_date + " " + b.event_time),
  );
  upcomingEvents.sort(
    (a, b) =>
      new Date(a.event_date + " " + a.event_time) -
      new Date(b.event_date + " " + b.event_time),
  );
  finishedEvents.sort(
    (a, b) =>
      new Date(b.event_date + " " + b.event_time) -
      new Date(a.event_date + " " + a.event_time),
  );

  return { todayEvents, upcomingEvents, finishedEvents };
}

// Function to set filter
function setEventFilter(filter) {
  currentFilter = filter;
  displayEvents();
}

// Function to toggle archive view
function toggleArchive() {
  const archiveSection = document.getElementById("archive-section");
  const toggleBtn = document.getElementById("toggle-archive-btn");

  if (archiveSection.classList.contains("hidden")) {
    archiveSection.classList.remove("hidden");
    toggleBtn.innerHTML = '<i class="fas fa-eye-slash mr-2"></i>Hide Archive';
  } else {
    archiveSection.classList.add("hidden");
    toggleBtn.innerHTML = '<i class="fas fa-archive mr-2"></i>View Archive';
  }
}

// ✅ NEW: Check if user attended this event
function userAttendedThisEvent(eventId) {
  return userAttendedEvents.includes(parseInt(eventId));
}

// Function to display events in the grid with filters
function displayEvents() {
  const eventsGrid = document.getElementById("events-grid");

  if (!eventsGrid) return;

  if (eventsData.length === 0) {
    eventsGrid.innerHTML = `
      <div class="col-span-full text-center py-12">
        <i class="fas fa-calendar-times text-6xl text-gray-300 mb-4"></i>
        <p class="text-gray-500 text-lg">No events scheduled at this time</p>
      </div>
    `;
    return;
  }

  const { todayEvents, upcomingEvents, finishedEvents } = categorizeEvents();

  // Split finished events into recent (10 latest) and archived
  const recentFinished = finishedEvents.slice(0, 10);
  const archivedEvents = finishedEvents.slice(10);

  let html = "";

  // Add Filter Dropdown and Archive Button
  html += `
    <div class="col-span-full mb-6">
      <div class="bg-white rounded-lg shadow-md p-4">
        <div class="flex flex-wrap gap-4 items-center justify-between">
          <!-- Filter Dropdown -->
          <div class="flex items-center gap-3">
            <label for="event-filter" class="text-gray-700 font-semibold">
              <i class="fas fa-filter mr-2"></i>Filter Events:
            </label>
            <select 
              id="event-filter" 
              onchange="setEventFilter(this.value)" 
              class="px-4 py-2 border-2 border-gray-300 rounded-lg font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 cursor-pointer"
            >
              <option value="all" ${currentFilter === "all" ? "selected" : ""}>🌐 View All Events</option>
              <option value="today" ${currentFilter === "today" ? "selected" : ""}>📅 Today's Events</option>
              <option value="upcoming" ${currentFilter === "upcoming" ? "selected" : ""}>📜 Upcoming Events</option>
              <option value="finished" ${currentFilter === "finished" ? "selected" : ""}>✅ Finished Events</option>
            </select>
          </div>
          
          <!-- Archive Button -->
          ${
            archivedEvents.length > 0
              ? `
            <button 
              id="toggle-archive-btn" 
              onclick="toggleArchive()" 
              class="px-4 py-2 bg-gray-600 text-white rounded-lg font-semibold hover:bg-gray-700 transition flex items-center gap-2"
            >
              <i class="fas fa-archive"></i>
              <span>View Archive (${archivedEvents.length})</span>
            </button>
          `
              : ""
          }
        </div>
      </div>
    </div>
  `;

  // TODAY EVENTS (Orange)
  if (
    (currentFilter === "today" || currentFilter === "all") &&
    todayEvents.length > 0
  ) {
    html += `
      <div class="col-span-full">
        <h3 class="text-2xl font-bold text-orange-600 mb-4 flex items-center">
          <i class="fas fa-calendar-day mr-3"></i>
          Today's Events
        </h3>
      </div>
    `;
    todayEvents.forEach((event) => {
      html += createEventCard(event, "today");
    });
  }

  // UPCOMING EVENTS (Blue)
  if (
    (currentFilter === "upcoming" || currentFilter === "all") &&
    upcomingEvents.length > 0
  ) {
    html += `
      <div class="col-span-full mt-6">
        <h3 class="text-2xl font-bold text-blue-600 mb-4 flex items-center">
          <i class="fas fa-calendar-alt mr-3"></i>
          Upcoming Events
        </h3>
      </div>
    `;
    upcomingEvents.forEach((event) => {
      html += createEventCard(event, "upcoming");
    });
  }

  // RECENT FINISHED EVENTS (Green) - Only show 10 latest
  if (
    (currentFilter === "finished" || currentFilter === "all") &&
    recentFinished.length > 0
  ) {
    html += `
      <div class="col-span-full mt-6">
        <h3 class="text-2xl font-bold text-green-600 mb-4 flex items-center">
          <i class="fas fa-check-circle mr-3"></i>
          Recent Finished Events (Last 10)
        </h3>
      </div>
    `;
    recentFinished.forEach((event) => {
      html += createEventCard(event, "finished");
    });
  }

  // ARCHIVED EVENTS (Gray) - Hidden by default
  if (archivedEvents.length > 0) {
    html += `
      <div id="archive-section" class="col-span-full mt-8 hidden">
        <div class="border-t-4 border-gray-400 pt-6">
          <h3 class="text-2xl font-bold text-gray-600 mb-4 flex items-center">
            <i class="fas fa-archive mr-3"></i>
            Archived Events (${archivedEvents.length} older events)
          </h3>
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
    `;
    archivedEvents.forEach((event) => {
      html += createEventCard(event, "archived");
    });
    html += `
          </div>
        </div>
      </div>
    `;
  }

  // No events message for filtered view
  if (
    (currentFilter === "today" && todayEvents.length === 0) ||
    (currentFilter === "upcoming" && upcomingEvents.length === 0) ||
    (currentFilter === "finished" && recentFinished.length === 0)
  ) {
    html += `
      <div class="col-span-full text-center py-12">
        <i class="fas fa-calendar-times text-6xl text-gray-300 mb-4"></i>
        <p class="text-gray-500 text-lg">No ${currentFilter} events found</p>
      </div>
    `;
  }

  eventsGrid.innerHTML = html;
}

// ✅ UPDATED: Create event card with attendance indicator
function createEventCard(event, category) {
  // Determine if user attended this event
  const attended = userAttendedThisEvent(event.id);

  let borderColor, badgeColor, iconClass, badgeText;

  if (category === "today") {
    borderColor = "border-l-4 border-orange-500";
    badgeColor = "bg-orange-100 text-orange-800";
    iconClass = "fa-calendar-day";
    badgeText = "Today";
  } else if (category === "upcoming") {
    borderColor = "border-l-4 border-blue-500";
    badgeColor = "bg-blue-100 text-blue-800";
    iconClass = "fa-calendar-alt";
    badgeText = "Upcoming";
  } else if (category === "archived") {
    borderColor = "border-l-4 border-gray-500";
    badgeColor = "bg-gray-100 text-gray-800";
    iconClass = "fa-archive";
    badgeText = "Archived";
  } else {
    borderColor = "border-l-4 border-green-500";
    badgeColor = "bg-green-100 text-green-800";
    iconClass = "fa-check-circle";
    badgeText = "Finished";
  }

  return `
    <div class="bg-white rounded-xl shadow-lg ${borderColor} hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1 relative overflow-hidden">
      ${
        attended
          ? `
        <!-- ✅ ATTENDANCE BADGE - Top Right Corner -->
        <div class="absolute top-3 right-3 z-10">
          <div class="bg-gradient-to-r from-yellow-400 to-yellow-500 text-white px-3 py-1.5 rounded-full shadow-lg flex items-center gap-2 animate-pulse-slow">
            <i class="fas fa-star text-white"></i>
            <span class="text-xs font-bold">You Attended</span>
          </div>
        </div>
      `
          : ""
      }
      <div class="bg-gradient-to-r ${
        category === "today"
          ? "from-orange-500 to-orange-600"
          : category === "upcoming"
            ? "from-blue-500 to-blue-600"
            : category === "archived"
              ? "from-gray-500 to-gray-600"
              : "from-green-500 to-green-600"
      } text-white p-5">
        <h3 class="text-xl font-bold mb-2">${escapeHtml(event.event_title)}</h3>
        <div class="flex items-center justify-between">
          <span class="bg-white bg-opacity-20 px-3 py-1 rounded-full text-sm font-semibold">
            ${escapeHtml(event.event_type)}
          </span>
          <span class="bg-white bg-opacity-30 px-3 py-1 rounded-full text-sm font-bold flex items-center">
            <i class="fas ${iconClass} mr-1"></i>${badgeText}
          </span>
        </div>
      </div>
      <div class="p-6 space-y-3">
        <p class="flex items-center">
          <i class="fas fa-calendar ${
            category === "today"
              ? "text-orange-600"
              : category === "upcoming"
                ? "text-blue-600"
                : category === "archived"
                  ? "text-gray-600"
                  : "text-green-600"
          } mr-3"></i>
          <span>${formatDate(event.event_date)}</span>
        </p>
        <p class="flex items-center">
          <i class="fas fa-clock ${
            category === "today"
              ? "text-orange-600"
              : category === "upcoming"
                ? "text-blue-600"
                : category === "archived"
                  ? "text-gray-600"
                  : "text-green-600"
          } mr-3"></i>
          <span>${formatTime(event.event_time)}</span>
        </p>
        <p class="flex items-center">
          <i class="fas fa-map-marker-alt ${
            category === "today"
              ? "text-orange-600"
              : category === "upcoming"
                ? "text-blue-600"
                : category === "archived"
                  ? "text-gray-600"
                  : "text-green-600"
          } mr-3"></i>
          <span>${escapeHtml(event.location)}</span>
        </p>
        <div class="pt-3 border-t space-y-2">
          <p>
            <span class="${badgeColor} px-3 py-1 rounded-full text-sm font-bold">
              <i class="fas fa-users mr-1"></i>${event.attendees || 0} attending
            </span>
          </p>
          <p class="text-sm text-gray-600 flex items-center">
            <i class="fas fa-user-circle mr-2 ${category === "today" ? "text-orange-600" : category === "upcoming" ? "text-blue-600" : category === "archived" ? "text-gray-600" : "text-green-600"}"></i>
            <span>Set by: <strong>${escapeHtml(event.creator_name || event.created_by || "Unknown")}</strong></span>
          </p>
        </div>
      </div>
    </div>
  `;
}

// Function to update event count in dashboard (only upcoming events)
function updateEventCount() {
  const eventCountElement = document.getElementById("total-events-dash");
  if (eventCountElement) {
    const today = new Date();
    const todayStr = `${today.getFullYear()}-${String(
      today.getMonth() + 1,
    ).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;

    // Count only today and upcoming events
    const upcomingCount = eventsData.filter(
      (event) => event.event_date >= todayStr,
    ).length;
    eventCountElement.textContent = upcomingCount;
  }
}

// Function to show error message
function showEventsError(message) {
  const eventsGrid = document.getElementById("events-grid");
  if (eventsGrid) {
    eventsGrid.innerHTML = `
      <div class="col-span-full text-center py-12">
        <i class="fas fa-exclamation-triangle text-6xl text-red-300 mb-4"></i>
        <p class="text-red-500 text-lg">${escapeHtml(message)}</p>
        <button onclick="fetchEventsWithIndicator()" class="mt-4 bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition">
          <i class="fas fa-sync mr-2"></i>Retry
        </button>
      </div>
    `;
  }
}

// Helper function to escape HTML and prevent XSS
function escapeHtml(text) {
  if (!text) return "";
  const div = document.createElement("div");
  div.textContent = text;
  return div.innerHTML;
}

// Helper function to format date nicely
function formatDate(dateString) {
  if (!dateString) return "Date TBD";
  const date = new Date(dateString + "T00:00:00");
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

// Helper function to format time nicely
function formatTime(timeString) {
  if (!timeString) return "Time TBD";

  // Handle both HH:MM:SS and HH:MM formats
  const timeParts = timeString.split(":");
  let hours = parseInt(timeParts[0]);
  const minutes = timeParts[1];

  const ampm = hours >= 12 ? "PM" : "AM";
  hours = hours % 12;
  hours = hours ? hours : 12; // the hour '0' should be '12'

  return `${hours}:${minutes} ${ampm}`;
}

// Make functions globally available
window.setEventFilter = setEventFilter;
window.toggleArchive = toggleArchive;

// Real-time update indicator
let updateInterval = null;
let lastUpdateTime = null;

// Function to show update indicator
function showUpdateIndicator() {
  const indicator = document.getElementById("update-indicator");
  if (indicator) {
    indicator.classList.remove("hidden");
    indicator.classList.add("animate-pulse");
  }
}

// Function to hide update indicator
function hideUpdateIndicator() {
  const indicator = document.getElementById("update-indicator");
  if (indicator) {
    indicator.classList.add("hidden");
    indicator.classList.remove("animate-pulse");
  }
}

// ✅ UPDATED: Enhanced fetch with attendance data
async function fetchEventsWithIndicator() {
  showUpdateIndicator();

  // Fetch both events and user attendance in parallel
  await Promise.all([fetchEventsFromDatabase(), fetchUserAttendance()]);

  lastUpdateTime = new Date();
  updateLastUpdateTime();
  hideUpdateIndicator();
}

// Function to update "last updated" time display
function updateLastUpdateTime() {
  const timeDisplay = document.getElementById("last-update-time");
  if (timeDisplay && lastUpdateTime) {
    const now = new Date();
    const diffSeconds = Math.floor((now - lastUpdateTime) / 1000);

    if (diffSeconds < 60) {
      timeDisplay.textContent = "Just now";
    } else if (diffSeconds < 3600) {
      const mins = Math.floor(diffSeconds / 60);
      timeDisplay.textContent = `${mins} minute${mins > 1 ? "s" : ""} ago`;
    } else {
      timeDisplay.textContent = lastUpdateTime.toLocaleTimeString();
    }
  }
}

document.addEventListener("DOMContentLoaded", function () {
  // Add custom CSS for the attendance badge animation
  const style = document.createElement("style");
  style.textContent = `
    @keyframes pulse-slow {
      0%, 100% {
        opacity: 1;
        transform: scale(1);
      }
      50% {
        opacity: 0.9;
        transform: scale(1.05);
      }
    }
    .animate-pulse-slow {
      animation: pulse-slow 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
    }
  `;
  document.head.appendChild(style);

  // Add update indicator to the page if on events tab
  const eventsGrid = document.getElementById("events-grid");
  if (eventsGrid && eventsGrid.parentElement) {
    const indicatorHtml = `
      <div class="fixed bottom-4 right-4 z-50">
        <div id="update-indicator" class="hidden bg-blue-600 text-white px-4 py-2 rounded-lg shadow-lg flex items-center gap-2">
          <i class="fas fa-sync-alt fa-spin"></i>
          <span>Updating...</span>
        </div>
      </div>
    `;
    eventsGrid.parentElement.insertAdjacentHTML("beforeend", indicatorHtml);
  }

  // Initial load
  setTimeout(() => {
    fetchEventsWithIndicator();
  }, 500);

  // Auto-refresh every 15 seconds
  updateInterval = setInterval(fetchEventsWithIndicator, 15000);
});

// Clear interval when leaving the page
window.addEventListener("beforeunload", () => {
  if (updateInterval) {
    clearInterval(updateInterval);
  }
});

// Hook into switchTab function to refresh events
(function () {
  const originalSwitchTab = window.switchTab;

  window.switchTab = function (tabName) {
    // Call original switchTab function
    if (typeof originalSwitchTab === "function") {
      originalSwitchTab.call(this, tabName);
    }

    // If switching to events tab, refresh and start auto-update
    if (tabName === "events") {
      // Clear any existing interval
      if (updateInterval) {
        clearInterval(updateInterval);
      }

      // Fetch fresh data
      fetchEventsWithIndicator();

      // Restart auto-update interval
      updateInterval = setInterval(fetchEventsWithIndicator, 15000);
    } else {
      // Stop auto-update when leaving events tab
      if (updateInterval) {
        clearInterval(updateInterval);
        updateInterval = null;
      }
    }
  };
})();
