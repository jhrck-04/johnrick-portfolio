// Calendar Events Management - WITH INTEGRATED QR SCANNER
let currentMonth = new Date().getMonth();
let currentYear = new Date().getFullYear();
let calendarEvents = [];

// QR Scanner variables
let currentEventIdForScanner = null;
let videoStream = null;
let barcodeDetector = null;
let scannerActive = false;
let html5QrCode = null;
let qrCooldown = false; // Prevents the same QR from firing multiple times in a row

// Load events from database
async function loadCalendarEvents() {
  try {
    console.log("Loading calendar events...");
    const response = await fetch("calendar_events_process.php?action=load");

    if (!response.ok) {
      console.error("HTTP error:", response.status);
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const text = await response.text();
    console.log("Raw response:", text);

    let data;
    try {
      data = JSON.parse(text);
    } catch (e) {
      console.error("JSON parse error:", e);
      console.error("Response text:", text);
      throw new Error("Invalid JSON response from server");
    }

    if (data.status === "success") {
      calendarEvents = data.events || [];
      console.log("Events loaded:", calendarEvents);
      renderCalendarWithEvents();
    } else {
      console.error("Server error:", data.message);
      alert("Error loading events: " + data.message);
    }
  } catch (error) {
    console.error("Error loading events:", error);
    alert("Failed to load calendar events. Please refresh the page.");
  }
}

function prevMonth() {
  currentMonth--;
  if (currentMonth < 0) {
    currentMonth = 11;
    currentYear--;
  }
  renderCalendarWithEvents();
}

function nextMonth() {
  currentMonth++;
  if (currentMonth > 11) {
    currentMonth = 0;
    currentYear++;
  }
  renderCalendarWithEvents();
}

function renderCalendarWithEvents() {
  const monthNames = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];

  document.getElementById("month-title").textContent =
    `${monthNames[currentMonth]} ${currentYear}`;

  const firstDay = new Date(currentYear, currentMonth, 1).getDay();
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const today = new Date();
  const todayStr = `${today.getFullYear()}-${String(
    today.getMonth() + 1,
  ).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;

  let calendarHTML = "";
  const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  // Day headers
  dayNames.forEach((day) => {
    calendarHTML += `<div class="font-bold text-white bg-gradient-to-r from-blue-500 to-blue-600 text-center py-3 rounded-lg shadow-md">${day}</div>`;
  });

  // Empty cells before first day
  for (let i = 0; i < firstDay; i++) {
    calendarHTML += "<div></div>";
  }

  // Days with events
  for (let day = 1; day <= daysInMonth; day++) {
    const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(
      2,
      "0",
    )}-${String(day).padStart(2, "0")}`;
    const dayEvents = calendarEvents.filter((e) => e.event_date === dateStr);

    const isPastDate = dateStr < todayStr;
    const hasEvents = dayEvents.length > 0;

    let bgColor = "bg-white";
    let borderColor = "border-gray-200";
    let shadowStyle = "shadow-sm hover:shadow-lg";

    if (hasEvents) {
      if (isPastDate) {
        bgColor = "bg-gradient-to-br from-green-50 to-green-100";
        borderColor = "border-green-300";
        shadowStyle = "shadow-md hover:shadow-xl";
      } else {
        bgColor = "bg-gradient-to-br from-blue-50 to-blue-100";
        borderColor = "border-blue-300";
        shadowStyle = "shadow-md hover:shadow-xl";
      }
    }

    const isToday = dateStr === todayStr;
    if (isToday) {
      borderColor = "border-orange-500 border-2 ring-2 ring-orange-300";
      bgColor = "bg-gradient-to-br from-orange-50 to-yellow-50";
    }

    calendarHTML += `<div class="${bgColor} ${borderColor} ${shadowStyle} border hover:scale-105 cursor-pointer transition-all duration-300 p-2 rounded-xl h-[100px] flex flex-col items-center justify-start overflow-hidden" onclick="openDateModal('${dateStr}')">`;
    calendarHTML += `<div class="font-semibold text-gray-800 mt-2">${day}</div>`;

    if (hasEvents) {
      const textColor = isPastDate ? "text-green-700" : "text-blue-700";
      const iconClass = isPastDate ? "fa-check-circle" : "fa-calendar-alt";

      if (dayEvents.length === 1) {
        calendarHTML += `<div class="${textColor} text-sm font-bold text-center px-2 py-1 break-words w-full">
    <i class="fas ${iconClass} mr-1"></i>${dayEvents[0].event_title}
  </div>`;
      } else {
        calendarHTML += `<div class="${textColor} text-sm font-bold text-center px-2 py-1">
    <i class="fas fa-list mr-1"></i>${dayEvents.length} events
  </div>`;
      }
    }

    calendarHTML += `</div>`;
  }

  document.getElementById("calendar-grid").innerHTML = calendarHTML;
}

function openDateModal(dateStr) {
  const selectedDate = new Date(dateStr + "T00:00:00");
  const formattedDate = selectedDate.toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const dayEvents = calendarEvents.filter((e) => e.event_date === dateStr);
  const today = new Date();
  const todayStr = `${today.getFullYear()}-${String(
    today.getMonth() + 1,
  ).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
  const isPastDate = dateStr < todayStr;

  let eventsListHTML = "";
  if (dayEvents.length > 0) {
    eventsListHTML = `
      <div class="mb-6 p-4 border-2 border-gray-300 rounded-lg bg-gray-50">
        <h4 class="font-semibold text-gray-700 mb-3">Events on this day:</h4>
        <div class="space-y-2 max-h-40 overflow-y-auto">
          ${dayEvents
            .map((evt) => {
              const isToday = dateStr === todayStr;
              const eventPast = evt.is_finished == 1 || dateStr < todayStr;

              let statusColor, textColor, badgeColor, statusBadge;

              if (eventPast) {
                statusColor = "bg-green-50 border-green-200";
                textColor = "text-green-900";
                badgeColor = "bg-green-200 text-green-800";
                statusBadge =
                  '<span class="inline-block bg-green-500 text-white text-xs px-2 py-1 rounded ml-2">Finished</span>';
              } else if (isToday) {
                statusColor = "bg-orange-50 border-orange-200";
                textColor = "text-orange-900";
                badgeColor = "bg-orange-200 text-orange-800";
                statusBadge =
                  '<span class="inline-block bg-orange-500 text-white text-xs px-2 py-1 rounded ml-2">Today</span>';
              } else {
                statusColor = "bg-blue-50 border-blue-200";
                textColor = "text-blue-900";
                badgeColor = "bg-blue-200 text-blue-800";
                statusBadge =
                  '<span class="inline-block bg-blue-500 text-white text-xs px-2 py-1 rounded ml-2">Upcoming</span>';
              }

              return `
  <div class="${statusColor} border-2 p-4 rounded-lg">
    <div class="flex justify-between items-start mb-3">
      <div class="flex-1">
        <p class="font-semibold ${textColor} text-lg">
          ${evt.event_title}
          ${statusBadge}
        </p>
        <p class="text-sm text-gray-600 mt-2">
          <i class="fas fa-clock mr-1"></i>${evt.event_time}
          <i class="fas fa-map-marker-alt ml-3 mr-1"></i>${evt.location}
        </p>
        <span class="inline-block ${badgeColor} text-xs px-2 py-1 rounded mt-2">
          ${evt.event_type}
        </span>
      </div>
      ${
        canEdit()
          ? `
        <button onclick="deleteCalendarEvent(${evt.id}, event)" class="text-red-600 hover:bg-red-100 p-2 rounded ml-2" title="Delete Event">
          <i class="fas fa-trash"></i>
        </button>
      `
          : ""
      }
    </div>
    <div class="flex gap-2 mt-3">
      <button onclick="openManageEventModal(${evt.id}, event)" class="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded font-semibold transition">
        <i class="fas fa-user-plus mr-2"></i>Manage Attendance
      </button>
      <button onclick="openAttendanceLogModal(${evt.id}, event)" class="flex-1 bg-green-600 hover:bg-green-700 text-white py-2 px-4 rounded font-semibold transition">
        <i class="fas fa-list-check mr-2"></i>View Log
      </button>
      ${
        canEdit() && evt.is_finished != 1 && !eventPast
          ? `
        <button onclick="markEventAsFinished(${evt.id}, event)" class="flex-1 bg-red-600 hover:bg-red-700 text-white py-2 px-4 rounded font-semibold transition">
          <i class="fas fa-check-circle mr-2"></i>Finish
        </button>
      `
          : ""
      }
    </div>
  </div>
`;
            })
            .join("")}
        </div>
      </div>
    `;
  }

  const modal = document.getElementById("date-modal");
  const modalContent = modal.querySelector(".bg-white");
  modalContent.innerHTML = `
    <div class="flex justify-between items-center mb-6">
      <h3 class="text-2xl font-bold text-gray-800">
        <i class="fas fa-calendar-day mr-2 text-blue-600"></i>${formattedDate}
      </h3>
      <button onclick="closeDateModal()" class="text-gray-500 hover:text-gray-700 text-2xl">&times;</button>
    </div>
    ${eventsListHTML}
    <h4 class="font-semibold text-gray-700 mb-3">Add New Event:</h4>
    <form id="add-event-form" class="space-y-4">
      <div class="grid grid-cols-1 gap-4">
        <input type="hidden" id="event-date-input" value="${dateStr}">
        
        <div>
          <label for="event-title" class="block text-sm font-medium text-gray-700 mb-1">Event Title</label>
          <input type="text" id="event-title" placeholder="Enter event title" class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" required>
        </div>

        <div class="grid grid-cols-2 gap-4">
          <div>
            <label for="event-time" class="block text-sm font-medium text-gray-700 mb-1">Time</label>
            <input type="time" id="event-time" value="09:00" class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" required>
          </div>
          <div>
            <label for="event-attendees" class="block text-sm font-medium text-gray-700 mb-1">Expected Attendees</label>
            <input type="number" id="event-attendees" placeholder="Optional" min="0" class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
          </div>
        </div>

        <div>
          <label for="event-location" class="block text-sm font-medium text-gray-700 mb-1">Location</label>
          <input type="text" id="event-location" placeholder="Enter location" class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" required>
        </div>

        <div>
          <label for="event-type" class="block text-sm font-medium text-gray-700 mb-1">Event Type</label>
          <select id="event-type" class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" required>
            <option value="">Select event type</option>
            <option value="Worship Service">Worship Service</option>
            <option value="Prayer Meeting">Prayer Meeting</option>
            <option value="Bible Study">Bible Study</option>
            <option value="Youth Gathering">Youth Gathering</option>
            <option value="Community Outreach">Community Outreach</option>
            <option value="Special Event">Special Event</option>
            <option value="Conference">Conference</option>
            <option value="Other">Other</option>
          </select>
        </div>
      </div>

      <div class="flex justify-end gap-3 pt-4">
        <button type="button" onclick="closeDateModal()" class="px-6 py-2 bg-gray-300 hover:bg-gray-400 rounded-lg font-semibold transition">
          Cancel
        </button>
        <button type="submit" class="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition flex items-center gap-2">
          <i class="fas fa-plus"></i>Add Event
        </button>
      </div>
    </form>
  `;

  modal.classList.remove("hidden");
  document.getElementById("add-event-form").onsubmit = (e) =>
    addEventToCalendar(e, dateStr);
}

function closeDateModal() {
  document.getElementById("date-modal").classList.add("hidden");
}

async function addEventToCalendar(e, dateStr) {
  e.preventDefault();

  const title = document.getElementById("event-title").value;
  const time = document.getElementById("event-time").value;
  const location = document.getElementById("event-location").value;
  const eventType = document.getElementById("event-type").value;
  const attendees = document.getElementById("event-attendees").value || 0;

  const formData = new FormData();
  formData.append("action", "add");
  formData.append("event_date", dateStr);
  formData.append("event_title", title);
  formData.append("event_time", time);
  formData.append("location", location);
  formData.append("event_type", eventType);
  formData.append("attendees", attendees);

  try {
    const response = await fetch("calendar_events_process.php", {
      method: "POST",
      body: formData,
    });

    const text = await response.text();
    let data;
    try {
      data = JSON.parse(text);
    } catch (e) {
      console.error("JSON parse error:", e);
      console.error("Response text:", text);
      alert("Error: Invalid response from server");
      return;
    }

    if (data.status === "success") {
      alert("✅ Event added successfully!");
      AuditLogger.log(
        "CREATE",
        "Calendar",
        "Added event: " + title + " on " + dateStr,
      );
      closeDateModal();
      loadCalendarEvents();
    } else {
      alert("Error: " + data.message);
    }
  } catch (error) {
    console.error("Error:", error);
    alert("Failed to add event. Please try again.");
  }
}

async function deleteCalendarEvent(eventId, event) {
  event.stopPropagation();

  if (!confirm("Are you sure you want to delete this event?")) {
    return;
  }

  const formData = new FormData();
  formData.append("action", "delete");
  formData.append("event_id", eventId);

  try {
    const response = await fetch("calendar_events_process.php", {
      method: "POST",
      body: formData,
    });

    const data = await response.json();

    if (data.status === "success") {
      alert("✅ Event deleted successfully!");
      AuditLogger.log(
        "DELETE",
        "Calendar",
        "Deleted calendar event (ID: " + eventId + ")",
      );
      closeDateModal();
      loadCalendarEvents();
    } else {
      alert("Error: " + data.message);
    }
  } catch (error) {
    console.error("Error:", error);
    alert("Failed to delete event. Please try again.");
  }
}

// 🎯 NEW: Open Manage Event Modal with QR Scanner Integration
async function openManageEventModal(eventId, event) {
  if (event) {
    event.stopPropagation();
  }

  // Store event ID for scanner
  currentEventIdForScanner = eventId;

  // Find the event
  const eventData = calendarEvents.find((e) => e.id === eventId);
  if (!eventData) {
    alert("Event not found!");
    return;
  }

  // Check if event is finished
  const isFinished = eventData.is_finished == 1;

  // Create modal HTML with QR Scanner tabs
  const modal = document.getElementById("manage-event-modal");
  const modalContent = modal.querySelector(".bg-white");

  modalContent.innerHTML = `
    <!-- Header -->
    <div class="flex justify-between items-center mb-6 pb-4 border-b-2 border-gray-200">
      <div>
        <h3 class="text-2xl font-bold text-gray-800 flex items-center">
          <i class="fas fa-users-cog mr-3 text-blue-600"></i>
          Manage Event
        </h3>
      </div>
      <button onclick="closeManageEventModal()" class="text-gray-500 hover:text-gray-700 text-3xl font-bold leading-none">
        &times;
      </button>
    </div>

    <!-- Event Title & Info -->
    <div class="bg-blue-50 p-4 rounded-lg mb-6">
      <h4 class="text-xl font-bold text-blue-900 mb-2">${escapeHtml(eventData.event_title)}</h4>
      <div class="text-sm text-gray-700 space-y-1">
        <p><i class="fas fa-calendar mr-2"></i>${eventData.event_date}</p>
        <p><i class="fas fa-clock mr-2"></i>${eventData.event_time}</p>
      </div>
    </div>

    <!-- Tab Navigation -->
    <div class="flex border-b-2 border-gray-200 mb-6">
      <button 
        id="camera-tab-btn" 
        onclick="switchScannerTab('camera')"
        class="scanner-tab-btn flex-1 py-3 px-4 text-center font-semibold transition border-b-4 border-green-600 text-green-700 bg-green-50"
        ${isFinished ? "disabled" : ""}
      >
        <i class="fas fa-camera mr-2"></i>Camera
      </button>
      <button 
        id="manual-tab-btn" 
        onclick="switchScannerTab('manual')"
        class="scanner-tab-btn flex-1 py-3 px-4 text-center font-semibold transition border-b-4 border-transparent text-gray-600 hover:bg-gray-50"
      >
        <i class="fas fa-keyboard mr-2"></i>Manual
      </button>
      <button 
        id="upload-tab-btn" 
        onclick="switchScannerTab('upload')"
        class="scanner-tab-btn flex-1 py-3 px-4 text-center font-semibold transition border-b-4 border-transparent text-gray-600 hover:bg-gray-50"
        ${isFinished ? "disabled" : ""}
      >
        <i class="fas fa-upload mr-2"></i>Upload
      </button>
    </div>

    <!-- Tab Content -->
    <div id="camera-tab-content" class="scanner-tab-content">
      ${
        isFinished
          ? `
        <div class="text-center py-12">
          <i class="fas fa-lock text-6xl text-gray-300 mb-4"></i>
          <p class="text-gray-500 text-lg font-semibold">This event has been marked as finished.</p>
          <p class="text-gray-400">You cannot add more participants.</p>
        </div>
      `
          : `
        <div class="text-center">
          <div id="qr-video-container" class="relative mx-auto mb-4 rounded-lg overflow-hidden bg-black" style="max-width: 400px; max-height: 400px;">
            <video id="qr-video" class="w-full h-full" autoplay playsinline></video>
            <div id="qr-overlay" class="absolute inset-0 flex items-center justify-center">
              <div class="border-4 border-green-500 rounded-lg" style="width: 200px; height: 200px;"></div>
            </div>
          </div>
          <div id="qr-image-reader" style="position: absolute; left: -9999px; width: 1px; height: 1px; overflow: hidden;"></div>
          <p class="text-sm text-gray-600 mb-4"><i class="fas fa-info-circle mr-2"></i>Position QR code within the frame</p>
          <button id="start-camera-btn" onclick="startCamera()" class="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-semibold">
            <i class="fas fa-video mr-2"></i>Start Camera
          </button>
          <button id="stop-camera-btn" onclick="stopCamera()" class="hidden bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-lg font-semibold">
            <i class="fas fa-stop-circle mr-2"></i>Stop Camera
          </button>
          <div id="scan-status" class="mt-4 text-sm font-semibold"></div>
        </div>
      `
      }
    </div>

    <div id="manual-tab-content" class="scanner-tab-content hidden">
      <div class="bg-white p-6 rounded-lg">
        <label class="block text-sm font-semibold text-gray-700 mb-2">
          <i class="fas fa-user mr-2"></i>Search Participant
        </label>
        <p class="text-xs text-gray-500 mb-3">Search by name or unique participant number</p>
        
        <div class="relative">
          <input 
            type="text" 
            id="participant-search-manual" 
            placeholder="Enter name or unique number..." 
            class="w-full px-4 py-3 pr-12 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" 
            oninput="searchParticipantsManual(this.value)"
            ${isFinished ? "disabled" : ""}
          >
          <i class="fas fa-search absolute right-4 top-4 text-gray-400"></i>
        </div>

        <!-- Hidden inputs to store selected values -->
        <input type="hidden" id="selected-participant-id-manual">
        <input type="hidden" id="selected-account-number-manual">

        <!-- Autocomplete Results -->
        <div id="autocomplete-results-manual" class="hidden mt-2 bg-white border-2 border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto"></div>

        <!-- Add Button -->
        <button 
          onclick="addParticipantManually()" 
          class="w-full mt-4 bg-green-600 hover:bg-green-700 text-white py-3 rounded-lg font-semibold transition flex items-center justify-center gap-2"
          ${isFinished ? "disabled" : ""}
        >
          <i class="fas fa-user-plus"></i>Add Participant
        </button>
      </div>
    </div>

    <div id="upload-tab-content" class="scanner-tab-content hidden">
      ${
        isFinished
          ? `
        <div class="text-center py-12">
          <i class="fas fa-lock text-6xl text-gray-300 mb-4"></i>
          <p class="text-gray-500 text-lg font-semibold">This event has been marked as finished.</p>
          <p class="text-gray-400">You cannot add more participants.</p>
        </div>
      `
          : `
        <div class="text-center p-8">
          <div class="border-4 border-dashed border-gray-300 rounded-lg p-12 bg-gray-50">
            <i class="fas fa-cloud-upload-alt text-6xl text-gray-400 mb-4"></i>
            <p class="text-gray-600 mb-4">Upload an image with QR code</p>
            <input type="file" id="qr-image-upload" accept="image/*" class="hidden" onchange="handleImageUpload(event)">
            <button onclick="document.getElementById('qr-image-upload').click()" class="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-semibold">
              <i class="fas fa-file-image mr-2"></i>Choose Image
            </button>
          </div>
          <div id="upload-preview" class="mt-6 hidden">
            <img id="uploaded-image" class="mx-auto max-w-full rounded-lg shadow-lg" style="max-height: 300px;">
            <p id="upload-result" class="mt-4 font-semibold"></p>
          </div>
        </div>
      `
      }
    </div>

    <!-- Current Participant Count -->
    <div class="mt-8 bg-green-50 p-6 rounded-lg text-center border-2 border-green-200">
      <p class="text-sm text-gray-600 mb-2">Current number of Participant/s</p>
      <p class="text-5xl font-bold text-green-600" id="participant-count-display">
        <i class="fas fa-spinner fa-spin"></i>
      </p>
      <p class="text-xs text-green-700 mt-2">
        <i class="fas fa-check-circle mr-1"></i>Live count from database
      </p>
    </div>

    <!-- Action Buttons -->
    <div class="mt-6 flex gap-3">
      ${
        !isFinished && canEdit()
          ? `
        <button onclick="markEventAsFinished(${eventId})" class="flex-1 bg-red-600 hover:bg-red-700 text-white py-3 rounded-lg font-semibold transition">
          <i class="fas fa-check-circle mr-2"></i>Event Finished
        </button>
      `
          : ""
      }
      <button onclick="closeManageEventModal()" class="flex-1 bg-gray-600 hover:bg-gray-700 text-white py-3 rounded-lg font-semibold transition">
        Close
      </button>
    </div>
  `;

  // Show modal
  modal.classList.remove("hidden");

  // Load participant count
  loadParticipantCount(eventId);
}

function closeManageEventModal() {
  // Stop camera if running
  stopCamera();

  // Hide modal
  document.getElementById("manage-event-modal").classList.add("hidden");

  // Clear current event ID
  currentEventIdForScanner = null;
}

// Switch between scanner tabs
function switchScannerTab(tabName) {
  // Stop camera when switching tabs
  if (tabName !== "camera") {
    stopCamera();
  }

  // Hide all tab contents
  document.querySelectorAll(".scanner-tab-content").forEach((content) => {
    content.classList.add("hidden");
  });

  // Remove active state from all buttons
  document.querySelectorAll(".scanner-tab-btn").forEach((btn) => {
    btn.classList.remove("border-green-600", "text-green-700", "bg-green-50");
    btn.classList.add("border-transparent", "text-gray-600");
  });

  // Show selected tab content
  document.getElementById(`${tabName}-tab-content`).classList.remove("hidden");

  // Activate selected button
  const activeBtn = document.getElementById(`${tabName}-tab-btn`);
  activeBtn.classList.add("border-green-600", "text-green-700", "bg-green-50");
  activeBtn.classList.remove("border-transparent", "text-gray-600");
}

// 📷 Start Camera for QR Scanning - WITH FALLBACK
async function startCamera() {
  try {
    const video = document.getElementById("qr-video");
    const startBtn = document.getElementById("start-camera-btn");
    const stopBtn = document.getElementById("stop-camera-btn");
    const statusDiv = document.getElementById("scan-status");

    // Request camera access
    videoStream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: "environment" },
    });

    video.srcObject = videoStream;
    scannerActive = true;

    // Show/hide buttons
    startBtn.classList.add("hidden");
    stopBtn.classList.remove("hidden");

    statusDiv.innerHTML =
      '<span class="text-green-600"><i class="fas fa-check-circle mr-2"></i>Camera active - Ready to scan</span>';

    // ✅ NEW: Try BarcodeDetector first, fallback to html5-qrcode
    if ("BarcodeDetector" in window) {
      // Native browser support (Chrome, Edge, Samsung Internet)
      barcodeDetector = new BarcodeDetector({ formats: ["qr_code"] });
      scanQRCode();
      console.log("✅ Using native BarcodeDetector API");
    } else if (typeof Html5Qrcode !== "undefined") {
      // Fallback for browsers without native support (Brave, Firefox, Safari)
      startHtml5QrCodeScanner();
      console.log("✅ Using html5-qrcode fallback library");
    } else {
      statusDiv.innerHTML =
        '<span class="text-red-600"><i class="fas fa-exclamation-triangle mr-2"></i>QR library not loaded. Please refresh the page.</span>';
      stopCamera();
    }
  } catch (error) {
    console.error("Camera error:", error);
    document.getElementById("scan-status").innerHTML =
      '<span class="text-red-600"><i class="fas fa-times-circle mr-2"></i>Camera access denied</span>';
  }
}

// 🆕 Start html5-qrcode scanner (fallback for Brave, Firefox, Safari)
async function startHtml5QrCodeScanner() {
  try {
    const statusDiv = document.getElementById("scan-status");

    // Create scanner instance
    html5QrCode = new Html5Qrcode("qr-video-container");

    // Start scanning
    await html5QrCode.start(
      { facingMode: "environment" }, // Camera config
      {
        fps: 10, // Frames per second
        qrbox: { width: 250, height: 250 }, // Scanning box size
      },
      async (decodedText, decodedResult) => {
        // QR code detected!
        console.log("QR Code detected:", decodedText);
        await processQRData(decodedText);
      },
      (errorMessage) => {
        // Scanning errors (can be ignored, happens when no QR in view)
        // console.log("Scan error:", errorMessage);
      },
    );

    statusDiv.innerHTML =
      '<span class="text-green-600"><i class="fas fa-check-circle mr-2"></i>Scanner active - Point camera at QR code</span>';
  } catch (error) {
    console.error("html5-qrcode error:", error);
    document.getElementById("scan-status").innerHTML =
      '<span class="text-red-600"><i class="fas fa-exclamation-triangle mr-2"></i>Failed to start scanner</span>';
  }
}

// 🛑 Stop Camera - UPDATED
function stopCamera() {
  // Stop native video stream if exists
  if (videoStream) {
    videoStream.getTracks().forEach((track) => track.stop());
    videoStream = null;
  }

  // Stop html5-qrcode scanner if exists
  if (html5QrCode) {
    html5QrCode
      .stop()
      .then(() => {
        console.log("html5-qrcode stopped");
        html5QrCode = null;
      })
      .catch((err) => {
        console.error("Error stopping html5-qrcode:", err);
        html5QrCode = null;
      });
  }

  scannerActive = false;

  const video = document.getElementById("qr-video");
  const startBtn = document.getElementById("start-camera-btn");
  const stopBtn = document.getElementById("stop-camera-btn");
  const statusDiv = document.getElementById("scan-status");

  if (video) video.srcObject = null;
  if (startBtn) startBtn.classList.remove("hidden");
  if (stopBtn) stopBtn.classList.add("hidden");
  if (statusDiv) statusDiv.innerHTML = "";
}

// 🔍 Scan QR Code continuously (for BarcodeDetector API only)
async function scanQRCode() {
  if (!scannerActive || !barcodeDetector) return;

  const video = document.getElementById("qr-video");

  try {
    const barcodes = await barcodeDetector.detect(video);

    if (barcodes.length > 0) {
      const qrData = barcodes[0].rawValue;
      await processQRData(qrData);
    }
  } catch (error) {
    console.error("Scan error:", error);
  }

  // Continue scanning
  if (scannerActive) {
    requestAnimationFrame(scanQRCode);
  }
}

// 📤 Handle Image Upload - WITH FALLBACK
async function handleImageUpload(event) {
  const file = event.target.files[0];
  if (!file) return;

  const preview = document.getElementById("upload-preview");
  const img = document.getElementById("uploaded-image");
  const result = document.getElementById("upload-result");

  // Show preview
  const reader = new FileReader();
  reader.onload = async (e) => {
    img.src = e.target.result;
    preview.classList.remove("hidden");
    result.innerHTML =
      '<i class="fas fa-spinner fa-spin mr-2"></i>Processing...';

    // ✅ NEW: Try BarcodeDetector first, fallback to html5-qrcode
    if ("BarcodeDetector" in window) {
      // Native browser support
      const detector = new BarcodeDetector({ formats: ["qr_code"] });

      try {
        const barcodes = await detector.detect(img);

        if (barcodes.length > 0) {
          const qrData = barcodes[0].rawValue;
          await processQRData(qrData);
          result.innerHTML =
            '<span class="text-green-600"><i class="fas fa-check-circle mr-2"></i>QR code detected and processed!</span>';
        } else {
          result.innerHTML =
            '<span class="text-red-600"><i class="fas fa-times-circle mr-2"></i>No QR code found in image</span>';
        }
      } catch (error) {
        result.innerHTML =
          '<span class="text-red-600"><i class="fas fa-exclamation-triangle mr-2"></i>Error reading QR code</span>';
      }
    } else if (typeof Html5Qrcode !== "undefined") {
      // Fallback for browsers without native support
      try {
        const html5QrCodeScanner = new Html5Qrcode("qr-image-reader");
        const qrData = await html5QrCodeScanner.scanFile(file, true);

        if (qrData) {
          await processQRData(qrData);
          result.innerHTML =
            '<span class="text-green-600"><i class="fas fa-check-circle mr-2"></i>QR code detected and processed!</span>';
        }
      } catch (error) {
        console.error("QR scan error:", error);
        result.innerHTML =
          '<span class="text-red-600"><i class="fas fa-times-circle mr-2"></i>No QR code found in image</span>';
      }
    } else {
      result.innerHTML =
        '<span class="text-orange-600"><i class="fas fa-exclamation-triangle mr-2"></i>QR library not loaded</span>';
    }
  };

  reader.readAsDataURL(file);
}

// 🔄 Process QR Data (add participant) - UNCHANGED
async function processQRData(qrData) {
  // Ignore if we're still in the cooldown window from a previous scan
  if (qrCooldown) return;

  // Lock immediately so rapid re-fires of the same QR are ignored
  qrCooldown = true;

  // ADD THIS LINE:
  console.log("🔍 DEBUG 1: QR Data received:", qrData);

  const wasActive = scannerActive;
  scannerActive = false;

  const statusDiv = document.getElementById("scan-status");
  if (statusDiv) {
    statusDiv.innerHTML =
      '<span class="text-blue-600"><i class="fas fa-spinner fa-spin mr-2"></i>Processing QR code...</span>';
  }

  try {
    let accountNumber, userId;

    try {
      const parsed = JSON.parse(qrData);

      // ✅ FIX: Only use parsed data if it's an object with account_number property
      if (
        typeof parsed === "object" &&
        parsed !== null &&
        parsed.account_number
      ) {
        accountNumber = parsed.account_number;
        userId = parsed.user_id;
      } else {
        // Not a proper JSON object (could be a number), treat as raw account number
        accountNumber = qrData.trim();
      }
    } catch {
      // Not valid JSON, assume raw account number
      accountNumber = qrData.trim();
    }

    // ADD THIS LINE:
    console.log("🔍 DEBUG 2: Extracted account number:", accountNumber);

    // Fetch user details from database
    const response = await fetch(
      `participant_search.php?term=${encodeURIComponent(accountNumber)}`,
    );

    // ADD THIS LINE:
    console.log(
      "🔍 DEBUG 3: Search URL:",
      `participant_search.php?term=${encodeURIComponent(accountNumber)}`,
    );

    const data = await response.json();

    // ADD THIS LINE:
    console.log("🔍 DEBUG 4: Search response:", data);

    if (data.status === "success" && data.results.length > 0) {
      const user = data.results[0];

      // ADD THIS LINE:
      console.log("🔍 DEBUG 5: Found user:", user);
      console.log("🔍 DEBUG 6: Calling addParticipantToEvent with:", {
        userId: user.id,
        accountNumber: user.account_number,
      });

      // Add participant to event
      await addParticipantToEvent(user.id, user.account_number);

      if (statusDiv) {
        statusDiv.innerHTML = `<span class="text-green-600"><i class="fas fa-check-circle mr-2"></i>Added: ${user.full_name}</span>`;
      }

      // Resume scanning after 2 seconds
      setTimeout(() => {
        qrCooldown = false; // Allow next scan
        if (wasActive && document.getElementById("qr-video")) {
          scannerActive = true;
          if (barcodeDetector) {
            scanQRCode(); // Resume native scanner
          }
          // html5-qrcode continues automatically
          if (statusDiv) {
            statusDiv.innerHTML =
              '<span class="text-green-600"><i class="fas fa-check-circle mr-2"></i>Ready to scan next</span>';
          }
        }
      }, 2000);
    } else {
      if (statusDiv) {
        statusDiv.innerHTML =
          '<span class="text-red-600"><i class="fas fa-times-circle mr-2"></i>Participant not found</span>';
      }
      setTimeout(() => {
        qrCooldown = false; // Allow next scan
        if (wasActive) {
          scannerActive = true;
          if (barcodeDetector) {
            scanQRCode();
          }
          if (statusDiv) {
            statusDiv.innerHTML =
              '<span class="text-green-600"><i class="fas fa-check-circle mr-2"></i>Ready to scan</span>';
          }
        }
      }, 2000);
    }
  } catch (error) {
    console.error("QR processing error:", error);
    if (statusDiv) {
      statusDiv.innerHTML =
        '<span class="text-red-600"><i class="fas fa-exclamation-triangle mr-2"></i>Error processing QR code</span>';
    }

    if (wasActive) {
      setTimeout(() => {
        qrCooldown = false; // Allow next scan
        scannerActive = true;
        if (barcodeDetector) {
          scanQRCode();
        }
      }, 2000);
    }
  }
}

// ========================================================================
// END OF UPDATED SCANNER FUNCTIONS
// ========================================================================

// 🔍 Search Participants (Manual Tab)
let searchManualTimeout;
async function searchParticipantsManual(searchTerm) {
  clearTimeout(searchManualTimeout);

  const resultsDiv = document.getElementById("autocomplete-results-manual");

  if (searchTerm.trim().length < 2) {
    resultsDiv.classList.add("hidden");
    return;
  }

  searchManualTimeout = setTimeout(async () => {
    try {
      const response = await fetch(
        `participant_search.php?term=${encodeURIComponent(searchTerm)}`,
      );
      const data = await response.json();

      if (data.status === "success" && data.results.length > 0) {
        displaySearchResultsManual(data.results);
      } else {
        resultsDiv.innerHTML = `
          <div class="p-4 text-center text-gray-500">
            <i class="fas fa-search mr-2"></i>No participants found
          </div>
        `;
        resultsDiv.classList.remove("hidden");
      }
    } catch (error) {
      console.error("Search error:", error);
      resultsDiv.classList.add("hidden");
    }
  }, 300);
}

function displaySearchResultsManual(results) {
  const resultsDiv = document.getElementById("autocomplete-results-manual");

  const resultsHTML = results
    .map(
      (user) => `
    <div 
      onclick="selectParticipantManual(${user.id}, '${escapeHtml(user.account_number)}', '${escapeHtml(user.full_name)}')" 
      class="p-4 hover:bg-blue-50 cursor-pointer border-b border-gray-100 transition"
    >
      <p class="font-semibold text-gray-800">${escapeHtml(user.full_name)}</p>
      <p class="text-sm text-gray-600">
        <i class="fas fa-id-card mr-1"></i>Account: ${escapeHtml(user.account_number)}
      </p>
    </div>
  `,
    )
    .join("");

  resultsDiv.innerHTML = resultsHTML;
  resultsDiv.classList.remove("hidden");
}

function selectParticipantManual(userId, accountNumber, fullName) {
  const searchInput = document.getElementById("participant-search-manual");
  const resultsDiv = document.getElementById("autocomplete-results-manual");
  const userIdInput = document.getElementById("selected-participant-id-manual");
  const accountInput = document.getElementById(
    "selected-account-number-manual",
  );

  searchInput.value = `${fullName} (${accountNumber})`;
  userIdInput.value = userId;
  accountInput.value = accountNumber;

  resultsDiv.classList.add("hidden");
}

// ➕ Add Participant Manually
async function addParticipantManually() {
  const userId = document.getElementById(
    "selected-participant-id-manual",
  ).value;
  const accountNumber = document.getElementById(
    "selected-account-number-manual",
  ).value;

  if (!userId || !accountNumber) {
    alert("Please select a participant from the search results");
    return;
  }

  await addParticipantToEvent(userId, accountNumber);

  // Clear inputs
  document.getElementById("participant-search-manual").value = "";
  document.getElementById("selected-participant-id-manual").value = "";
  document.getElementById("selected-account-number-manual").value = "";
}

// ➕ Add Participant to Event (common function)
async function addParticipantToEvent(userId, accountNumber) {
  // ADD THESE LINES:
  console.log("🔍 DEBUG 7: addParticipantToEvent called with:", {
    userId: userId,
    accountNumber: accountNumber,
    eventId: currentEventIdForScanner,
  });

  if (!currentEventIdForScanner) {
    alert("No event selected");
    return;
  }

  const formData = new FormData();
  formData.append("action", "add_participant");
  formData.append("event_id", currentEventIdForScanner);
  formData.append("user_id", userId);
  formData.append("account_number", accountNumber);

  // ADD THESE LINES:
  console.log("🔍 DEBUG 8: FormData contents:");
  for (let [key, value] of formData.entries()) {
    console.log(`  ${key}: ${value}`);
  }

  try {
    const response = await fetch("event_participants_process.php", {
      method: "POST",
      body: formData,
    });

    // ADD THIS LINE:
    console.log("🔍 DEBUG 9: Response status:", response.status);

    const data = await response.json();

    // ADD THIS LINE:
    console.log("🔍 DEBUG 10: Response data:", data);

    if (data.status === "success") {
      showSuccessNotification(
        `✅ ${data.participant_name} added successfully!`,
      );
      AuditLogger.log(
        "ADD_PARTICIPANT",
        "Events",
        "Added participant: " +
          data.participant_name +
          " to event ID: " +
          currentEventIdForScanner,
      );
      loadParticipantCount(currentEventIdForScanner);
    } else {
      // ADD THIS LINE:
      console.error("🔍 DEBUG 11: Failed to add participant:", data.message);
      alert("Error: " + data.message);
    }
  } catch (error) {
    // ADD THIS LINE:
    console.error("🔍 DEBUG 12: Exception occurred:", error);
    console.error("Error adding participant:", error);
    alert("Failed to add participant. Please try again.");
  }
}

// 📊 Load Participant Count
async function loadParticipantCount(eventId) {
  const countDisplay = document.getElementById("participant-count-display");

  if (!countDisplay) return;

  try {
    const formData = new FormData();
    formData.append("action", "get_count");
    formData.append("event_id", eventId);

    const response = await fetch("event_participants_process.php", {
      method: "POST",
      body: formData,
    });

    const data = await response.json();

    if (data.status === "success") {
      countDisplay.textContent = data.count;
    } else {
      countDisplay.textContent = "0";
    }
  } catch (error) {
    console.error("Error loading participant count:", error);
    countDisplay.textContent = "?";
  }
}

// Keep existing functions: openAttendanceLogModal, markEventAsFinished, etc.
// (Rest of the original code continues here...)

async function openAttendanceLogModal(eventId, event) {
  if (event) {
    event.stopPropagation();
  }

  const eventData = calendarEvents.find((e) => e.id === eventId);
  if (!eventData) {
    alert("Event not found!");
    return;
  }

  const formData = new FormData();
  formData.append("action", "get_participants");
  formData.append("event_id", eventId);

  try {
    const response = await fetch("event_participants_process.php", {
      method: "POST",
      body: formData,
    });

    const data = await response.json();

    if (data.status === "success") {
      displayAttendanceLog(eventData, data.participants);
    } else {
      alert("Error loading participants: " + data.message);
    }
  } catch (error) {
    console.error("Error:", error);
    alert("Failed to load attendance log");
  }
}

function displayAttendanceLog(eventData, participants) {
  const modal = document.getElementById("attendance-modal");
  const modalContent = modal.querySelector(".bg-white");

  let participantsHTML = "";
  if (participants.length > 0) {
    participantsHTML = `
      <div class="space-y-3 max-h-96 overflow-y-auto">
        ${participants
          .map(
            (p, index) => `
          <div class="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200 hover:shadow-md transition">
            <div class="flex items-center gap-4">
              <div class="bg-blue-100 text-blue-700 font-bold w-10 h-10 rounded-full flex items-center justify-center">
                ${index + 1}
              </div>
              <div>
                <p class="font-semibold text-gray-800">${escapeHtml(p.participant_name)}</p>
                <p class="text-sm text-gray-600">
                  <i class="fas fa-id-card mr-1"></i>${escapeHtml(p.account_number)}
                </p>
                <p class="text-xs text-gray-500">
                  <i class="fas fa-clock mr-1"></i>${formatDateTime(p.attended_at)}
                </p>
              </div>
            </div>
            ${
              canEdit()
                ? `
              <button onclick="removeParticipant(${p.id}, ${eventData.id}, event)" class="text-red-600 hover:bg-red-100 p-2 rounded transition" title="Remove Participant">
                <i class="fas fa-trash"></i>
              </button>
            `
                : ""
            }
          </div>
        `,
          )
          .join("")}
      </div>
    `;
  } else {
    participantsHTML = `
      <div class="text-center py-12">
        <i class="fas fa-users-slash text-6xl text-gray-300 mb-4"></i>
        <p class="text-gray-500 text-lg">No participants recorded yet</p>
      </div>
    `;
  }

  modalContent.innerHTML = `
    <div class="flex justify-between items-center mb-6 pb-4 border-b-2 border-gray-200">
      <h3 class="text-2xl font-bold text-gray-800 flex items-center">
        <i class="fas fa-list-check mr-3 text-green-600"></i>
        Attendance Log
      </h3>
      <button onclick="closeAttendanceModal()" class="text-gray-500 hover:text-gray-700 text-3xl">
        &times;
      </button>
    </div>

    <div class="mb-6 p-4 bg-green-50 rounded-lg border-2 border-green-200">
      <h4 class="font-bold text-green-900 text-lg mb-2">${escapeHtml(eventData.event_title)}</h4>
      <p class="text-sm text-gray-700">
        <i class="fas fa-calendar mr-2"></i>${eventData.event_date}
        <i class="fas fa-clock ml-4 mr-2"></i>${eventData.event_time}
      </p>
    </div>

    <div class="mb-4 flex justify-between items-center">
      <p class="text-lg font-semibold text-gray-700">
        <i class="fas fa-users mr-2 text-blue-600"></i>
        Total Participants: <span class="text-2xl text-blue-600">${participants.length}</span>
      </p>
      <button onclick="exportAttendancePDF(${eventData.id})" class="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-semibold transition flex items-center gap-2">
        <i class="fas fa-file-pdf"></i>Export PDF
      </button>
    </div>

    ${participantsHTML}

    <div class="mt-6 flex justify-end">
      <button onclick="closeAttendanceModal()" class="bg-gray-600 hover:bg-gray-700 text-white px-6 py-3 rounded-lg font-semibold transition">
        Close
      </button>
    </div>
  `;

  modal.classList.remove("hidden");
}

function closeAttendanceModal() {
  document.getElementById("attendance-modal").classList.add("hidden");
}

async function markEventAsFinished(eventId, event) {
  if (event) {
    event.stopPropagation();
  }

  // Show custom confirmation modal with countdown
  const confirmed = await showMarkFinishedConfirmModal();
  if (!confirmed) return;

  const formData = new FormData();
  formData.append("action", "mark_finished");
  formData.append("event_id", eventId);

  try {
    const response = await fetch("calendar_events_process.php", {
      method: "POST",
      body: formData,
    });

    const data = await response.json();

    if (data.status === "success") {
      showSuccessNotification("Event has been marked as finished!");
      AuditLogger.log(
        "MARK_FINISHED",
        "Calendar",
        "Marked event as finished (ID: " + eventId + ")",
      );
      closeManageEventModal();
      closeDateModal();
      loadCalendarEvents();
    } else {
      showErrorNotification("Error: " + data.message);
    }
  } catch (error) {
    console.error("Error:", error);
    showErrorNotification(
      "Failed to mark event as finished. Please try again.",
    );
  }
}

function showMarkFinishedConfirmModal() {
  return new Promise((resolve) => {
    // Remove any existing modal
    const existing = document.getElementById("mark-finished-confirm-modal");
    if (existing) existing.remove();

    const modal = document.createElement("div");
    modal.id = "mark-finished-confirm-modal";
    modal.style.cssText = `
      position: fixed; inset: 0; background: rgba(0,0,0,0.75);
      display: flex; align-items: center; justify-content: center;
      z-index: 99999;
    `;

    modal.innerHTML = `
      <style>
        @keyframes mfSlideUp {
          from { opacity: 0; transform: translateY(30px) scale(0.95); }
          to   { opacity: 1; transform: translateY(0)    scale(1);    }
        }
        #mark-finished-confirm-modal .mf-box {
          background: #1e293b;
          border-radius: 20px;
          padding: 36px 32px 28px;
          max-width: 460px;
          width: 90%;
          box-shadow: 0 25px 60px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.06);
          animation: mfSlideUp 0.35s cubic-bezier(0.34, 1.56, 0.64, 1);
          text-align: center;
        }
        #mark-finished-confirm-modal .mf-icon {
          width: 80px; height: 80px;
          background: linear-gradient(135deg, #dc2626, #991b1b);
          border-radius: 50%;
          display: flex; align-items: center; justify-content: center;
          margin: 0 auto 20px;
          box-shadow: 0 0 0 14px rgba(220,38,38,0.12);
          font-size: 38px;
        }
        #mark-finished-confirm-modal h2 {
          color: #f1f5f9; font-size: 1.45rem; font-weight: 800;
          margin: 0 0 8px; letter-spacing: -0.3px;
        }
        #mark-finished-confirm-modal .mf-sub {
          color: #94a3b8; font-size: 0.88rem; line-height: 1.55; margin-bottom: 4px;
        }
        #mark-finished-confirm-modal .mf-warn {
          background: rgba(220,38,38,0.1);
          border: 1px solid rgba(220,38,38,0.3);
          border-radius: 10px;
          padding: 11px 15px;
          margin: 16px 0 20px;
          color: #fca5a5;
          font-size: 0.84rem; font-weight: 600;
          display: flex; align-items: flex-start; gap: 9px; text-align: left;
        }
        #mark-finished-confirm-modal .mf-bar-wrap {
          height: 5px; background: rgba(255,255,255,0.08);
          border-radius: 3px; overflow: hidden; margin-bottom: 8px;
        }
        #mark-finished-confirm-modal .mf-bar {
          height: 100%; width: 100%;
          background: linear-gradient(90deg, #dc2626, #f97316);
          border-radius: 3px;
          transition: width 1s linear;
        }
        #mark-finished-confirm-modal .mf-cd-text {
          color: #64748b; font-size: 0.78rem; margin-bottom: 22px; min-height: 18px;
        }
        #mark-finished-confirm-modal .mf-btn-row {
          display: flex; gap: 12px;
        }
        #mark-finished-confirm-modal .mf-btn-cancel {
          flex: 1; background: #334155; color: #cbd5e1;
          border: none; border-radius: 10px;
          padding: 13px; font-size: 0.93rem; font-weight: 700;
          cursor: pointer; transition: background 0.2s, color 0.2s;
        }
        #mark-finished-confirm-modal .mf-btn-cancel:hover { background: #475569; color: #fff; }
        #mark-finished-confirm-modal .mf-btn-confirm {
          flex: 1;
          background: linear-gradient(135deg, #dc2626, #991b1b);
          color: #fff; border: none; border-radius: 10px;
          padding: 13px; font-size: 0.93rem; font-weight: 700;
          cursor: pointer; transition: all 0.2s;
        }
        #mark-finished-confirm-modal .mf-btn-confirm:hover:not(:disabled) {
          background: linear-gradient(135deg, #ef4444, #dc2626);
          transform: translateY(-1px);
          box-shadow: 0 4px 16px rgba(220,38,38,0.4);
        }
        #mark-finished-confirm-modal .mf-btn-confirm:disabled {
          opacity: 0.45; cursor: not-allowed; transform: none; box-shadow: none;
        }
      </style>
      <div class="mf-box">
        <div class="mf-icon">🔒</div>
        <h2>Mark Event as Finished?</h2>
        <p class="mf-sub">You are about to permanently close this event.</p>
        <div class="mf-warn">
          <span style="font-size:1.1rem; flex-shrink:0;">⚠️</span>
          <span>Once marked as finished, attendance tracking will be <strong>locked forever</strong>. This action <strong>cannot be undone</strong>.</span>
        </div>
        <div class="mf-bar-wrap">
          <div class="mf-bar" id="mf-bar"></div>
        </div>
        <p class="mf-cd-text" id="mf-cd-text">Please wait <strong id="mf-secs">3</strong> second(s) before confirming…</p>
        <div class="mf-btn-row">
          <button class="mf-btn-cancel" id="mf-cancel">
            <i class="fas fa-times mr-2"></i>Cancel
          </button>
          <button class="mf-btn-confirm" id="mf-confirm" disabled>
            <i class="fas fa-flag-checkered mr-2"></i>Yes, Mark as Finished
          </button>
        </div>
      </div>
    `;

    document.body.appendChild(modal);

    const bar = document.getElementById("mf-bar");
    const secsEl = document.getElementById("mf-secs");
    const cdText = document.getElementById("mf-cd-text");
    const btnOk = document.getElementById("mf-confirm");
    const btnNo = document.getElementById("mf-cancel");

    let secs = 3;

    const tick = setInterval(() => {
      secs--;
      if (secsEl) secsEl.textContent = secs;
      bar.style.width = (secs / 3) * 100 + "%";

      if (secs <= 0) {
        clearInterval(tick);
        btnOk.disabled = false;
        cdText.innerHTML = `<span style="color:#4ade80;font-weight:700;"><i class="fas fa-check-circle mr-1"></i>You can now confirm.</span>`;
        bar.style.transition = "none";
        bar.style.width = "100%";
        bar.style.background = "linear-gradient(90deg, #16a34a, #4ade80)";
      }
    }, 1000);

    btnOk.addEventListener("click", () => {
      clearInterval(tick);
      modal.remove();
      resolve(true);
    });
    btnNo.addEventListener("click", () => {
      clearInterval(tick);
      modal.remove();
      resolve(false);
    });

    modal.addEventListener("click", (e) => {
      if (e.target === modal) {
        clearInterval(tick);
        modal.remove();
        resolve(false);
      }
    });
  });
}

function showErrorNotification(message) {
  const n = document.createElement("div");
  n.style.cssText = `
    position:fixed; top:20px; right:20px; z-index:99999;
    background: linear-gradient(135deg,#dc2626,#991b1b);
    color:#fff; padding:14px 20px; border-radius:12px;
    box-shadow: 0 8px 24px rgba(220,38,38,0.4);
    font-weight:600; display:flex; align-items:center; gap:10px;
    max-width:360px; font-size:0.9rem;
  `;
  n.innerHTML = `<i class="fas fa-exclamation-circle text-xl"></i><span>${message}</span>`;
  document.body.appendChild(n);
  setTimeout(() => {
    n.style.transition = "opacity 0.4s";
    n.style.opacity = "0";
    setTimeout(() => n.remove(), 400);
  }, 4000);
}

function canEdit() {
  const sessionUser = sessionStorage.getItem("churchUser");
  if (!sessionUser) return false;

  try {
    const user = JSON.parse(sessionUser);
    return user.role === "admin" || user.role === "superadmin";
  } catch {
    return false;
  }
}

function escapeHtml(text) {
  if (!text) return "";
  const div = document.createElement("div");
  div.textContent = text;
  return div.innerHTML;
}

function formatDateTime(dateTimeString) {
  const date = new Date(dateTimeString);
  const timeOptions = {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  };
  const dateOptions = {
    month: "short",
    day: "numeric",
    year: "numeric",
  };

  const time = date.toLocaleTimeString("en-US", timeOptions);
  const dateStr = date.toLocaleDateString("en-US", dateOptions);

  return `${dateStr} at ${time}`;
}

async function removeParticipant(participantId, eventId, event) {
  event.stopPropagation();

  if (
    !confirm("Are you sure you want to remove this participant from the event?")
  ) {
    return;
  }

  const formData = new FormData();
  formData.append("action", "remove_participant");
  formData.append("participant_id", participantId);

  try {
    const response = await fetch("event_participants_process.php", {
      method: "POST",
      body: formData,
    });

    const data = await response.json();

    if (data.status === "success") {
      alert("✅ Participant removed successfully!");
      closeAttendanceModal();
      setTimeout(() => {
        const evt = calendarEvents.find((e) => e.id === eventId);
        if (evt) {
          openAttendanceLogModal(eventId, new Event("click"));
        }
      }, 300);
    } else {
      alert("Error: " + data.message);
    }
  } catch (error) {
    console.error("Error removing participant:", error);
    alert("Failed to remove participant. Please try again.");
  }
}

function exportAttendancePDF(eventId) {
  const notification = document.createElement("div");
  notification.className =
    "fixed top-4 right-4 bg-blue-500 text-white px-6 py-4 rounded-lg shadow-lg z-50 animate-slide-in";
  notification.innerHTML = `
    <div class="flex items-center gap-3">
      <i class="fas fa-spinner fa-spin text-2xl"></i>
      <span class="font-semibold">Generating PDF report...</span>
    </div>
  `;
  document.body.appendChild(notification);

  const pdfUrl = `export_attendance_pdf.php?event_id=${eventId}`;
  window.open(pdfUrl, "_blank");

  setTimeout(() => {
    notification.style.animation = "slideOut 0.3s ease-in";
    setTimeout(() => notification.remove(), 300);
  }, 2000);
}

function showSuccessNotification(message) {
  const notification = document.createElement("div");
  notification.className =
    "fixed top-4 right-4 bg-green-500 text-white px-6 py-4 rounded-lg shadow-lg z-50 animate-slide-in";
  notification.innerHTML = `
    <div class="flex items-center gap-3">
      <i class="fas fa-check-circle text-2xl"></i>
      <span class="font-semibold">${message}</span>
    </div>
  `;

  document.body.appendChild(notification);

  setTimeout(() => {
    notification.style.animation = "slideOut 0.3s ease-in";
    setTimeout(() => notification.remove(), 300);
  }, 3000);
}

// Close autocomplete when clicking outside
document.addEventListener("click", function (event) {
  const searchInput = document.getElementById("participant-search-manual");
  const resultsDiv = document.getElementById("autocomplete-results-manual");

  if (
    searchInput &&
    resultsDiv &&
    !searchInput.contains(event.target) &&
    !resultsDiv.contains(event.target)
  ) {
    resultsDiv.classList.add("hidden");
  }
});

// Initialize calendar on page load
document.addEventListener("DOMContentLoaded", function () {
  if (document.getElementById("calendar-tab")) {
    loadCalendarEvents();
  }
});

// Cleanup camera on page unload
window.addEventListener("beforeunload", () => {
  stopCamera();
});
