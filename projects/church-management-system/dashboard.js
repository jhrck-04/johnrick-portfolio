let currentUser = null;
let editingItem = null;
let editingType = null;
let attendanceLogs = []; // QR & Attendance System

// ADD THIS NEW FUNCTION - Put it right after your variable declarations
async function loadUserProfileFromDatabase() {
  try {
    const response = await fetch("profile_handler.php", {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });

    const result = await response.json();

    if (result.status === "success") {
      const userData = result.data;

      // Update currentUser with ALL data from database
      currentUser.firstName = userData.first_name || "";
      currentUser.middleName = userData.middle_name || "";
      currentUser.lastName = userData.last_name || "";
      currentUser.name = userData.name || "";
      currentUser.email = userData.email || "";
      currentUser.profilePicture = userData.profile_picture || null; // KEY FIX!
      currentUser.accountNumber = userData.account_number || "";
      currentUser.account_number = userData.account_number || "";
      currentUser.dateOfBirth = userData.date_of_birth || "";
      currentUser.gender = userData.gender || "";
      currentUser.maritalStatus = userData.marital_status || "";
      currentUser.occupation = userData.occupation || "";
      currentUser.skills = userData.skills || "";
      currentUser.phoneNumber = userData.phone_number || "";
      currentUser.address = userData.address || "";
      currentUser.city = userData.city || "";
      currentUser.zipCode = userData.zip_code || "";
      currentUser.emergencyContact = userData.emergency_contact_name || "";
      currentUser.emergencyPhone = userData.emergency_contact_phone || "";
      currentUser.department = userData.department || "";
      currentUser.membershipDate = userData.membership_date || "";
      currentUser.baptismDate = userData.baptism_date || "";
      currentUser.bio = userData.bio || "";

      // Update session storage with latest data
      sessionStorage.setItem("churchUser", JSON.stringify(currentUser));

      // Update UI to show profile picture
      updateProfileDisplay();

      console.log("✅ Profile loaded from database");
      console.log(
        "📸 Profile picture:",
        currentUser.profilePicture ? "EXISTS" : "NONE",
      );
    }
  } catch (error) {
    console.error("Error loading profile from database:", error);
  }
}

let members = [];

// Load members from database
async function loadMembersFromDatabase() {
  try {
    // Show loading indicator
    const membersGrid = document.getElementById("members-grid");
    if (membersGrid) {
      const isFirstLoad = membersGrid.innerHTML === "";
      if (isFirstLoad) {
        membersGrid.innerHTML =
          '<div class="col-span-full text-center py-8"><i class="fas fa-spinner fa-spin text-4xl text-blue-600"></i><p class="mt-4 text-gray-600">Loading members...</p></div>';
      }
    }

    const response = await fetch("members_handler.php", {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });

    const result = await response.json();

    if (result.status === "success") {
      members = result.data;
      renderMembers();
      updateDashboard();
      console.log("✅ Members loaded from database");
    } else {
      console.error("Failed to load members:", result.message);
    }
  } catch (error) {
    console.error("Error loading members:", error);
  }
}

// ========================================
// HEARTBEAT SYSTEM - ADD THIS HERE
// ========================================
let heartbeatInterval;

function startHeartbeat() {
  sendHeartbeat();
  heartbeatInterval = setInterval(() => sendHeartbeat(), 120000);
}

function stopHeartbeat() {
  if (heartbeatInterval) clearInterval(heartbeatInterval);
}

async function sendHeartbeat() {
  try {
    const response = await fetch("heartbeat.php", { method: "POST" });
    const result = await response.json();
    if (result.status === "success") {
      console.log("✅ Heartbeat:", result.timestamp);
    }
  } catch (error) {
    console.error("Heartbeat error:", error);
  }
}

let statsRefreshInterval;

function startStatsAutoRefresh() {
  statsRefreshInterval = setInterval(() => {
    loadDashboardStats();
    loadRecentActivity();
  }, 30000);
}

function stopStatsAutoRefresh() {
  if (statsRefreshInterval) clearInterval(statsRefreshInterval);
}

// Add this NEW function after loadMembersFromDatabase()
async function loadDashboardStats() {
  try {
    const response = await fetch("dashboard_stats.php", {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });

    const result = await response.json();

    if (result.status === "success") {
      // Update Total Members
      const totalMembersElement = document.getElementById("total-members");
      if (totalMembersElement) {
        totalMembersElement.textContent = result.data.totalMembers;
      }

      // Update Upcoming Events
      const totalEventsElement = document.getElementById("total-events-dash");
      if (totalEventsElement) {
        totalEventsElement.textContent = result.data.upcomingEvents;
      }

      // Update Online Users
      const onlineUsersElement = document.getElementById("total-online-users");
      if (onlineUsersElement) {
        onlineUsersElement.textContent = result.data.onlineUsers || 0;
      }

      // Update next event text
      const nextEventText = document.querySelector(
        "#dashboard-tab .stats-card:nth-child(3) .text-xs.text-gray-500",
      );
      if (nextEventText && result.data.nextEvent) {
        nextEventText.innerHTML = `<i class="fas fa-calendar-check"></i> Next: ${result.data.nextEvent}`;
      }

      console.log("✅ Dashboard stats loaded from database");
    }
  } catch (error) {
    console.error("Error loading dashboard stats:", error);
  }
}

// ── Recent Activity Widget ────────────────────────────────────────────────────

async function loadRecentActivity() {
  const container = document.getElementById("recent-activity-list");
  if (!container) return;

  try {
    const res = await fetch("fetch_recent_activity.php");
    const data = await res.json();

    if (data.status !== "success" || !data.activities.length) {
      container.innerHTML = `
        <div class="flex flex-col items-center justify-center py-8 text-gray-400">
          <i class="fas fa-inbox text-3xl mb-2"></i>
          <p class="text-sm">No recent activity yet</p>
        </div>`;
      return;
    }

    container.innerHTML = data.activities
      .map((act) => {
        const cfg = getActivityConfig(act.action);
        const timeAgo = formatTimeAgo(act.timestamp);
        return `
        <div class="activity-item flex items-start gap-3">
          <div class="activity-icon ${cfg.bg} p-2 rounded-full flex-shrink-0">
            <i class="${cfg.icon} ${cfg.color}"></i>
          </div>
          <div class="flex-1 min-w-0">
            <p class="text-sm font-semibold truncate">${escapeHtml(cfg.label)}</p>
            <p class="text-xs text-gray-500 truncate">${escapeHtml(act.details)}</p>
            <p class="text-xs text-gray-400">${timeAgo} · ${escapeHtml(act.full_name)}</p>
          </div>
        </div>`;
      })
      .join('<hr class="border-gray-100">');
  } catch (err) {
    console.error("loadRecentActivity error:", err);
    container.innerHTML = `
      <div class="text-center py-6 text-red-400 text-sm">
        <i class="fas fa-exclamation-circle mr-1"></i>Failed to load activity
      </div>`;
  }
}

function getActivityConfig(action) {
  const map = {
    CREATE: {
      bg: "bg-green-100",
      icon: "fas fa-plus-circle",
      color: "text-green-600",
      label: "New record created",
    },
    UPDATE: {
      bg: "bg-blue-100",
      icon: "fas fa-edit",
      color: "text-blue-600",
      label: "Record updated",
    },
    DELETE: {
      bg: "bg-red-100",
      icon: "fas fa-trash",
      color: "text-red-600",
      label: "Record deleted",
    },
    LOGIN: {
      bg: "bg-purple-100",
      icon: "fas fa-sign-in-alt",
      color: "text-purple-600",
      label: "User logged in",
    },
    LOGOUT: {
      bg: "bg-gray-100",
      icon: "fas fa-sign-out-alt",
      color: "text-gray-500",
      label: "User logged out",
    },
    EXPORT: {
      bg: "bg-yellow-100",
      icon: "fas fa-file-export",
      color: "text-yellow-600",
      label: "Data exported",
    },
    MARK_FINISHED: {
      bg: "bg-teal-100",
      icon: "fas fa-check-circle",
      color: "text-teal-600",
      label: "Event marked finished",
    },
    ADD_PARTICIPANT: {
      bg: "bg-indigo-100",
      icon: "fas fa-user-plus",
      color: "text-indigo-600",
      label: "Participant added",
    },
    REMOVE_PARTICIPANT: {
      bg: "bg-orange-100",
      icon: "fas fa-user-minus",
      color: "text-orange-600",
      label: "Participant removed",
    },
  };
  return (
    map[action] || {
      bg: "bg-gray-100",
      icon: "fas fa-info-circle",
      color: "text-gray-500",
      label: action,
    }
  );
}

function formatTimeAgo(timestamp) {
  if (!timestamp) return "";
  const diff = Math.floor((Date.now() - new Date(timestamp).getTime()) / 1000);
  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  if (diff < 2592000) return `${Math.floor(diff / 86400)}d ago`;
  return new Date(timestamp).toLocaleDateString();
}

function escapeHtml(str) {
  return String(str ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

// ─────────────────────────────────────────────────────────────────────────────

// Save member to database
async function saveMemberToDatabase(data) {
  try {
    const response = await fetch("members_handler.php", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });

    const result = await response.json();

    if (result.status === "success") {
      await loadMembersFromDatabase();
      closeModal();
      showSuccessMessage(
        editingItem
          ? "Member updated successfully"
          : "Member added successfully",
      );
      const memberAction = editingItem ? "UPDATE" : "CREATE";
      const memberLabel = editingItem
        ? "Updated member info"
        : "Added new member";
      AuditLogger.log(memberAction, "Members", memberLabel + ": " + data.name);
    } else {
      alert("Failed to save member: " + result.message);
    }
  } catch (error) {
    console.error("Error saving member:", error);
    alert("Failed to save member");
  }
}

let donations = [
  {
    id: 1,
    donor: "John Smith",
    amount: 500,
    date: "2024-12-01",
    type: "Tithe",
    method: "Cash",
  },
  {
    id: 2,
    donor: "Mary Johnson",
    amount: 200,
    date: "2024-12-05",
    type: "Offering",
    method: "Check",
  },
  {
    id: 3,
    donor: "Robert Williams",
    amount: 1000,
    date: "2024-12-08",
    type: "Building Fund",
    method: "Online",
  },
];

let users = []; // Populated from database via loadUsersFromDatabase()

// Sort state for user table
let userSortField = "";
let userSortAsc = true;

// Add this to your dashboard.js file

// Add user profile data to currentUser object
function initializeUserProfile() {
  if (!currentUser.profilePicture) {
    currentUser.profilePicture = null; // Will store base64 image data
  }
  if (!currentUser.bio) {
    currentUser.bio = "";
  }
  if (!currentUser.department) {
    currentUser.department = "";
  }
  if (!currentUser.phoneNumber) {
    currentUser.phoneNumber = "";
  }
  if (!currentUser.email) {
    currentUser.email = "";
  }
  if (!currentUser.address) {
    currentUser.address = "";
  }
  if (!currentUser.city) {
    currentUser.city = "";
  }
  if (!currentUser.zipCode) {
    currentUser.zipCode = "";
  }
  if (!currentUser.dateOfBirth) {
    currentUser.dateOfBirth = "";
  }
  if (!currentUser.gender) {
    currentUser.gender = "";
  }
  if (!currentUser.maritalStatus) {
    currentUser.maritalStatus = "";
  }
  if (!currentUser.baptismDate) {
    currentUser.baptismDate = "";
  }
  if (!currentUser.membershipDate) {
    currentUser.membershipDate = "";
  }
  if (!currentUser.emergencyContact) {
    currentUser.emergencyContact = "";
  }
  if (!currentUser.emergencyPhone) {
    currentUser.emergencyPhone = "";
  }
  if (!currentUser.occupation) {
    currentUser.occupation = "";
  }
  if (!currentUser.skills) {
    currentUser.skills = "";
  }
}

// Function to open profile edit modal
// Replace your existing openProfileModal() function with this:
async function openProfileModal() {
  // Show loading state
  showLoadingModal();

  try {
    // Fetch user profile data from database
    const response = await fetch("profile_handler.php", {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });

    const result = await response.json();

    if (result.status === "success") {
      const userData = result.data;

      // Update currentUser with fetched data
      currentUser.firstName = userData.first_name || "";
      currentUser.middleName = userData.middle_name || "";
      currentUser.lastName = userData.last_name || "";
      currentUser.name = userData.name || "";
      currentUser.email = userData.email || "";
      currentUser.dateOfBirth = userData.date_of_birth || "";
      currentUser.gender = userData.gender || "";
      currentUser.maritalStatus = userData.marital_status || "";
      currentUser.occupation = userData.occupation || "";
      currentUser.skills = userData.skills || "";
      currentUser.phoneNumber = userData.phone_number || "";
      currentUser.address = userData.address || "";
      currentUser.city = userData.city || "";
      currentUser.zipCode = userData.zip_code || "";
      currentUser.emergencyContact = userData.emergency_contact_name || "";
      currentUser.emergencyPhone = userData.emergency_contact_phone || "";
      currentUser.department = userData.department || "";
      currentUser.membershipDate = userData.membership_date || "";
      currentUser.baptismDate = userData.baptism_date || "";
      currentUser.bio = userData.bio || "";
      currentUser.profilePicture = userData.profile_picture || null;

      // Now show the modal with data
      displayProfileModal();
    } else {
      alert("Failed to load profile: " + result.message);
    }
  } catch (error) {
    console.error("Error loading profile:", error);
    alert("Failed to load profile data");
  }
}

// ADD THESE TWO NEW HELPER FUNCTIONS RIGHT AFTER openProfileModal():
function showLoadingModal() {
  const loadingModal = `
    <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div class="bg-white rounded-2xl shadow-2xl p-8 text-center">
        <div class="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p class="text-gray-600 font-semibold">Loading profile...</p>
      </div>
    </div>
  `;
  document.getElementById("modal-container").innerHTML = loadingModal;
}

function displayProfileModal() {
  const profileForm = `
    <div class="space-y-6">
      <!-- Profile Picture Section -->
      <div class="text-center mb-6">
        <div class="relative inline-block">
          <div id="profile-preview" class="bg-gradient-to-br from-blue-600 to-blue-800 w-32 h-32 rounded-full flex items-center justify-center text-white font-bold text-4xl mx-auto mb-4 overflow-hidden">
            ${
              currentUser.profilePicture
                ? `<img src="${currentUser.profilePicture}" alt="Profile" class="w-full h-full object-cover">`
                : currentUser.name
                    .split(" ")
                    .map((n) => n[0])
                    .join("")
                    .toUpperCase()
            }
          </div>
          <label for="profile-picture-input" class="absolute bottom-0 right-0 bg-blue-600 text-white p-3 rounded-full cursor-pointer hover:bg-blue-700 transition shadow-lg">
            <i class="fas fa-camera"></i>
            <input type="file" id="profile-picture-input" accept="image/*" class="hidden" onchange="handleProfilePictureChange(event)">
          </label>
        </div>
        <p class="text-sm text-gray-500 mt-2">Click camera icon to change photo</p>
      </div>

      <!-- Personal Information Section -->
      <div class="bg-blue-50 p-4 rounded-lg">
        <h4 class="font-bold text-lg text-blue-900 mb-4 flex items-center gap-2">
          <i class="fas fa-user"></i>
          Personal Information
        </h4>
        
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">First Name *</label>
            <input type="text" id="profile-first-name" value="${
              currentUser.firstName || ""
            }" 
              placeholder="First Name"
              class="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">Middle Name</label>
            <input type="text" id="profile-middle-name" value="${
              currentUser.middleName || ""
            }" 
              placeholder="Middle Name"
              class="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">Last Name *</label>
            <input type="text" id="profile-last-name" value="${
              currentUser.lastName || ""
            }" 
              placeholder="Last Name"
              class="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
          </div>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">Date of Birth</label>
            <input type="date" id="profile-dob" value="${
              currentUser.dateOfBirth || ""
            }" 
              class="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">Gender</label>
            <select id="profile-gender" class="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option value="">Select Gender</option>
              <option ${
                currentUser.gender === "Male" ? "selected" : ""
              }>Male</option>
              <option ${
                currentUser.gender === "Female" ? "selected" : ""
              }>Female</option>
            </select>
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">Marital Status</label>
            <select id="profile-marital" class="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option value="">Select Status</option>
              <option ${
                currentUser.maritalStatus === "Single" ? "selected" : ""
              }>Single</option>
              <option ${
                currentUser.maritalStatus === "Married" ? "selected" : ""
              }>Married</option>
              <option ${
                currentUser.maritalStatus === "Widowed" ? "selected" : ""
              }>Widowed</option>
            </select>
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">Occupation</label>
            <input type="text" id="profile-occupation" value="${
              currentUser.occupation || ""
            }" 
              placeholder="e.g., Teacher, Engineer"
              class="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
          </div>
        </div>

        <div class="mt-4">
          <label class="block text-sm font-medium text-gray-700 mb-2">Skills/Talents</label>
          <input type="text" id="profile-skills" value="${
            currentUser.skills || ""
          }" 
            placeholder="e.g., Music, Teaching, Tech"
            class="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
        </div>
      </div>

      <!-- Contact Information Section -->
      <div class="bg-green-50 p-4 rounded-lg">
        <h4 class="font-bold text-lg text-green-900 mb-4 flex items-center gap-2">
          <i class="fas fa-address-book"></i>
          Contact Information
        </h4>
        
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">Email</label>
            <input type="email" id="profile-email" value="${
              currentUser.email || ""
            }" 
              placeholder="your.email@example.com"
              class="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">Phone Number</label>
            <input type="tel" id="profile-phone" value="${
              currentUser.phoneNumber || ""
            }" 
              placeholder="123-456-7890"
              class="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
          </div>

          <div class="md:col-span-2">
            <label class="block text-sm font-medium text-gray-700 mb-2">Home Address</label>
            <input type="text" id="profile-address" value="${
              currentUser.address || ""
            }" 
              placeholder="Street Address"
              class="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">City</label>
            <input type="text" id="profile-city" value="${
              currentUser.city || ""
            }" 
              placeholder="City"
              class="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">Zip Code</label>
            <input type="text" id="profile-zip" value="${
              currentUser.zipCode || ""
            }" 
              placeholder="12345"
              class="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
          </div>
        </div>
      </div>

      <!-- Emergency Contact Section -->
      <div class="bg-red-50 p-4 rounded-lg">
        <h4 class="font-bold text-lg text-red-900 mb-4 flex items-center gap-2">
          <i class="fas fa-phone-alt"></i>
          Emergency Contact
        </h4>
        
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">Contact Name</label>
            <input type="text" id="profile-emergency-contact" value="${
              currentUser.emergencyContact || ""
            }" 
              placeholder="Full Name"
              class="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">Contact Phone</label>
            <input type="tel" id="profile-emergency-phone" value="${
              currentUser.emergencyPhone || ""
            }" 
              placeholder="123-456-7890"
              class="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
          </div>
        </div>
      </div>

      <!-- Church Information Section -->
      <div class="bg-purple-50 p-4 rounded-lg">
        <h4 class="font-bold text-lg text-purple-900 mb-4 flex items-center gap-2">
          <i class="fas fa-church"></i>
          Church Information
        </h4>
        
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">Department/Ministry</label>
            <select id="profile-department" class="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option value="">Select Department</option>
              <option ${
                currentUser.department === "Administration" ? "selected" : ""
              }>Administration</option>
              <option ${
                currentUser.department === "Worship" ? "selected" : ""
              }>Worship</option>
              <option ${
                currentUser.department === "Youth" ? "selected" : ""
              }>Youth</option>
              <option ${
                currentUser.department === "Prayer" ? "selected" : ""
              }>Prayer</option>
              <option ${
                currentUser.department === "Outreach" ? "selected" : ""
              }>Outreach</option>
              <option ${
                currentUser.department === "Children" ? "selected" : ""
              }>Children</option>
              <option ${
                currentUser.department === "Media" ? "selected" : ""
              }>Media</option>
              <option ${
                currentUser.department === "Finance" ? "selected" : ""
              }>Finance</option>
            </select>
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">Membership Date</label>
            <input type="date" id="profile-membership" value="${
              currentUser.membershipDate || ""
            }" 
              class="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">Baptism Date</label>
            <input type="date" id="profile-baptism" value="${
              currentUser.baptismDate || ""
            }" 
              class="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">Role</label>
            <div class="w-full px-4 py-3 bg-gray-100 border-2 border-gray-200 rounded-lg text-gray-600">
              ${currentUser.role.toUpperCase()}
              <span class="text-xs ml-2">(Contact admin to change)</span>
            </div>
          </div>
        </div>
      </div>

      <!-- About Me Section -->
      <div class="bg-yellow-50 p-4 rounded-lg">
        <h4 class="font-bold text-lg text-yellow-900 mb-4 flex items-center gap-2">
          <i class="fas fa-comment-alt"></i>
          About Me
        </h4>
        
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">Bio</label>
          <textarea id="profile-bio" rows="4" 
            class="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Tell us about yourself, your testimony, interests, and how you'd like to serve in the church...">${
              currentUser.bio || ""
            }</textarea>
        </div>
      </div>

      <!-- My QR Code Section (NEW) -->
      <div class="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-xl p-5 border border-indigo-200">
        <div class="flex items-center justify-between mb-3">
          <h4 class="font-bold text-indigo-900 flex items-center gap-2">
            <i class="fas fa-qrcode"></i>
            My QR Code
          </h4>
          <button type="button" onclick="toggleProfileQR()" id="profile-qr-toggle-btn"
            class="text-xs bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-1.5 rounded-lg transition flex items-center gap-1">
            <i class="fas fa-eye" id="profile-qr-toggle-icon"></i>
            <span id="profile-qr-toggle-label">Show QR</span>
          </button>
        </div>
        <p class="text-sm text-indigo-700 mb-3">Use this QR code to check in at church events.</p>
        
        <div id="profile-qr-container" class="hidden text-center">
          <div class="bg-white rounded-lg p-4 inline-block shadow-md border-2 border-indigo-200">
            <img id="profile-qr-code" src="" alt="My QR Code" style="width: 250px; height: 250px; display: none; margin: 0 auto; border: 2px solid #000; border-radius: 8px;">
          </div>
          <button type="button" onclick="downloadProfileQR()" class="mt-3 flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-xs font-semibold transition shadow-sm mx-auto">
            <i class="fas fa-download"></i> Download QR
          </button>
        </div>
      </div>
    </div>
  `;

  const modal = `
    <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" onclick="closeProfileModal(event)">
      <div class="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto" onclick="event.stopPropagation()">
        <div class="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center z-10">
          <h3 class="text-2xl font-bold">
            <i class="fas fa-user-edit text-blue-600 mr-2"></i>
            Edit Profile
          </h3>
          <button onclick="closeProfileModal()" class="text-gray-400 hover:text-gray-600 text-2xl">
            <i class="fas fa-times"></i>
          </button>
        </div>
        
        <div class="p-6">
          ${profileForm}
        </div>

        <div class="sticky bottom-0 bg-gray-50 px-6 py-4 flex gap-3 border-t border-gray-200">
          <button onclick="saveProfile()" class="flex-1 bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 font-semibold transition">
            <i class="fas fa-save mr-2"></i>Save Changes
          </button>
          <button onclick="closeProfileModal()" class="flex-1 bg-gray-300 text-gray-700 py-3 rounded-lg hover:bg-gray-400 font-semibold transition">
            Cancel
          </button>
        </div>
      </div>
    </div>
  `;

  document.getElementById("modal-container").innerHTML = modal;
}

// Handle profile picture change
function handleProfilePictureChange(event) {
  const file = event.target.files[0];
  if (!file) return;

  // Check file size (limit to 2MB)
  if (file.size > 2 * 1024 * 1024) {
    alert("Image size should be less than 2MB");
    event.target.value = "";
    return;
  }

  // Check file type
  if (!file.type.startsWith("image/")) {
    alert("Please select an image file (PNG, JPG, JPEG, GIF)");
    event.target.value = "";
    return;
  }

  // Store the actual file object for upload
  window.tempProfilePictureFile = file;

  // Create preview
  const reader = new FileReader();
  reader.onload = function (e) {
    const preview = document.getElementById("profile-preview");
    if (preview) {
      preview.innerHTML = `<img src="${e.target.result}" alt="Profile" class="w-full h-full object-cover rounded-full">`;
    }
  };

  reader.onerror = function () {
    alert("Error reading file. Please try again.");
    event.target.value = "";
  };

  reader.readAsDataURL(file);
}

// Save profile changes
async function saveProfile() {
  // Get form values - Split name into parts
  const firstName = document.getElementById("profile-first-name").value.trim();
  const middleName = document
    .getElementById("profile-middle-name")
    .value.trim();
  const lastName = document.getElementById("profile-last-name").value.trim();

  // Other Personal Information
  const dob = document.getElementById("profile-dob").value;
  const gender = document.getElementById("profile-gender").value;
  const maritalStatus = document.getElementById("profile-marital").value;
  const occupation = document.getElementById("profile-occupation").value.trim();
  const skills = document.getElementById("profile-skills").value.trim();

  // Contact Information
  const email = document.getElementById("profile-email").value.trim();
  const phone = document.getElementById("profile-phone").value.trim();
  const address = document.getElementById("profile-address").value.trim();
  const city = document.getElementById("profile-city").value.trim();
  const zipCode = document.getElementById("profile-zip").value.trim();

  // Emergency Contact
  const emergencyContact = document
    .getElementById("profile-emergency-contact")
    .value.trim();
  const emergencyPhone = document
    .getElementById("profile-emergency-phone")
    .value.trim();

  // Church Information
  const department = document.getElementById("profile-department").value;
  const membershipDate = document.getElementById("profile-membership").value;
  const baptismDate = document.getElementById("profile-baptism").value;

  // About Me
  const bio = document.getElementById("profile-bio").value.trim();

  // Validation
  if (!firstName || !lastName) {
    alert("First Name and Last Name are required");
    return;
  }

  if (email && !isValidEmail(email)) {
    alert("Please enter a valid email address");
    return;
  }

  // Combine names for display
  const fullName = `${firstName} ${middleName} ${lastName}`
    .replace(/\s+/g, " ")
    .trim();

  // Prepare data object
  // Show loading state first
  const saveBtn = document.querySelector('button[onclick="saveProfile()"]');
  if (saveBtn) {
    saveBtn.disabled = true;
    saveBtn.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>Saving...';
  }

  try {
    // Upload profile picture first if there's a new one
    let profilePicturePath =
      currentUser.profilePicture || currentUser.profile_picture || null;

    if (window.tempProfilePictureFile) {
      console.log("📤 Uploading new profile picture...");

      const formData = new FormData();
      formData.append("profilePicture", window.tempProfilePictureFile);

      const uploadResponse = await fetch("upload_profile_picture.php", {
        method: "POST",
        body: formData,
      });

      const uploadResult = await uploadResponse.json();
      console.log("📸 Upload result:", uploadResult);

      if (uploadResult.status === "success") {
        profilePicturePath = uploadResult.filePath;
        console.log("✅ Picture uploaded to:", profilePicturePath);
      } else {
        alert("Failed to upload profile picture: " + uploadResult.message);
        if (saveBtn) {
          saveBtn.disabled = false;
          saveBtn.innerHTML = '<i class="fas fa-save mr-2"></i>Save Changes';
        }
        return;
      }
    }

    // Prepare data object
    const profileData = {
      name: fullName,
      firstName: firstName,
      middleName: middleName,
      lastName: lastName,
      dateOfBirth: dob,
      gender: gender,
      maritalStatus: maritalStatus,
      occupation: occupation,
      skills: skills,
      email: email,
      phoneNumber: phone,
      address: address,
      city: city,
      zipCode: zipCode,
      emergencyContact: emergencyContact,
      emergencyPhone: emergencyPhone,
      department: department,
      membershipDate: membershipDate,
      baptismDate: baptismDate,
      bio: bio,
      profilePicture: profilePicturePath,
    };

    // Send profile data to server
    const response = await fetch("profile_handler.php", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(profileData),
    });

    const result = await response.json();

    if (result.status === "success") {
      console.log("✅ Profile saved successfully");
      console.log(
        "📸 Profile picture from server:",
        result.data.profile_picture ? "EXISTS" : "MISSING",
      );
      console.log("🔍 Full server response:", result.data);

      // Update currentUser with data from server response
      currentUser.name =
        result.data.first_name +
        " " +
        (result.data.middle_name ? result.data.middle_name + " " : "") +
        result.data.last_name;
      currentUser.firstName = result.data.first_name;
      currentUser.middleName = result.data.middle_name || "";
      currentUser.lastName = result.data.last_name;
      currentUser.email = result.data.email;
      currentUser.profilePicture = result.data.profile_picture;

      // Update other fields
      Object.assign(currentUser, {
        dateOfBirth: result.data.date_of_birth,
        gender: result.data.gender,
        maritalStatus: result.data.marital_status,
        occupation: result.data.occupation,
        skills: result.data.skills,
        phoneNumber: result.data.phone_number,
        address: result.data.address,
        city: result.data.city,
        zipCode: result.data.zip_code,
        emergencyContact: result.data.emergency_contact_name,
        emergencyPhone: result.data.emergency_contact_phone,
        department: result.data.department,
        membershipDate: result.data.membership_date,
        baptismDate: result.data.baptism_date,
        bio: result.data.bio,
      });

      // Clear temp profile picture file
      delete window.tempProfilePictureFile;

      // Update session storage
      // Update session storage with the latest data
      sessionStorage.setItem("churchUser", JSON.stringify(currentUser));

      // IMPORTANT: Also update the global currentUser reference
      window.currentUser = currentUser;

      // Update UI
      updateProfileDisplay();

      // Close modal
      closeProfileModal();

      // Show success message
      showSuccessMessage("Profile updated successfully!");
    } else {
      alert("Failed to save profile: " + result.message);
      if (saveBtn) {
        saveBtn.disabled = false;
        saveBtn.innerHTML = '<i class="fas fa-save mr-2"></i>Save Changes';
      }
    }
  } catch (error) {
    console.error("Error saving profile:", error);
    alert("Failed to save profile. Please try again.");
    const saveBtn = document.querySelector('button[onclick="saveProfile()"]');
    if (saveBtn) {
      saveBtn.disabled = false;
      saveBtn.innerHTML = '<i class="fas fa-save mr-2"></i>Save Changes';
    }
  }
}

// Email validation helper
function isValidEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

// Close profile modal
function closeProfileModal(event) {
  if (!event || event.target === event.currentTarget) {
    document.getElementById("modal-container").innerHTML = "";
    delete window.tempProfilePicture;
  }
}

// Update profile display in UI
// Update profile display in UI
function updateProfileDisplay() {
  // Update sidebar profile
  document.getElementById("user-name").textContent = currentUser.name;
  document.getElementById("user-role").textContent =
    currentUser.role.toUpperCase();

  // Update dashboard profile
  document.getElementById("dashboard-user-name").textContent = currentUser.name;
  document.getElementById("dashboard-user-role").textContent =
    currentUser.role.toUpperCase();

  // Update avatars
  const initials = currentUser.name
    .split(" ")
    .filter((n) => n) // Remove empty strings
    .map((n) => n[0])
    .join("")
    .toUpperCase();

  const avatarElements = [
    document.getElementById("user-avatar"),
    document.getElementById("dashboard-user-avatar"),
  ];

  avatarElements.forEach((element) => {
    if (element) {
      // Handle both profilePicture and profile_picture (from database)
      const picUrl = currentUser.profilePicture || currentUser.profile_picture;

      if (picUrl) {
        // Use profile picture
        element.innerHTML = `<img src="${picUrl}" alt="Profile" class="w-full h-full object-cover rounded-full">`;
      } else {
        // Use initials - clear any existing content first
        element.innerHTML = "";
        element.textContent = initials;
      }
    }
  });
}

function loadProfilePicture() {
  if (!currentUser) return;

  // Handle both naming conventions
  const picUrl = currentUser.profilePicture || currentUser.profile_picture;
  if (!picUrl) return;

  // Update all avatar instances
  const avatarElements = [
    document.getElementById("user-avatar"),
    document.getElementById("dashboard-user-avatar"),
  ];

  avatarElements.forEach((element) => {
    if (element) {
      element.innerHTML = `<img src="${picUrl}" alt="Profile" class="w-full h-full object-cover rounded-full">`;
    }
  });
}

// Show success message
function showSuccessMessage(message) {
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

// ── Custom confirm modal (replaces browser confirm()) ──────────────────────
function showConfirmModal({
  title,
  message,
  subMessage = "",
  confirmText = "Confirm",
  confirmClass = "bg-blue-600 hover:bg-blue-700",
  icon = "fa-question-circle",
  iconClass = "text-blue-500",
  onConfirm,
}) {
  const existing = document.getElementById("custom-confirm-modal");
  if (existing) existing.remove();

  const modal = document.createElement("div");
  modal.id = "custom-confirm-modal";
  modal.className =
    "fixed inset-0 z-[99999] flex items-center justify-center p-4";
  modal.style.cssText =
    "background: rgba(0,0,0,0.55); backdrop-filter: blur(3px);";
  modal.innerHTML = `
    <div id="custom-confirm-box" class="bg-white rounded-2xl shadow-2xl w-full max-w-md transform scale-95 opacity-0 transition-all duration-200" style="transition: transform 0.2s ease, opacity 0.2s ease;">
      <div class="p-7">
        <div class="flex flex-col items-center text-center mb-5">
          <div class="w-16 h-16 rounded-full flex items-center justify-center mb-4 ${iconClass.includes("red") ? "bg-red-100" : iconClass.includes("yellow") ? "bg-yellow-100" : "bg-blue-100"}">
            <i class="fas ${icon} text-3xl ${iconClass}"></i>
          </div>
          <h3 class="text-xl font-bold text-gray-800 mb-1">${title}</h3>
          <p class="text-gray-500 text-sm leading-relaxed">${message}</p>
          ${subMessage ? `<p class="text-gray-400 text-xs mt-2 leading-relaxed">${subMessage}</p>` : ""}
        </div>
        <div class="flex gap-3 mt-2">
          <button id="confirm-cancel-btn" class="flex-1 px-5 py-2.5 rounded-xl border-2 border-gray-200 text-gray-600 font-semibold hover:bg-gray-50 hover:border-gray-300 transition text-sm">
            Cancel
          </button>
          <button id="confirm-ok-btn" class="flex-1 px-5 py-2.5 rounded-xl text-white font-semibold transition text-sm ${confirmClass}">
            <i class="fas fa-check mr-1.5"></i>${confirmText}
          </button>
        </div>
      </div>
    </div>
  `;
  document.body.appendChild(modal);

  // Animate in
  requestAnimationFrame(() => {
    const box = document.getElementById("custom-confirm-box");
    if (box) {
      box.style.transform = "scale(1)";
      box.style.opacity = "1";
    }
  });

  function closeModal() {
    const box = document.getElementById("custom-confirm-box");
    if (box) {
      box.style.transform = "scale(0.95)";
      box.style.opacity = "0";
    }
    setTimeout(() => {
      if (modal.parentElement) modal.remove();
    }, 180);
  }

  document
    .getElementById("confirm-cancel-btn")
    .addEventListener("click", closeModal);
  document.getElementById("confirm-ok-btn").addEventListener("click", () => {
    closeModal();
    if (typeof onConfirm === "function") onConfirm();
  });
  modal.addEventListener("click", (e) => {
    if (e.target === modal) closeModal();
  });
}

// ── Custom alert modal (replaces browser alert()) ─────────────────────────
function showAlertModal({ title, message, type = "error" }) {
  const existing = document.getElementById("custom-alert-modal");
  if (existing) existing.remove();

  const configs = {
    error: {
      icon: "fa-times-circle",
      iconClass: "text-red-500",
      bg: "bg-red-100",
      btn: "bg-red-600 hover:bg-red-700",
    },
    warning: {
      icon: "fa-exclamation-triangle",
      iconClass: "text-yellow-500",
      bg: "bg-yellow-100",
      btn: "bg-yellow-500 hover:bg-yellow-600",
    },
    info: {
      icon: "fa-info-circle",
      iconClass: "text-blue-500",
      bg: "bg-blue-100",
      btn: "bg-blue-600 hover:bg-blue-700",
    },
  };
  const cfg = configs[type] || configs.error;

  const modal = document.createElement("div");
  modal.id = "custom-alert-modal";
  modal.className =
    "fixed inset-0 z-[99999] flex items-center justify-center p-4";
  modal.style.cssText =
    "background: rgba(0,0,0,0.55); backdrop-filter: blur(3px);";
  modal.innerHTML = `
    <div id="custom-alert-box" class="bg-white rounded-2xl shadow-2xl w-full max-w-sm transform scale-95 opacity-0" style="transition: transform 0.2s ease, opacity 0.2s ease;">
      <div class="p-7">
        <div class="flex flex-col items-center text-center mb-5">
          <div class="w-16 h-16 rounded-full ${cfg.bg} flex items-center justify-center mb-4">
            <i class="fas ${cfg.icon} text-3xl ${cfg.iconClass}"></i>
          </div>
          <h3 class="text-xl font-bold text-gray-800 mb-1">${title}</h3>
          <p class="text-gray-500 text-sm leading-relaxed">${message}</p>
        </div>
        <button id="alert-ok-btn" class="w-full px-5 py-2.5 rounded-xl text-white font-semibold transition text-sm ${cfg.btn}">
          <i class="fas fa-check mr-1.5"></i>OK
        </button>
      </div>
    </div>
  `;
  document.body.appendChild(modal);

  requestAnimationFrame(() => {
    const box = document.getElementById("custom-alert-box");
    if (box) {
      box.style.transform = "scale(1)";
      box.style.opacity = "1";
    }
  });

  function closeAlert() {
    const box = document.getElementById("custom-alert-box");
    if (box) {
      box.style.transform = "scale(0.95)";
      box.style.opacity = "0";
    }
    setTimeout(() => {
      if (modal.parentElement) modal.remove();
    }, 180);
  }

  document.getElementById("alert-ok-btn").addEventListener("click", closeAlert);
  modal.addEventListener("click", (e) => {
    if (e.target === modal) closeAlert();
  });
}

// Add CSS for animation
const style = document.createElement("style");
style.textContent = `
  @keyframes slide-in {
    from {
      transform: translateX(100%);
      opacity: 0;
    }
    to {
      transform: translateX(0);
      opacity: 1;
    }
  }
  
  @keyframes slideOut {
    from {
      transform: translateX(0);
      opacity: 1;
    }
    to {
      transform: translateX(100%);
      opacity: 0;
    }
  }
  
  .animate-slide-in {
    animation: slide-in 0.3s ease-out;
  }
`;
document.head.appendChild(style);

// Initialize
document.addEventListener("DOMContentLoaded", async function () {
  // Apply saved theme immediately on load
  applyStoredTheme();

  // Check if user is logged in
  const session = sessionStorage.getItem("churchUser");
  if (!session) {
    alert("Please login first!");
    window.location.href = "/index.html";
    return;
  }

  // Get user from session
  currentUser = JSON.parse(session);

  // 🔥 CRITICAL FIX: Apply role visibility IMMEDIATELY
  applyRoleBasedVisibility();
  console.log("👤 Current user role:", currentUser.role);
  console.log("🎨 Body classes:", document.body.className);

  // 🔥 NEW: Load fresh profile data from database (including profile picture!)
  await loadUserProfileFromDatabase();

  startHeartbeat();
  startStatsAutoRefresh();

  // Load members from database
  await loadMembersFromDatabase();

  // ADD THIS LINE HERE ⬇️
  await loadDashboardStats();
  loadRecentActivity();

  // Set user info in sidebar
  document.getElementById("user-name").textContent = currentUser.name;

  // Set user info in sidebar
  document.getElementById("user-name").textContent = currentUser.name;
  document.getElementById("user-role").textContent =
    currentUser.role.toUpperCase();

  // Set user info in dashboard
  document.getElementById("dashboard-user-name").textContent = currentUser.name;
  document.getElementById("dashboard-user-role").textContent =
    currentUser.role.toUpperCase();

  // Set user avatars (initials or picture)
  const initials = currentUser.name
    .split(" ")
    .filter((n) => n)
    .map((n) => n[0])
    .join("")
    .toUpperCase();

  // Check if user has profile picture from database
  const picUrl = currentUser.profilePicture || currentUser.profile_picture;

  if (picUrl) {
    // User has profile picture - display it
    document.getElementById("user-avatar").innerHTML =
      `<img src="${picUrl}" alt="Profile" class="w-full h-full object-cover rounded-full">`;
    document.getElementById("dashboard-user-avatar").innerHTML =
      `<img src="${picUrl}" alt="Profile" class="w-full h-full object-cover rounded-full">`;
  } else {
    // No profile picture - use initials
    document.getElementById("user-avatar").textContent = initials;
    document.getElementById("dashboard-user-avatar").textContent = initials;
  }

  // Update current time
  updateTime();
  setInterval(updateTime, 1000);

  setPermissions(currentUser.role);
  updateDashboard();
  // Note: renderMembers() is called inside loadMembersFromDatabase() above, no need to call it again here

  // Initialize user profile
  initializeUserProfile();

  // Show welcome popup
  // showWelcomePopup(); // Popup removed

  // ADD THIS SECTION HERE ⬇️
  // Auto-refresh dashboard stats every 30 seconds
  setInterval(async () => {
    await loadDashboardStats();
    console.log("🔄 Dashboard stats refreshed");
  }, 30000); // 30 seconds

  // ✅ Restore last active tab after hard refresh
  restoreActiveTab();
});

function restoreActiveTab() {
  const savedTab = localStorage.getItem("activeTab") || "dashboard";

  // Show the correct tab panel
  document
    .querySelectorAll(".tab-content")
    .forEach((t) => t.classList.add("hidden"));
  const targetTab = document.getElementById(savedTab + "-tab");
  if (targetTab) targetTab.classList.remove("hidden");

  // Highlight the correct sidebar button
  document
    .querySelectorAll(".sidebar-link")
    .forEach((b) => b.classList.remove("active"));
  const savedBtn = document.querySelector(
    `button.sidebar-link[onclick*="${savedTab}"], a.sidebar-link[onclick*="${savedTab}"]`,
  );
  if (savedBtn) savedBtn.classList.add("active");

  // Load data for the restored tab
  if (savedTab === "members") loadMembersFromDatabase();
  if (savedTab === "donations") renderDonations();
  if (savedTab === "users") renderUsers();
  if (savedTab === "dashboard") {
    loadDashboardStats();
    loadRecentActivity();
  }
  if (savedTab === "audit") AuditLogger.loadLogs();
}

function showWelcomePopup() {
  const now = new Date();
  const hour = now.getHours();
  let greeting = "Good Evening";
  let icon = "🌙";

  if (hour < 12) {
    greeting = "Good Morning";
    icon = "🌅";
  } else if (hour < 18) {
    greeting = "Good Afternoon";
    icon = "☀️";
  }

  const roleMessages = {
    superadmin: "You have full system access. Manage with care!",
    admin: "You can manage members, events, and donations.",
    user: "Welcome to the church management system!",
  };

  const roleColors = {
    superadmin: "from-red-500 to-red-700",
    admin: "from-blue-500 to-blue-700",
    user: "from-green-500 to-green-700",
  };

  const popup = `
                <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 welcome-popup" id="welcome-popup">
                    <div class="welcome-popup-content bg-white rounded-3xl shadow-2xl max-w-md w-full mx-4 overflow-hidden">
                        <!-- Header with gradient -->
                        <div class="bg-gradient-to-r ${
                          roleColors[currentUser.role]
                        } p-8 text-white text-center relative overflow-hidden">
                            <div class="absolute top-0 left-0 w-full h-full opacity-10">
                                <div class="absolute top-4 left-4 text-6xl">✨</div>
                                <div class="absolute top-8 right-8 text-4xl">🎉</div>
                                <div class="absolute bottom-4 left-12 text-5xl">⭐</div>
                                <div class="absolute bottom-8 right-4 text-3xl">🌟</div>
                            </div>
                            <div class="relative z-10">
                                <div class="text-6xl mb-3">${icon}</div>
                                <h2 class="text-3xl font-bold mb-2">${greeting}!</h2>
                                <p class="text-lg opacity-90">Welcome back to JILC MIS</p>
                            </div>
                        </div>
                        
                        <!-- Content -->
                        <div class="p-8">
                            <div class="text-center mb-6">
    <div class="bg-gradient-to-br ${
      roleColors[currentUser.role]
    } w-20 h-20 rounded-full flex items-center justify-center text-white font-bold text-2xl mx-auto mb-4 shadow-lg overflow-hidden">
        ${
          currentUser.profilePicture || currentUser.profile_picture
            ? `<img src="${
                currentUser.profilePicture || currentUser.profile_picture
              }" alt="Profile" class="w-full h-full object-cover">`
            : currentUser.name
                .split(" ")
                .map((n) => n[0])
                .join("")
                .toUpperCase()
        }
    </div>
                                <h3 class="text-2xl font-bold text-gray-800 mb-2">${
                                  currentUser.name
                                }</h3>
                                <span class="inline-block px-4 py-2 rounded-full text-sm font-bold bg-gradient-to-r ${
                                  roleColors[currentUser.role]
                                } text-white">
                                    ${currentUser.role.toUpperCase()}
                                </span>
                            </div>
                            
                            <div class="bg-gradient-to-br from-blue-50 to-purple-50 rounded-2xl p-4 mb-6">
                                <p class="text-gray-700 text-center">
                                    <i class="fas fa-info-circle text-blue-600 mr-2"></i>
                                    ${roleMessages[currentUser.role]}
                                </p>
                            </div>
                            
                            <div class="text-sm text-gray-500 text-center mb-6">
                                <i class="fas fa-calendar mr-2"></i>
                                ${now.toLocaleDateString("en-US", {
                                  weekday: "long",
                                  year: "numeric",
                                  month: "long",
                                  day: "numeric",
                                })}
                                <br>
                                <i class="fas fa-clock mr-2"></i>
                                ${now.toLocaleTimeString("en-US", {
                                  hour: "2-digit",
                                  minute: "2-digit",
                                })}
                            </div>
                            
                            <button onclick="closeWelcomePopup()" class="w-full bg-gradient-to-r ${
                              roleColors[currentUser.role]
                            } text-white py-4 rounded-xl hover:shadow-lg transition-all duration-300 font-bold text-lg transform hover:scale-105">
                                <i class="fas fa-check-circle mr-2"></i>
                                Let's Get Started!
                            </button>
                        </div>
                    </div>
                </div>
            `;

  document.getElementById("welcome-popup-container").innerHTML = popup;

  // Auto close after 5 seconds
  setTimeout(() => {
    closeWelcomePopup();
  }, 8000);
}

function closeWelcomePopup() {
  const popup = document.getElementById("welcome-popup");
  if (popup) {
    popup.style.animation = "slideDown 0.3s ease-in reverse";
    setTimeout(() => {
      document.getElementById("welcome-popup-container").innerHTML = "";
    }, 300);
  }
}

function updateTime() {
  const now = new Date();
  const timeString = now.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
  const dateString = now.toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
  document.getElementById("current-time").textContent = timeString;
  document.getElementById("last-login").textContent = dateString;
}

function setPermissions(role) {
  const addDonationBtn = document.getElementById("add-donation-btn");
  const adminPanelSection = document.getElementById("admin-panel-section");
  const superadminPanelSection = document.getElementById(
    "superadmin-panel-section",
  );

  // Get Quick Action buttons
  const quickAddMemberBtn = document.getElementById("quick-add-member-btn");
  const addMemberBtn = document.getElementById("add-member-btn");

  if (role === "superadmin") {
    // SuperAdmin sees everything
    adminPanelSection.classList.remove("hidden");
    superadminPanelSection.classList.remove("hidden");
    if (quickAddMemberBtn) quickAddMemberBtn.classList.remove("hidden");
    if (addMemberBtn) addMemberBtn.classList.remove("hidden");
    addDonationBtn.classList.remove("hidden");
    // addEventCalendarBtn.classList.remove("hidden");
  } else if (role === "admin") {
    // Admin sees admin panel only
    adminPanelSection.classList.remove("hidden");
    if (quickAddMemberBtn) quickAddMemberBtn.classList.add("hidden");
    if (addMemberBtn) addMemberBtn.classList.add("hidden");
    superadminPanelSection.classList.add("hidden");
    addDonationBtn.classList.remove("hidden");
    //  addEventCalendarBtn.classList.remove("hidden");
  } else {
    // Regular user sees nothing special
    adminPanelSection.classList.add("hidden");
    if (quickAddMemberBtn) quickAddMemberBtn.classList.add("hidden");
    if (addMemberBtn) addMemberBtn.classList.add("hidden");
    superadminPanelSection.classList.add("hidden");
    addDonationBtn.classList.add("hidden");
    // Fixed: Check if element exists before accessing it
    const addEventCalendarBtn = document.getElementById(
      "add-event-calendar-btn",
    );
    if (addEventCalendarBtn) addEventCalendarBtn.classList.add("hidden");
  }
}

function canEdit() {
  return (
    currentUser &&
    (currentUser.role === "admin" || currentUser.role === "superadmin")
  );
}

function canEditMembers() {
  return currentUser && currentUser.role === "superadmin";
}

function canDelete() {
  return currentUser && currentUser.role === "superadmin";
}

function updateDashboard() {
  // WITH THIS LINE:
  loadDashboardStats(); // Fetch real-time data from database
  const total = donations.reduce((s, d) => s + d.amount, 0);

  // Update donations
  const totalDonationsEl = document.getElementById("total-donations");
  if (totalDonationsEl) {
    totalDonationsEl.textContent = "$" + total.toLocaleString();
  }

  const totalDonationsDashEl = document.getElementById("total-donations-dash");
  if (totalDonationsDashEl) {
    totalDonationsDashEl.textContent = "$" + total.toLocaleString();
  }

  // Removed total-users-dash since it doesn't exist anymore
  // Online users is now handled by loadDashboardStats()
}

function switchTab(tabName) {
  document
    .querySelectorAll(".tab-content")
    .forEach((t) => t.classList.add("hidden"));
  document
    .querySelectorAll(".sidebar-link")
    .forEach((b) => b.classList.remove("active"));

  const targetTab = document.getElementById(tabName + "-tab");
  if (targetTab) targetTab.classList.remove("hidden");

  const clickedBtn = event
    ? event.target.closest(".sidebar-link")
    : document.querySelector(`[onclick*="${tabName}"]`);
  if (clickedBtn) clickedBtn.classList.add("active");

  // Refresh data when switching tabs
  if (tabName === "members") {
    loadMembersFromDatabase(); // Load fresh data with profile pictures
  }
  if (tabName === "donations") renderDonations();
  if (tabName === "users") renderUsers();
  if (tabName === "audit") AuditLogger.loadLogs();

  // ✅ Save current tab so hard refresh restores it
  localStorage.setItem("activeTab", tabName);
}

// ADD THIS FUNCTION HERE ⬇️
function goToDashboard(event) {
  event.preventDefault();

  // Switch to dashboard tab
  switchTab("dashboard");

  // Optional: Scroll to top smoothly
  window.scrollTo({
    top: 0,
    behavior: "smooth",
  });

  // Optional: Add a visual feedback
  const header = event.currentTarget;
  header.style.transform = "scale(0.98)";
  setTimeout(() => {
    header.style.transform = "scale(1)";
  }, 100);
}

// ─── Current quick-filter mode (all | recent) ───────────────────────────────
let membersQuickFilter = "all";

function quickFilterMembers(mode) {
  membersQuickFilter = mode;
  // Toggle active style on the pill buttons
  document.querySelectorAll(".filter-btn").forEach((btn) => {
    btn.classList.remove("active", "border-blue-500", "text-blue-600");
  });
  const activeBtn = Array.from(document.querySelectorAll(".filter-btn")).find(
    (btn) =>
      btn.getAttribute("onclick") && btn.getAttribute("onclick").includes(mode),
  );
  if (activeBtn) {
    activeBtn.classList.add("active", "border-blue-500", "text-blue-600");
  }
  renderMembers();
}

function setMembersView(view) {
  const grid = document.getElementById("members-grid");
  const list = document.getElementById("members-list-view");
  const gridBtn = document.getElementById("grid-view-btn");
  const listBtn = document.getElementById("list-view-btn");

  if (view === "grid") {
    grid.classList.remove("hidden");
    list.classList.add("hidden");
    gridBtn.classList.add(
      "active",
      "bg-blue-600",
      "text-white",
      "border-blue-600",
    );
    listBtn.classList.remove(
      "active",
      "bg-blue-600",
      "text-white",
      "border-blue-600",
    );
  } else {
    grid.classList.add("hidden");
    list.classList.remove("hidden");
    listBtn.classList.add(
      "active",
      "bg-blue-600",
      "text-white",
      "border-blue-600",
    );
    gridBtn.classList.remove(
      "active",
      "bg-blue-600",
      "text-white",
      "border-blue-600",
    );
  }
  renderMembers();
}

function clearMembersFilters() {
  document.getElementById("member-search").value = "";
  document.getElementById("ministry-filter").value = "";
  document.getElementById("status-filter").value = "";
  membersQuickFilter = "all";
  document
    .querySelectorAll(".filter-btn")
    .forEach((btn) =>
      btn.classList.remove("active", "border-blue-500", "text-blue-600"),
    );
  const allBtn = Array.from(document.querySelectorAll(".filter-btn")).find(
    (btn) =>
      btn.getAttribute("onclick") &&
      btn.getAttribute("onclick").includes("all"),
  );
  if (allBtn)
    allBtn.classList.add("active", "border-blue-500", "text-blue-600");
  renderMembers();
}

function updateMemberStats(allMembers) {
  // Total Members
  const totalEl = document.getElementById("total-members-count");
  if (totalEl) totalEl.textContent = allMembers.length;

  // Active Members
  const activeEl = document.getElementById("active-members-count");
  if (activeEl) {
    const activeCount = allMembers.filter(
      (m) => m.status && m.status.toLowerCase() === "active",
    ).length;
    activeEl.textContent = activeCount;
  }

  // New This Month
  const newEl = document.getElementById("new-members-count");
  if (newEl) {
    const now = new Date();
    const newCount = allMembers.filter((m) => {
      if (!m.joinDate) return false;
      const d = new Date(m.joinDate);
      return (
        d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth()
      );
    }).length;
    newEl.textContent = newCount;
  }

  // Ministries (count unique non-null departments)
  const ministriesEl = document.getElementById("ministries-count");
  if (ministriesEl) {
    const unique = new Set(
      allMembers
        .map((m) => m.ministry)
        .filter((v) => v && v !== "null" && v.trim() !== ""),
    );
    ministriesEl.textContent = unique.size;
  }
}

function getInitials(name) {
  return (name || "?")
    .split(" ")
    .filter((n) => n)
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 3);
}

function getMemberAvatarHtml(m) {
  const initials = getInitials(m.name);
  if (m.profile_picture && m.profile_picture !== "null") {
    return `<img src="${m.profile_picture}" alt="${m.name}" class="w-full h-full object-cover rounded-full"
      onerror="this.parentElement.innerHTML='${initials}'; this.parentElement.classList.add('flex','items-center','justify-center');">`;
  }
  return initials;
}

function getMinistryBadge(ministry) {
  if (!ministry || ministry === "null" || ministry.trim() === "") {
    return `<span class="bg-gray-100 text-gray-500 px-3 py-1 rounded-full text-xs font-semibold italic">No Ministry</span>`;
  }
  const colorMap = {
    worship: "bg-blue-100 text-blue-700",
    youth: "bg-pink-100 text-pink-700",
    children: "bg-yellow-100 text-yellow-700",
    prayer: "bg-indigo-100 text-indigo-700",
    outreach: "bg-green-100 text-green-700",
    media: "bg-purple-100 text-purple-700",
  };
  const key = ministry.toLowerCase();
  const cls = Object.keys(colorMap).find((k) => key.includes(k));
  const color = cls ? colorMap[cls] : "bg-purple-100 text-purple-700";
  return `<span class="${color} px-3 py-1 rounded-full text-xs font-semibold">${ministry}</span>`;
}

function getStatusBadge(status) {
  if (!status || status === "null") return "";
  const isActive = status.toLowerCase() === "active";
  return `<span class="${isActive ? "bg-green-100 text-green-700" : "bg-red-100 text-red-600"} px-2 py-0.5 rounded-full text-xs font-semibold ml-2">
    ${status}
  </span>`;
}

function renderMembers() {
  const search = (document.getElementById("member-search")?.value || "")
    .toLowerCase()
    .trim();
  const ministryVal = (
    document.getElementById("ministry-filter")?.value || ""
  ).toLowerCase();
  const statusVal = (
    document.getElementById("status-filter")?.value || ""
  ).toLowerCase();

  // Always update stats from the full unfiltered list
  updateMemberStats(members);

  let filtered = members.filter((m) => {
    // Search: name, email, phone
    const matchSearch =
      !search ||
      (m.name || "").toLowerCase().includes(search) ||
      (m.email || "").toLowerCase().includes(search) ||
      (m.phone || "").toLowerCase().includes(search);

    // Ministry dropdown
    const matchMinistry =
      !ministryVal || (m.ministry || "").toLowerCase().includes(ministryVal);

    // Status dropdown
    const matchStatus =
      !statusVal || (m.status || "").toLowerCase() === statusVal;

    return matchSearch && matchMinistry && matchStatus;
  });

  // Quick filter: Recently Added = joined in last 30 days
  if (membersQuickFilter === "recent") {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    filtered = filtered.filter((m) => {
      if (!m.joinDate) return false;
      return new Date(m.joinDate) >= thirtyDaysAgo;
    });
  }

  const isListView = !document
    .getElementById("members-list-view")
    ?.classList.contains("hidden");
  const emptyState = document.getElementById("members-empty-state");

  if (filtered.length === 0) {
    document.getElementById("members-grid").innerHTML = "";
    const tbody = document.getElementById("members-table-body");
    if (tbody) tbody.innerHTML = "";
    if (emptyState) emptyState.classList.remove("hidden");
    return;
  }
  if (emptyState) emptyState.classList.add("hidden");

  // ── GRID VIEW ──────────────────────────────────────────────────────────────
  document.getElementById("members-grid").innerHTML = filtered
    .map(
      (m) => `
    <div class="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition member-card">
      <div class="flex justify-between mb-4">
        <div class="bg-blue-100 w-14 h-14 rounded-full flex items-center justify-center text-xl font-bold text-blue-600 overflow-hidden flex-shrink-0">
          ${getMemberAvatarHtml(m)}
        </div>
        <div class="flex gap-2">
          ${
            canEditMembers()
              ? `
            <button onclick="editMember(${m.id})" class="text-blue-600 hover:bg-blue-50 p-2 rounded transition" title="Edit Member">
              <i class="fas fa-edit"></i>
            </button>
            <button onclick="deleteMember(${m.id})" class="text-red-600 hover:bg-red-50 p-2 rounded transition" title="Delete Member">
              <i class="fas fa-trash"></i>
            </button>
          `
              : ""
          }
        </div>
      </div>
      <h3 class="text-xl font-bold mb-1">${m.name}${getStatusBadge(m.status)}</h3>
      <p class="text-sm text-gray-600 mb-1"><i class="fas fa-envelope mr-2"></i>${m.email || "—"}</p>
      <p class="text-sm text-gray-600 mb-1"><i class="fas fa-phone mr-2"></i>${m.phone && m.phone !== "null" ? m.phone : "—"}</p>
      <p class="text-sm text-gray-600 mb-2"><i class="fas fa-calendar mr-2"></i>Joined: ${m.joinDate ? new Date(m.joinDate).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" }) : "—"}</p>
      <p class="text-sm mt-2">${getMinistryBadge(m.ministry)}</p>
    </div>
  `,
    )
    .join("");

  // ── LIST VIEW ──────────────────────────────────────────────────────────────
  const tbody = document.getElementById("members-table-body");
  if (tbody) {
    tbody.innerHTML = filtered
      .map(
        (m) => `
      <tr class="border-b border-gray-100 hover:bg-blue-50 transition">
        <td class="px-6 py-4">
          <div class="flex items-center gap-3">
            <div class="bg-blue-100 w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold text-blue-600 overflow-hidden flex-shrink-0">
              ${getMemberAvatarHtml(m)}
            </div>
            <div>
              <div class="font-semibold">${m.name}</div>
              <div class="text-xs text-gray-400">${m.email || ""}</div>
            </div>
          </div>
        </td>
        <td class="px-6 py-4 text-sm text-gray-600">${m.phone && m.phone !== "null" ? m.phone : "—"}</td>
        <td class="px-6 py-4">${getMinistryBadge(m.ministry)}</td>
        <td class="px-6 py-4">
          <span class="${(m.status || "").toLowerCase() === "active" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-600"} px-3 py-1 rounded-full text-xs font-semibold">
            ${m.status || "—"}
          </span>
        </td>
        <td class="px-6 py-4 text-sm text-gray-600">
          ${m.joinDate ? new Date(m.joinDate).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" }) : "—"}
        </td>
        <td class="px-6 py-4 text-center">
          ${
            canEditMembers()
              ? `
            <button onclick="editMember(${m.id})" class="text-blue-600 hover:bg-blue-50 p-2 rounded transition" title="Edit">
              <i class="fas fa-edit"></i>
            </button>
            <button onclick="deleteMember(${m.id})" class="text-red-600 hover:bg-red-50 p-2 rounded transition" title="Delete">
              <i class="fas fa-trash"></i>
            </button>
          `
              : '<span class="text-gray-400 text-sm">View Only</span>'
          }
        </td>
      </tr>
    `,
      )
      .join("");
  }
}

function renderDonations() {
  document.getElementById("donations-table").innerHTML = donations
    .map(
      (d) => `
                <tr class="hover:bg-gray-50 transition">
                    <td class="px-6 py-4 font-semibold">${d.donor}</td>
                    <td class="px-6 py-4 text-green-600 font-bold">$${d.amount.toLocaleString()}</td>
                    <td class="px-6 py-4">${d.date}</td>
                    <td class="px-6 py-4">
                        <span class="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-xs font-semibold">
                            ${d.type}
                        </span>
                    </td>
                    <td class="px-6 py-4">${d.method}</td>
                    <td class="px-6 py-4">
                        ${
                          canEdit()
                            ? `
                            <button onclick="editDonation(${d.id})" class="text-blue-600 hover:bg-blue-50 p-2 rounded transition" title="Edit Donation">
                                <i class="fas fa-edit"></i>
                            </button>
                            <button onclick="deleteDonation(${d.id})" class="text-red-600 hover:bg-red-50 p-2 rounded ml-2 transition" title="Delete Donation">
                                <i class="fas fa-trash"></i>
                            </button>
                        `
                            : '<span class="text-gray-400 text-sm">View Only</span>'
                        }
                    </td>
                </tr>
            `,
    )
    .join("");

  updateDashboard();
}

function formatDate(dateStr) {
  if (!dateStr) return '<span class="text-gray-300 italic text-xs">—</span>';
  const d = new Date(dateStr);
  if (isNaN(d)) return '<span class="text-gray-300 italic text-xs">—</span>';
  return d.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function getBirthdayBadge(dateStr) {
  if (!dateStr) return '<span class="text-gray-300 italic text-xs">—</span>';
  const d = new Date(dateStr);
  const today = new Date();
  const isBirthdayToday =
    d.getMonth() === today.getMonth() && d.getDate() === today.getDate();
  const formatted = d.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
  if (isBirthdayToday) {
    return `<span class="inline-flex items-center gap-1 text-sm text-pink-600 font-semibold">
      <i class="fas fa-birthday-cake"></i> ${formatted}
      <span class="ml-1 bg-pink-100 text-pink-600 text-xs px-2 py-0.5 rounded-full animate-pulse">Today! 🎉</span>
    </span>`;
  }
  return `<span class="text-sm text-gray-700">${formatted}</span>`;
}

// ============================================================
// USER MANAGEMENT - Database-backed with role promotion/demotion
// ============================================================

async function loadUsersFromDatabase() {
  if (currentUser.role !== "superadmin") return;
  try {
    const response = await fetch("users_handler.php", { method: "GET" });
    const result = await response.json();
    if (result.status === "success") {
      users = result.data;
      filterUsers();
    } else {
      console.error("Failed to load users:", result.message);
    }
  } catch (err) {
    console.error("Error loading users:", err);
  }
}

function updateUserStats(list) {
  const total = list.length;
  const active = list.filter((u) => u.status === "Active").length;
  const sa = list.filter((u) => u.role === "superadmin").length;
  const adm = list.filter((u) => u.role === "admin").length;
  const totalEl = document.getElementById("um-total");
  const activeEl = document.getElementById("um-active");
  const saEl = document.getElementById("um-superadmin");
  const admEl = document.getElementById("um-admin");
  if (totalEl) totalEl.textContent = total;
  if (activeEl) activeEl.textContent = active;
  if (saEl) saEl.textContent = sa;
  if (admEl) admEl.textContent = adm;
}

function renderUsersTable(list) {
  const tbody = document.getElementById("users-table");
  const empty = document.getElementById("users-empty-state");
  const countEl = document.getElementById("user-results-count");
  if (!tbody) return;

  updateUserStats(list);

  if (countEl) {
    countEl.textContent =
      list.length === users.length
        ? `${users.length} user${users.length !== 1 ? "s" : ""}`
        : `${list.length} of ${users.length} user${users.length !== 1 ? "s" : ""}`;
  }

  if (list.length === 0) {
    tbody.innerHTML = "";
    if (empty) empty.classList.remove("hidden");
    return;
  }
  if (empty) empty.classList.add("hidden");

  tbody.innerHTML = list
    .map(
      (u, i) => `
    <tr class="border-b border-gray-100 hover:bg-blue-50 transition group" style="animation: fadeInRow 0.2s ease both; animation-delay: ${i * 0.04}s">
      <td class="px-5 py-4">
        <div class="flex items-center gap-3">
          <div class="w-9 h-9 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0 shadow-sm
            ${
              u.role === "superadmin"
                ? "bg-gradient-to-br from-red-500 to-red-600"
                : u.role === "admin"
                  ? "bg-gradient-to-br from-blue-500 to-blue-600"
                  : "bg-gradient-to-br from-gray-400 to-gray-500"
            }">
            ${u.name.charAt(0).toUpperCase()}
          </div>
          <span class="font-semibold text-gray-800 text-sm">${u.username}</span>
        </div>
      </td>
      <td class="px-5 py-4 text-gray-700 text-sm">${u.name}</td>
      <td class="px-5 py-4">
        <span class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold
          ${
            u.role === "superadmin"
              ? "bg-red-100 text-red-700 border border-red-200"
              : u.role === "admin"
                ? "bg-blue-100 text-blue-700 border border-blue-200"
                : "bg-gray-100 text-gray-600 border border-gray-200"
          }">
          <i class="fas ${u.role === "superadmin" ? "fa-crown" : u.role === "admin" ? "fa-user-shield" : "fa-user"} text-xs"></i>
          ${u.role.toUpperCase()}
        </span>
      </td>
      <td class="px-5 py-4">${getBirthdayBadge(u.birthday)}</td>
      <td class="px-5 py-4">
        <div class="flex items-center gap-1.5 text-sm text-gray-600">
          <i class="fas fa-calendar-check text-blue-400 text-xs"></i>
          ${formatDate(u.dateJoined)}
        </div>
      </td>
      <td class="px-5 py-4">
        <span class="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold
          ${
            u.status === "Active"
              ? "bg-green-100 text-green-700 border border-green-200"
              : "bg-red-100 text-red-700 border border-red-200"
          }">
          <span class="w-1.5 h-1.5 rounded-full inline-block ${u.status === "Active" ? "bg-green-500" : "bg-red-500"}"></span>
          ${u.status}
        </span>
      </td>
      <td class="px-5 py-4">
        ${
          u.id !== 1
            ? `<div class="flex items-center gap-2 opacity-70 group-hover:opacity-100 transition">
              <button
                data-user-id="${u.id}"
                data-user-role="${u.role}"
                onclick="toggleRoleDropdown(event, ${u.id})"
                class="role-change-btn flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold rounded-lg border transition
                  ${
                    u.role === "superadmin"
                      ? "bg-red-50 border-red-200 text-red-700 hover:bg-red-100"
                      : u.role === "admin"
                        ? "bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100"
                        : "bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100"
                  }"
                title="Change Role">
                <i class="fas fa-exchange-alt text-xs"></i>
                Change Role
                <i class="fas fa-chevron-down text-xs"></i>
              </button>
              <button onclick="deleteUser(${u.id})" class="text-red-500 hover:bg-red-100 p-2 rounded-lg transition" title="Delete User">
                <i class="fas fa-trash text-sm"></i>
              </button>
            </div>`
            : `<span class="inline-flex items-center gap-1 text-gray-400 text-xs">
              <i class="fas fa-lock"></i> Protected
            </span>`
        }
      </td>
    </tr>
  `,
    )
    .join("");
}

// ── Floating portal dropdown — appended to body so overflow:hidden never clips it ──
function getOrCreateRolePortal() {
  let portal = document.getElementById("role-portal-dropdown");
  if (!portal) {
    portal = document.createElement("div");
    portal.id = "role-portal-dropdown";
    portal.className =
      "hidden fixed z-[9999] w-48 bg-white rounded-xl shadow-2xl border border-gray-100 overflow-hidden";
    portal.style.cssText = "box-shadow: 0 10px 40px rgba(0,0,0,0.18);";
    document.body.appendChild(portal);
  }
  return portal;
}

function toggleRoleDropdown(event, userId) {
  event.stopPropagation();
  const btn = event.currentTarget;
  const portal = getOrCreateRolePortal();
  const currentlyOpen =
    portal._userId === userId && !portal.classList.contains("hidden");

  // Always hide first
  portal.classList.add("hidden");
  portal._userId = null;

  if (currentlyOpen) return; // toggle off

  // Find the user data
  const user = users.find((u) => u.id === userId);
  if (!user) return;

  // Build dropdown content
  const options = [];
  if (user.role !== "superadmin") {
    options.push(`<button onclick="changeUserRole(${userId}, 'superadmin')" class="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-red-700 hover:bg-red-50 transition font-medium">
      <i class="fas fa-crown text-xs w-4 text-red-500"></i> SuperAdmin
    </button>`);
  }
  if (user.role !== "admin") {
    options.push(`<button onclick="changeUserRole(${userId}, 'admin')" class="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-blue-700 hover:bg-blue-50 transition font-medium">
      <i class="fas fa-user-shield text-xs w-4 text-blue-500"></i> Admin
    </button>`);
  }
  if (user.role !== "user") {
    options.push(`<button onclick="changeUserRole(${userId}, 'user')" class="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-gray-600 hover:bg-gray-50 transition font-medium">
      <i class="fas fa-user text-xs w-4 text-gray-400"></i> User
    </button>`);
  }

  portal.innerHTML = `
    <div class="px-4 py-2 bg-gray-50 border-b border-gray-100">
      <p class="text-xs font-bold text-gray-400 uppercase tracking-wider">Promote / Demote</p>
      <p class="text-xs text-gray-500 mt-0.5 truncate font-medium">${user.name}</p>
    </div>
    <div class="py-1">${options.join("")}</div>
  `;

  // Position relative to the button
  const rect = btn.getBoundingClientRect();
  const portalWidth = 192; // w-48
  let left = rect.right - portalWidth + window.scrollX;
  let top = rect.bottom + 6 + window.scrollY;

  // Prevent going off-screen on the left
  if (left < 8) left = 8;
  // Flip upward if not enough space below
  const spaceBelow = window.innerHeight - rect.bottom;
  if (spaceBelow < 160) {
    top = rect.top - 6 + window.scrollY;
    portal.style.transform = "translateY(-100%)";
  } else {
    portal.style.transform = "";
  }

  portal.style.left = left + "px";
  portal.style.top = top + "px";
  portal._userId = userId;
  portal.classList.remove("hidden");
}

// Close portal when clicking anywhere else
document.addEventListener("click", (e) => {
  const portal = document.getElementById("role-portal-dropdown");
  if (
    portal &&
    !portal.contains(e.target) &&
    !e.target.closest(".role-change-btn")
  ) {
    portal.classList.add("hidden");
    portal._userId = null;
  }
});

// Close on scroll (keeps position accurate)
document.addEventListener(
  "scroll",
  () => {
    const portal = document.getElementById("role-portal-dropdown");
    if (portal) {
      portal.classList.add("hidden");
      portal._userId = null;
    }
  },
  true,
);

async function changeUserRole(userId, newRole) {
  // Close portal dropdown
  const portal = document.getElementById("role-portal-dropdown");
  if (portal) {
    portal.classList.add("hidden");
    portal._userId = null;
  }

  const user = users.find((u) => u.id === userId);
  if (!user) return;
  const roleLabels = { superadmin: "SuperAdmin", admin: "Admin", user: "User" };

  const roleIcons = {
    superadmin: "fa-crown",
    admin: "fa-user-shield",
    user: "fa-user",
  };
  const roleColors = {
    superadmin: "text-red-500",
    admin: "text-blue-500",
    user: "text-gray-500",
  };

  showConfirmModal({
    title: "Change Role",
    message: `Change <strong>${user.name}</strong>'s role?`,
    subMessage: `<span class="inline-flex items-center gap-1.5"><i class="fas ${roleIcons[user.role]} ${roleColors[user.role]}"></i> ${roleLabels[user.role]}</span> &nbsp;→&nbsp; <span class="inline-flex items-center gap-1.5"><i class="fas ${roleIcons[newRole]} ${roleColors[newRole]}"></i> ${roleLabels[newRole]}</span>`,
    confirmText: `Set as ${roleLabels[newRole]}`,
    confirmClass:
      newRole === "superadmin"
        ? "bg-red-600 hover:bg-red-700"
        : newRole === "admin"
          ? "bg-blue-600 hover:bg-blue-700"
          : "bg-gray-600 hover:bg-gray-700",
    icon: roleIcons[newRole],
    iconClass: roleColors[newRole],
    onConfirm: async () => {
      try {
        const response = await fetch("users_handler.php", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "change_role",
            id: userId,
            role: newRole,
          }),
        });
        const result = await response.json();
        if (result.status === "success") {
          user.role = newRole;
          filterUsers();
          showSuccessMessage(`${user.name} is now ${roleLabels[newRole]}`);
          AuditLogger.log(
            "UPDATE",
            "Users",
            `Changed ${user.username} role to ${newRole}`,
          );
        } else {
          showAlertModal({
            title: "Update Failed",
            message: result.message,
            type: "error",
          });
        }
      } catch (err) {
        showAlertModal({
          title: "Connection Error",
          message: "Failed to update role. Please try again.",
          type: "error",
        });
      }
    },
  });
}

function renderUsers() {
  if (currentUser.role !== "superadmin") return;
  if (users.length === 0) {
    loadUsersFromDatabase();
  } else {
    filterUsers();
  }
}

function filterUsers() {
  const search = (document.getElementById("user-search")?.value || "")
    .toLowerCase()
    .trim();
  const roleFilter = document.getElementById("user-filter-role")?.value || "";
  const statusFilter =
    document.getElementById("user-filter-status")?.value || "";

  let list = users.filter((u) => {
    const matchRole = !roleFilter || u.role === roleFilter;
    const matchStatus = !statusFilter || u.status === statusFilter;
    const matchSearch =
      !search ||
      [
        u.username,
        u.name,
        u.role,
        u.status,
        formatDate(u.birthday),
        formatDate(u.dateJoined),
        u.birthday || "",
        u.dateJoined || "",
      ].some((v) => v.toLowerCase().includes(search));
    return matchRole && matchStatus && matchSearch;
  });

  if (userSortField) {
    list = list.slice().sort((a, b) => {
      const av = (a[userSortField] || "").toString().toLowerCase();
      const bv = (b[userSortField] || "").toString().toLowerCase();
      return userSortAsc ? av.localeCompare(bv) : bv.localeCompare(av);
    });
  }

  renderUsersTable(list);
}

function sortUsersBy(field) {
  if (userSortField === field) {
    userSortAsc = !userSortAsc;
  } else {
    userSortField = field;
    userSortAsc = true;
  }
  filterUsers();
}

function clearUserFilters() {
  const s = document.getElementById("user-search");
  const r = document.getElementById("user-filter-role");
  const st = document.getElementById("user-filter-status");
  if (s) s.value = "";
  if (r) r.value = "";
  if (st) st.value = "";
  userSortField = "";
  userSortAsc = true;
  filterUsers();
}

// Modal functions
function showModal(title, content) {
  const modal = `
                <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" onclick="closeModal(event)">
                    <div class="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6" onclick="event.stopPropagation()">
                        <div class="flex justify-between items-center mb-6">
                            <h3 class="text-2xl font-bold">${title}</h3>
                            <button onclick="closeModal()" class="text-gray-400 hover:text-gray-600 text-2xl">
                                <i class="fas fa-times"></i>
                            </button>
                        </div>
                        ${content}
                        <div class="flex gap-3 mt-6">
                            <button onclick="saveItem()" class="flex-1 bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 font-semibold transition">
                                <i class="fas fa-save mr-2"></i>Save
                            </button>
                            <button onclick="closeModal()" class="flex-1 bg-gray-300 text-gray-700 py-3 rounded-lg hover:bg-gray-400 font-semibold transition">
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            `;
  document.getElementById("modal-container").innerHTML = modal;
}

function closeModal(event) {
  if (!event || event.target === event.currentTarget) {
    document.getElementById("modal-container").innerHTML = "";
    editingItem = null;
    editingType = null;
  }
}

// CRUD operations
function openAddMemberModal() {
  // 🔒 SUPERADMIN ONLY: Check permissions before allowing member addition
  if (!canEditMembers()) {
    alert("⛔ Access Denied: Only SuperAdmin can add or edit members.");
    return;
  }

  if (!canEdit()) return;
  editingItem = null;
  editingType = "member";
  showModal("Add Member", getMemberForm());
}

function openAddDonationModal() {
  if (!canEdit()) return;
  editingItem = null;
  editingType = "donation";
  showModal("Add Donation", getDonationForm());
}

function openAddEventModal() {
  // Check if calendar_events.js has the function
  if (typeof openEventModal === "function") {
    openEventModal();
  } else if (typeof showEventForm === "function") {
    showEventForm();
  } else {
    // Fallback: switch to events tab
    switchTab("events");
    // Show a helpful message
    setTimeout(() => {
      const eventsTab = document.getElementById("events-tab");
      if (eventsTab) {
        const addBtn = eventsTab.querySelector('[onclick*="Event"]');
        if (addBtn) {
          addBtn.click();
        }
      }
    }, 100);
  }
}

function openAddUserModal() {
  // Add User button has been removed; this is kept for compatibility only
}

function editMember(id) {
  if (!canEditMembers()) {
    alert("⛔ Access Denied: Only SuperAdmin can add or edit members.");
    return;
  }
  editingItem = members.find((m) => m.id === id);
  editingType = "member";
  showModal("Edit Member", getMemberForm(editingItem));
}

function editDonation(id) {
  if (!canEdit()) return;
  editingItem = donations.find((d) => d.id === id);
  editingType = "donation";
  showModal("Edit Donation", getDonationForm(editingItem));
}

function editUser(id) {
  // Edit user is now handled via the Change Role dropdown in the table
}

async function deleteMember(id) {
  if (
    !canEditMembers() ||
    !confirm("Are you sure you want to delete this member?")
  ) {
    return;
  }

  try {
    const response = await fetch("members_handler.php", {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ id: id }),
    });

    const result = await response.json();

    if (result.status === "success") {
      members = members.filter((m) => m.id !== id);
      renderMembers();
      updateDashboard();
      showSuccessMessage("Member deleted successfully");
      AuditLogger.log("DELETE", "Members", "Deleted member (ID: " + id + ")");
    } else {
      alert("Failed to delete member: " + result.message);
    }
  } catch (error) {
    console.error("Error deleting member:", error);
    alert("Failed to delete member");
  }
}

function deleteDonation(id) {
  if (!canEdit() || !confirm("Are you sure you want to delete this donation?"))
    return;
  donations = donations.filter((d) => d.id !== id);
  renderDonations();
  updateDashboard();
}

async function deleteUser(id) {
  if (currentUser.role !== "superadmin") return;
  if (id === 1) {
    showAlertModal({
      title: "Protected Account",
      message: "This account is protected and cannot be deleted.",
      type: "warning",
    });
    return;
  }
  const user = users.find((u) => u.id === id);
  if (!user) return;

  showConfirmModal({
    title: "Delete User",
    message: `Are you sure you want to delete <strong>${user.name}</strong>?`,
    subMessage:
      "This action cannot be undone. All data associated with this account will be permanently removed.",
    confirmText: "Delete User",
    confirmClass: "bg-red-600 hover:bg-red-700",
    icon: "fa-trash",
    iconClass: "text-red-500",
    onConfirm: async () => {
      try {
        const response = await fetch("users_handler.php", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "delete", id: id }),
        });
        const result = await response.json();
        if (result.status === "success") {
          users = users.filter((u) => u.id !== id);
          filterUsers();
          updateDashboard();
          showSuccessMessage("User deleted successfully");
          AuditLogger.log(
            "DELETE",
            "Users",
            `Deleted user ${user.username} (ID: ${id})`,
          );
        } else {
          showAlertModal({
            title: "Delete Failed",
            message: result.message,
            type: "error",
          });
        }
      } catch (err) {
        showAlertModal({
          title: "Connection Error",
          message: "Failed to delete user. Please try again.",
          type: "error",
        });
      }
    },
  });
}

// Form generators
function getMemberForm(d = {}) {
  return `
                <input type="text" id="f-name" value="${
                  d.name || ""
                }" placeholder="Full Name" 
                    class="w-full px-4 py-3 border-2 border-gray-200 rounded-lg mb-3 focus:outline-none focus:ring-2 focus:ring-blue-500">
                <input type="email" id="f-email" value="${
                  d.email || ""
                }" placeholder="Email" 
                    class="w-full px-4 py-3 border-2 border-gray-200 rounded-lg mb-3 focus:outline-none focus:ring-2 focus:ring-blue-500">
                <input type="text" id="f-phone" value="${
                  d.phone || ""
                }" placeholder="Phone" 
                    class="w-full px-4 py-3 border-2 border-gray-200 rounded-lg mb-3 focus:outline-none focus:ring-2 focus:ring-blue-500">
                <input type="text" id="f-address" value="${
                  d.address || ""
                }" placeholder="Address" 
                    class="w-full px-4 py-3 border-2 border-gray-200 rounded-lg mb-3 focus:outline-none focus:ring-2 focus:ring-blue-500">
                <label class="block text-sm font-medium text-gray-700 mb-2">Join Date</label>
                <input type="date" id="f-joinDate" value="${d.joinDate || ""}" 
                    class="w-full px-4 py-3 border-2 border-gray-200 rounded-lg mb-3 focus:outline-none focus:ring-2 focus:ring-blue-500">
                <select id="f-ministry" class="w-full px-4 py-3 border-2 border-gray-200 rounded-lg mb-3 focus:outline-none focus:ring-2 focus:ring-blue-500">
                    <option value="">Select Ministry</option>
                    <option ${
                      d.ministry === "Worship" ? "selected" : ""
                    }>Worship</option>
                    <option ${
                      d.ministry === "Youth" ? "selected" : ""
                    }>Youth</option>
                    <option ${
                      d.ministry === "Prayer" ? "selected" : ""
                    }>Prayer</option>
                    <option ${
                      d.ministry === "Outreach" ? "selected" : ""
                    }>Outreach</option>
                    <option ${
                      d.ministry === "Children" ? "selected" : ""
                    }>Children</option>
                </select>
            `;
}

function getDonationForm(d = {}) {
  return `
                <input type="text" id="f-donor" value="${
                  d.donor || ""
                }" placeholder="Donor Name" 
                    class="w-full px-4 py-3 border-2 border-gray-200 rounded-lg mb-3 focus:outline-none focus:ring-2 focus:ring-blue-500">
                <input type="number" id="f-amount" value="${
                  d.amount || ""
                }" placeholder="Amount" step="0.01" 
                    class="w-full px-4 py-3 border-2 border-gray-200 rounded-lg mb-3 focus:outline-none focus:ring-2 focus:ring-blue-500">
                <label class="block text-sm font-medium text-gray-700 mb-2">Donation Date</label>
                <input type="date" id="f-date" value="${d.date || ""}" 
                    class="w-full px-4 py-3 border-2 border-gray-200 rounded-lg mb-3 focus:outline-none focus:ring-2 focus:ring-blue-500">
                <select id="f-type" class="w-full px-4 py-3 border-2 border-gray-200 rounded-lg mb-3 focus:outline-none focus:ring-2 focus:ring-blue-500">
                    <option value="">Select Type</option>
                    <option ${
                      d.type === "Tithe" ? "selected" : ""
                    }>Tithe</option>
                    <option ${
                      d.type === "Offering" ? "selected" : ""
                    }>Offering</option>
                    <option ${
                      d.type === "Building Fund" ? "selected" : ""
                    }>Building Fund</option>
                    <option ${
                      d.type === "Mission" ? "selected" : ""
                    }>Mission</option>
                    <option ${
                      d.type === "Special" ? "selected" : ""
                    }>Special</option>
                </select>
                <select id="f-method" class="w-full px-4 py-3 border-2 border-gray-200 rounded-lg mb-3 focus:outline-none focus:ring-2 focus:ring-blue-500">
                    <option value="">Select Method</option>
                    <option ${
                      d.method === "Cash" ? "selected" : ""
                    }>Cash</option>
                    <option ${
                      d.method === "Check" ? "selected" : ""
                    }>Check</option>
                    <option ${
                      d.method === "Online" ? "selected" : ""
                    }>Online</option>
                    <option ${
                      d.method === "Bank Transfer" ? "selected" : ""
                    }>Bank Transfer</option>
                </select>
            `;
}

function getUserForm(d = {}) {
  return `
    <div class="grid grid-cols-1 gap-3">
      <div>
        <label class="block text-xs font-semibold text-gray-600 mb-1">Username <span class="text-red-500">*</span></label>
        <input type="text" id="f-username" value="${d.username || ""}" placeholder="Username"
          class="w-full px-4 py-2.5 border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm">
      </div>
      <div>
        <label class="block text-xs font-semibold text-gray-600 mb-1">Full Name <span class="text-red-500">*</span></label>
        <input type="text" id="f-name" value="${d.name || ""}" placeholder="Full Name"
          class="w-full px-4 py-2.5 border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm">
      </div>
      <div>
        <label class="block text-xs font-semibold text-gray-600 mb-1">
          ${editingItem ? "New Password (leave blank to keep current)" : "Password"} <span class="text-red-500">${editingItem ? "" : "*"}</span>
        </label>
        <input type="password" id="f-password" placeholder="${editingItem ? "Enter new password or leave blank" : "Enter password"}"
          class="w-full px-4 py-2.5 border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm">
      </div>
      <div class="grid grid-cols-2 gap-3">
        <div>
          <label class="block text-xs font-semibold text-gray-600 mb-1">Role <span class="text-red-500">*</span></label>
          <select id="f-role" class="w-full px-4 py-2.5 border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm">
            <option value="">Select Role</option>
            <option value="user" ${d.role === "user" ? "selected" : ""}>User</option>
            <option value="admin" ${d.role === "admin" ? "selected" : ""}>Admin</option>
            <option value="superadmin" ${d.role === "superadmin" ? "selected" : ""}>SuperAdmin</option>
          </select>
        </div>
        <div>
          <label class="block text-xs font-semibold text-gray-600 mb-1">Status</label>
          <select id="f-status" class="w-full px-4 py-2.5 border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm">
            <option value="Active" ${d.status === "Active" ? "selected" : ""}>Active</option>
            <option value="Inactive" ${d.status === "Inactive" ? "selected" : ""}>Inactive</option>
          </select>
        </div>
      </div>
      <div class="grid grid-cols-2 gap-3">
        <div>
          <label class="block text-xs font-semibold text-gray-600 mb-1"><i class="fas fa-birthday-cake text-pink-500 mr-1"></i>Birthday</label>
          <input type="date" id="f-birthday" value="${d.birthday || ""}"
            class="w-full px-4 py-2.5 border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm">
        </div>
        <div>
          <label class="block text-xs font-semibold text-gray-600 mb-1"><i class="fas fa-calendar-plus text-blue-500 mr-1"></i>Date Joined</label>
          <input type="date" id="f-dateJoined" value="${d.dateJoined || ""}"
            class="w-full px-4 py-2.5 border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm">
        </div>
      </div>
    </div>
  `;
}

function saveItem() {
  if (editingType === "member") {
    const data = {
      name: document.getElementById("f-name").value,
      email: document.getElementById("f-email").value,
      phone: document.getElementById("f-phone").value,
      address: document.getElementById("f-address").value,
      joinDate: document.getElementById("f-joinDate").value,
      ministry: document.getElementById("f-ministry").value,
      status: "Active",
    };

    if (!data.name || !data.email) {
      alert("Please fill in required fields");
      return;
    }

    // Add ID if editing
    if (editingItem) {
      data.id = editingItem.id;
    }

    // Save to database
    saveMemberToDatabase(data);
    return; // Don't continue to the rest
  } else if (editingType === "donation") {
    const data = {
      donor: document.getElementById("f-donor").value,
      amount: parseFloat(document.getElementById("f-amount").value) || 0,
      date: document.getElementById("f-date").value,
      type: document.getElementById("f-type").value,
      method: document.getElementById("f-method").value,
    };

    if (!data.donor || !data.amount) {
      alert("Please fill in required fields");
      return;
    }

    if (editingItem) {
      Object.assign(editingItem, data);
    } else {
      data.id =
        donations.length > 0 ? Math.max(...donations.map((d) => d.id)) + 1 : 1;
      donations.push(data);
    }
    renderDonations();
    const donAction = editingItem ? "UPDATE" : "CREATE";
    const donLabel = editingItem
      ? "Updated donation from " + data.donor
      : "Added donation from " + data.donor + " - P" + data.amount;
    AuditLogger.log(donAction, "Donations", donLabel);
  } else if (editingType === "user") {
    const passwordField = document.getElementById("f-password");
    const newPassword = passwordField ? passwordField.value.trim() : "";

    const data = {
      username: document.getElementById("f-username").value,
      name: document.getElementById("f-name").value,
      role: document.getElementById("f-role").value,
      status: document.getElementById("f-status").value,
      birthday: document.getElementById("f-birthday")?.value || "",
      dateJoined: document.getElementById("f-dateJoined")?.value || "",
    };

    // Handle password for new users or when changing password for existing users
    if (!editingItem) {
      // New user - password is required
      if (!newPassword) {
        alert("Password is required for new users");
        return;
      }
      data.password = newPassword;
    } else {
      // Editing user - only update password if a new one is provided
      if (newPassword) {
        data.password = newPassword;
      } else {
        // Keep the existing password
        data.password = editingItem.password;
      }
    }

    if (!data.username || !data.name || !data.role) {
      alert("Please fill in required fields");
      return;
    }

    if (editingItem) {
      Object.assign(editingItem, data);
    } else {
      data.id = users.length > 0 ? Math.max(...users.map((u) => u.id)) + 1 : 1;
      users.push(data);
    }
    renderUsers();
  }

  updateDashboard();
  closeModal();
}

// Report generation placeholders
// ========================================
// ENHANCED REPORTS SYSTEM
// ========================================

// Utility function to format currency
function formatCurrency(amount) {
  return (
    "₱" +
    amount.toLocaleString("en-PH", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })
  );
}

// Utility function to format date
function formatReportDate(dateString) {
  const date = new Date(dateString);
  return date.toLocaleDateString("en-PH", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

// Create and show modal with animation from source element
function showReportModal(title, content, sourceElement) {
  // Get the position of the clicked card
  let startRect = null;
  if (sourceElement) {
    startRect = sourceElement.getBoundingClientRect();

    // Add clicked animation to card
    sourceElement.style.transform = "scale(0.95)";
    sourceElement.style.opacity = "0.7";
    setTimeout(() => {
      sourceElement.style.transform = "";
      sourceElement.style.opacity = "";
    }, 300);
  }

  const modal = document.createElement("div");
  modal.id = "report-modal";
  modal.className =
    "fixed inset-0 bg-black bg-opacity-0 flex items-center justify-center z-50 p-4";

  modal.innerHTML = `
    <div id="modal-content" class="bg-white rounded-xl shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-hidden flex flex-col" 
         style="${startRect ? `transform-origin: ${startRect.left + startRect.width / 2}px ${startRect.top + startRect.height / 2}px; transform: scale(0) translate(${startRect.left - window.innerWidth / 2}px, ${startRect.top - window.innerHeight / 2}px); opacity: 0;` : "transform: scale(0.8); opacity: 0;"}">
      <div class="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-6 py-4 flex justify-between items-center">
        <h2 class="text-2xl font-bold">${title}</h2>
        <button onclick="closeReportModal()" class="text-white hover:text-gray-200 text-2xl hover:rotate-90 transition-transform duration-300">
          <i class="fas fa-times"></i>
        </button>
      </div>
      <div class="p-6 overflow-y-auto flex-1">
        ${content}
      </div>
    </div>
  `;

  document.body.appendChild(modal);

  // Trigger animations after a brief delay
  requestAnimationFrame(() => {
    // Fade in backdrop
    modal.style.transition = "background-color 0.4s ease-out";
    modal.style.backgroundColor = "rgba(0, 0, 0, 0.5)";

    // Expand and fade in modal content
    const modalContent = document.getElementById("modal-content");
    modalContent.style.transition =
      "all 0.5s cubic-bezier(0.34, 1.56, 0.64, 1)";
    modalContent.style.transform = "scale(1) translate(0, 0)";
    modalContent.style.opacity = "1";
  });
}

// Close modal with smooth animation
function closeReportModal() {
  const modal = document.getElementById("report-modal");
  const modalContent = document.getElementById("modal-content");

  if (modal && modalContent) {
    // Fade out backdrop
    modal.style.transition = "background-color 0.3s ease-out";
    modal.style.backgroundColor = "rgba(0, 0, 0, 0)";

    // Shrink and fade out modal content
    modalContent.style.transition = "all 0.3s ease-out";
    modalContent.style.transform = "scale(0.8)";
    modalContent.style.opacity = "0";

    setTimeout(() => modal.remove(), 300);
  }
}

// Export to CSV function
function exportToCSV(data, filename) {
  const headers = Object.keys(data[0]);
  const csvContent = [
    headers.join(","),
    ...data.map((row) =>
      headers
        .map((header) => {
          const value = row[header];
          return typeof value === "string" && value.includes(",")
            ? `"${value}"`
            : value;
        })
        .join(","),
    ),
  ].join("\n");

  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = `${filename}_${new Date().toISOString().split("T")[0]}.csv`;
  link.click();
}

// 1. MEMBER REPORT
function generateMemberReport(event) {
  if (!members || members.length === 0) {
    alert("No members data available. Please add members first.");
    return;
  }

  const sourceElement = event ? event.currentTarget : null;
  const activeMembers = members.filter((m) => m.status === "Active").length;
  const inactiveMembers = members.filter(
    (m) => m.status === "Inactive" || m.status !== "Active",
  ).length;
  const avgAge =
    members.length > 0
      ? Math.round(
          members.reduce((sum, m) => sum + (parseInt(m.age) || 0), 0) /
            members.length,
        )
      : 0;

  const content = `
    <div class="space-y-6">
      <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div class="bg-blue-50 rounded-lg p-4 border-l-4 border-blue-600">
          <p class="text-sm text-gray-600">Total Members</p>
          <p class="text-3xl font-bold text-blue-600">${members.length}</p>
        </div>
        <div class="bg-green-50 rounded-lg p-4 border-l-4 border-green-600">
          <p class="text-sm text-gray-600">Active</p>
          <p class="text-3xl font-bold text-green-600">${activeMembers}</p>
        </div>
        <div class="bg-orange-50 rounded-lg p-4 border-l-4 border-orange-600">
          <p class="text-sm text-gray-600">Inactive</p>
          <p class="text-3xl font-bold text-orange-600">${inactiveMembers}</p>
        </div>
        <div class="bg-purple-50 rounded-lg p-4 border-l-4 border-purple-600">
          <p class="text-sm text-gray-600">Avg. Age</p>
          <p class="text-3xl font-bold text-purple-600">${avgAge}</p>
        </div>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div class="bg-white border rounded-lg p-4">
          <h3 class="font-bold text-lg mb-4">Gender Distribution</h3>
          <canvas id="genderChart"></canvas>
        </div>
        <div class="bg-white border rounded-lg p-4">
          <h3 class="font-bold text-lg mb-4">Status Distribution</h3>
          <canvas id="statusChart"></canvas>
        </div>
      </div>

      <div class="flex justify-end gap-3">
        <button onclick="exportMemberReportCSV()" 
                class="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition">
          <i class="fas fa-file-excel mr-2"></i>Export to CSV
        </button>
        <button onclick="window.print()" 
                class="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition">
          <i class="fas fa-print mr-2"></i>Print Report
        </button>
      </div>

      <div class="bg-white border rounded-lg overflow-hidden">
        <div class="overflow-x-auto">
          <table class="w-full">
            <thead class="bg-gray-100">
              <tr>
                <th class="px-4 py-3 text-left text-sm font-bold">Name</th>
                <th class="px-4 py-3 text-left text-sm font-bold">Age</th>
                <th class="px-4 py-3 text-left text-sm font-bold">Gender</th>
                <th class="px-4 py-3 text-left text-sm font-bold">Ministry</th>
                <th class="px-4 py-3 text-left text-sm font-bold">Status</th>
                <th class="px-4 py-3 text-left text-sm font-bold">Contact</th>
              </tr>
            </thead>
            <tbody>
              ${members
                .map(
                  (member) => `
                <tr class="border-t hover:bg-gray-50">
                  <td class="px-4 py-3 font-semibold">${member.name || member.firstName + " " + member.lastName}</td>
                  <td class="px-4 py-3">${member.age || "N/A"}</td>
                  <td class="px-4 py-3">${member.gender || "N/A"}</td>
                  <td class="px-4 py-3">
                    <span class="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs">${member.ministry || "N/A"}</span>
                  </td>
                  <td class="px-4 py-3">
                    <span class="px-2 py-1 ${member.status === "Active" ? "bg-green-100 text-green-700" : "bg-orange-100 text-orange-700"} rounded text-xs">
                      ${member.status || "Active"}
                    </span>
                  </td>
                  <td class="px-4 py-3 text-sm">
                    <div>${member.phone || member.phoneNumber || "N/A"}</div>
                    <div class="text-gray-500">${member.email || "N/A"}</div>
                  </td>
                </tr>
              `,
                )
                .join("")}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `;

  showReportModal("Member Report", content, sourceElement);
  setTimeout(() => {
    renderGenderChart();
    renderStatusChart();
  }, 100);
}

function exportMemberReportCSV() {
  const csvData = members.map((m) => ({
    name: m.name || m.firstName + " " + m.lastName,
    age: m.age || "N/A",
    gender: m.gender || "N/A",
    ministry: m.ministry || "N/A",
    status: m.status || "Active",
    phone: m.phone || m.phoneNumber || "N/A",
    email: m.email || "N/A",
  }));
  exportToCSV(csvData, "member_report");
}

function renderGenderChart() {
  const males = members.filter((m) => m.gender === "Male").length;
  const females = members.filter((m) => m.gender === "Female").length;
  const ctx = document.getElementById("genderChart");
  if (ctx) {
    new Chart(ctx, {
      type: "doughnut",
      data: {
        labels: ["Male", "Female"],
        datasets: [
          {
            data: [males, females],
            backgroundColor: ["#3B82F6", "#EC4899"],
            borderWidth: 2,
            borderColor: "#fff",
          },
        ],
      },
      options: {
        responsive: true,
        plugins: { legend: { position: "bottom" } },
      },
    });
  }
}

function renderStatusChart() {
  const active = members.filter((m) => m.status === "Active").length;
  const inactive = members.length - active;
  const ctx = document.getElementById("statusChart");
  if (ctx) {
    new Chart(ctx, {
      type: "pie",
      data: {
        labels: ["Active", "Inactive"],
        datasets: [
          {
            data: [active, inactive],
            backgroundColor: ["#10B981", "#F59E0B"],
            borderWidth: 2,
            borderColor: "#fff",
          },
        ],
      },
      options: {
        responsive: true,
        plugins: { legend: { position: "bottom" } },
      },
    });
  }
}

// 2. MINISTRY DISTRIBUTION REPORT
function generateMinistryReport(event) {
  if (!members || members.length === 0) {
    alert("No members data available. Please add members first.");
    return;
  }

  const sourceElement = event ? event.currentTarget : null;

  const ministryCounts = {};
  members.forEach((member) => {
    const ministry = member.ministry || "Unassigned";
    ministryCounts[ministry] = (ministryCounts[ministry] || 0) + 1;
  });

  const ministryData = Object.entries(ministryCounts).map(([name, count]) => ({
    ministry: name,
    members: count,
    percentage: ((count / members.length) * 100).toFixed(1),
  }));

  const content = `
    <div class="space-y-6">
      <div class="bg-white border rounded-lg p-6">
        <h3 class="font-bold text-xl mb-4 text-center">Members by Ministry</h3>
        <div class="max-w-2xl mx-auto">
          <canvas id="ministryChart"></canvas>
        </div>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        ${ministryData
          .map(
            (ministry) => `
          <div class="bg-gradient-to-br from-blue-50 to-purple-50 rounded-lg p-6 border-2 border-blue-200 hover:shadow-lg transition">
            <div class="flex justify-between items-start mb-3">
              <h4 class="font-bold text-lg text-gray-800">${ministry.ministry}</h4>
              <span class="bg-blue-600 text-white px-3 py-1 rounded-full text-sm font-bold">
                ${ministry.members}
              </span>
            </div>
            <div class="flex items-center gap-2">
              <div class="flex-1 bg-gray-200 rounded-full h-3 overflow-hidden">
                <div class="bg-gradient-to-r from-blue-500 to-purple-500 h-full rounded-full" 
                     style="width: ${ministry.percentage}%"></div>
              </div>
              <span class="text-sm font-semibold text-gray-700">${ministry.percentage}%</span>
            </div>
            <p class="text-sm text-gray-600 mt-3">
              ${ministry.members} ${ministry.members === 1 ? "member" : "members"} serving
            </p>
          </div>
        `,
          )
          .join("")}
      </div>

      <div class="flex justify-end gap-3">
        <button onclick="exportMinistryReportCSV()" 
                class="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition">
          <i class="fas fa-file-excel mr-2"></i>Export to CSV
        </button>
        <button onclick="window.print()" 
                class="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition">
          <i class="fas fa-print mr-2"></i>Print Report
        </button>
      </div>
    </div>
  `;

  showReportModal("Ministry Distribution Report", content, sourceElement);
  setTimeout(() => renderMinistryChart(ministryData), 100);
}

function exportMinistryReportCSV() {
  const ministryCounts = {};
  members.forEach((member) => {
    const ministry = member.ministry || "Unassigned";
    ministryCounts[ministry] = (ministryCounts[ministry] || 0) + 1;
  });
  const csvData = Object.entries(ministryCounts).map(([ministry, count]) => ({
    ministry: ministry,
    members: count,
    percentage: ((count / members.length) * 100).toFixed(1) + "%",
  }));
  exportToCSV(csvData, "ministry_distribution");
}

function renderMinistryChart(data) {
  const ctx = document.getElementById("ministryChart");
  if (ctx) {
    new Chart(ctx, {
      type: "bar",
      data: {
        labels: data.map((d) => d.ministry),
        datasets: [
          {
            label: "Members",
            data: data.map((d) => d.members),
            backgroundColor: [
              "#3B82F6",
              "#8B5CF6",
              "#EC4899",
              "#10B981",
              "#F59E0B",
            ],
            borderWidth: 2,
            borderColor: "#fff",
          },
        ],
      },
      options: {
        responsive: true,
        plugins: { legend: { display: false } },
        scales: { y: { beginAtZero: true, ticks: { stepSize: 1 } } },
      },
    });
  }
}

// 3. DONATION SUMMARY REPORT
function generateDonationReport(event) {
  if (!donations || donations.length === 0) {
    alert("No donations data available. Please add donations first.");
    return;
  }

  const sourceElement = event ? event.currentTarget : null;

  const totalDonations = donations.reduce((sum, d) => sum + d.amount, 0);
  const donationsByType = {};
  const donationsByMethod = {};

  donations.forEach((donation) => {
    donationsByType[donation.type] =
      (donationsByType[donation.type] || 0) + donation.amount;
    donationsByMethod[donation.method] =
      (donationsByMethod[donation.method] || 0) + donation.amount;
  });

  const avgDonation = totalDonations / donations.length;
  const uniqueDonors = [...new Set(donations.map((d) => d.donor))].length;

  const content = `
    <div class="space-y-6">
      <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div class="bg-green-50 rounded-lg p-4 border-l-4 border-green-600">
          <p class="text-sm text-gray-600">Total Donations</p>
          <p class="text-2xl font-bold text-green-600">${formatCurrency(totalDonations)}</p>
        </div>
        <div class="bg-blue-50 rounded-lg p-4 border-l-4 border-blue-600">
          <p class="text-sm text-gray-600">Transactions</p>
          <p class="text-2xl font-bold text-blue-600">${donations.length}</p>
        </div>
        <div class="bg-purple-50 rounded-lg p-4 border-l-4 border-purple-600">
          <p class="text-sm text-gray-600">Unique Donors</p>
          <p class="text-2xl font-bold text-purple-600">${uniqueDonors}</p>
        </div>
        <div class="bg-orange-50 rounded-lg p-4 border-l-4 border-orange-600">
          <p class="text-sm text-gray-600">Avg. Donation</p>
          <p class="text-2xl font-bold text-orange-600">${formatCurrency(avgDonation)}</p>
        </div>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div class="bg-white border rounded-lg p-4">
          <h3 class="font-bold text-lg mb-4">By Type</h3>
          <canvas id="donationTypeChart"></canvas>
        </div>
        <div class="bg-white border rounded-lg p-4">
          <h3 class="font-bold text-lg mb-4">By Method</h3>
          <canvas id="donationMethodChart"></canvas>
        </div>
      </div>

      <div class="flex justify-end gap-3">
        <button onclick="exportDonationReportCSV()" 
                class="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition">
          <i class="fas fa-file-excel mr-2"></i>Export to CSV
        </button>
        <button onclick="window.print()" 
                class="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition">
          <i class="fas fa-print mr-2"></i>Print Report
        </button>
      </div>

      <div class="bg-white border rounded-lg overflow-hidden">
        <div class="bg-gradient-to-r from-green-600 to-blue-600 text-white px-6 py-4 font-bold text-lg">
          Transaction History
        </div>
        <div class="overflow-x-auto">
          <table class="w-full">
            <thead class="bg-gray-100">
              <tr>
                <th class="px-4 py-3 text-left text-sm font-bold">Date</th>
                <th class="px-4 py-3 text-left text-sm font-bold">Donor</th>
                <th class="px-4 py-3 text-left text-sm font-bold">Type</th>
                <th class="px-4 py-3 text-left text-sm font-bold">Method</th>
                <th class="px-4 py-3 text-right text-sm font-bold">Amount</th>
              </tr>
            </thead>
            <tbody>
              ${donations
                .map(
                  (donation) => `
                <tr class="border-t hover:bg-gray-50">
                  <td class="px-4 py-3">${formatReportDate(donation.date)}</td>
                  <td class="px-4 py-3 font-semibold">${donation.donor}</td>
                  <td class="px-4 py-3">
                    <span class="px-2 py-1 bg-purple-100 text-purple-700 rounded text-xs">${donation.type}</span>
                  </td>
                  <td class="px-4 py-3">
                    <span class="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs">${donation.method}</span>
                  </td>
                  <td class="px-4 py-3 text-right font-bold text-green-600">${formatCurrency(donation.amount)}</td>
                </tr>
              `,
                )
                .join("")}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `;

  showReportModal("Donation Summary Report", content, sourceElement);
  setTimeout(() => {
    renderDonationTypeChart(donationsByType);
    renderDonationMethodChart(donationsByMethod);
  }, 100);
}

function exportDonationReportCSV() {
  exportToCSV(donations, "donation_summary");
}

function renderDonationTypeChart(data) {
  const ctx = document.getElementById("donationTypeChart");
  if (ctx) {
    new Chart(ctx, {
      type: "doughnut",
      data: {
        labels: Object.keys(data),
        datasets: [
          {
            data: Object.values(data),
            backgroundColor: [
              "#10B981",
              "#3B82F6",
              "#8B5CF6",
              "#F59E0B",
              "#EC4899",
            ],
            borderWidth: 2,
            borderColor: "#fff",
          },
        ],
      },
      options: {
        responsive: true,
        plugins: {
          legend: { position: "bottom" },
          tooltip: {
            callbacks: {
              label: function (context) {
                return context.label + ": " + formatCurrency(context.raw);
              },
            },
          },
        },
      },
    });
  }
}

function renderDonationMethodChart(data) {
  const ctx = document.getElementById("donationMethodChart");
  if (ctx) {
    new Chart(ctx, {
      type: "pie",
      data: {
        labels: Object.keys(data),
        datasets: [
          {
            data: Object.values(data),
            backgroundColor: ["#3B82F6", "#10B981", "#F59E0B"],
            borderWidth: 2,
            borderColor: "#fff",
          },
        ],
      },
      options: {
        responsive: true,
        plugins: {
          legend: { position: "bottom" },
          tooltip: {
            callbacks: {
              label: function (context) {
                return context.label + ": " + formatCurrency(context.raw);
              },
            },
          },
        },
      },
    });
  }
}

// 4. MONTHLY TRENDS REPORT
function generateMonthlyReport(event) {
  const monthlyStats = generateMonthlyStats();

  if (monthlyStats.length === 0) {
    alert(
      "Not enough data to generate monthly trends. Please add more members and donations.",
    );
    return;
  }

  const sourceElement = event ? event.currentTarget : null;

  const content = `
    <div class="space-y-6">
      <div class="grid grid-cols-1 gap-6">
        <div class="bg-white border rounded-lg p-6">
          <h3 class="font-bold text-xl mb-4">New Members Trend</h3>
          <canvas id="membersTrendChart"></canvas>
        </div>
        
        <div class="bg-white border rounded-lg p-6">
          <h3 class="font-bold text-xl mb-4">Donations Trend</h3>
          <canvas id="donationsTrendChart"></canvas>
        </div>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div class="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-4 border-2 border-blue-300">
          <p class="text-sm text-gray-600 mb-2">Latest Month</p>
          <div class="space-y-2">
            <div class="flex justify-between items-center">
              <span class="text-xs text-gray-600">New Members:</span>
              <span class="font-bold text-blue-600">${monthlyStats[monthlyStats.length - 1].newMembers}</span>
            </div>
            <div class="flex justify-between items-center">
              <span class="text-xs text-gray-600">Donations:</span>
              <span class="font-bold text-green-600">${formatCurrency(monthlyStats[monthlyStats.length - 1].totalDonations)}</span>
            </div>
          </div>
        </div>
        
        <div class="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-4 border-2 border-green-300">
          <p class="text-sm text-gray-600 mb-2">Total Growth</p>
          <div><span class="text-xs text-gray-600">New Members (${monthlyStats.length}mo)</span>
            <p class="text-2xl font-bold text-green-600">${monthlyStats.reduce((sum, s) => sum + s.newMembers, 0)}</p>
          </div>
        </div>

        <div class="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg p-4 border-2 border-purple-300">
          <p class="text-sm text-gray-600 mb-2">Total Donations</p>
          <div><span class="text-xs text-gray-600">Last ${monthlyStats.length} Months</span>
            <p class="text-xl font-bold text-purple-600">${formatCurrency(monthlyStats.reduce((sum, s) => sum + s.totalDonations, 0))}</p>
          </div>
        </div>

        <div class="bg-gradient-to-br from-orange-50 to-orange-100 rounded-lg p-4 border-2 border-orange-300">
          <p class="text-sm text-gray-600 mb-2">Avg. Donation</p>
          <div><span class="text-xs text-gray-600">Per Month</span>
            <p class="text-xl font-bold text-orange-600">${formatCurrency(monthlyStats.reduce((sum, s) => sum + s.totalDonations, 0) / monthlyStats.length)}</p>
          </div>
        </div>
      </div>

      <div class="flex justify-end gap-3">
        <button onclick="exportMonthlyReportCSV()" 
                class="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition">
          <i class="fas fa-file-excel mr-2"></i>Export to CSV
        </button>
        <button onclick="window.print()" 
                class="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition">
          <i class="fas fa-print mr-2"></i>Print Report
        </button>
      </div>

      <div class="bg-white border rounded-lg overflow-hidden">
        <div class="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-4 font-bold text-lg">Monthly Breakdown</div>
        <table class="w-full">
          <thead class="bg-gray-100">
            <tr>
              <th class="px-6 py-3 text-left font-bold">Month</th>
              <th class="px-6 py-3 text-center font-bold">New Members</th>
              <th class="px-6 py-3 text-right font-bold">Total Donations</th>
            </tr>
          </thead>
          <tbody>
            ${monthlyStats
              .map(
                (stat) => `
              <tr class="border-t hover:bg-gray-50">
                <td class="px-6 py-4 font-bold text-blue-600">${stat.month}</td>
                <td class="px-6 py-4 text-center">
                  <span class="bg-green-100 text-green-700 px-3 py-1 rounded-full font-bold">${stat.newMembers}</span>
                </td>
                <td class="px-6 py-4 text-right font-bold text-green-600">${formatCurrency(stat.totalDonations)}</td>
              </tr>
            `,
              )
              .join("")}
          </tbody>
        </table>
      </div>
    </div>
  `;

  showReportModal("Monthly Trends Report", content, sourceElement);
  setTimeout(() => {
    renderMembersTrendChart(monthlyStats);
    renderDonationsTrendChart(monthlyStats);
  }, 100);
}

function generateMonthlyStats() {
  const monthlyData = {};
  members.forEach((member) => {
    const joinDate = member.joinDate || member.membershipDate || member.date;
    if (joinDate) {
      const date = new Date(joinDate);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
      if (!monthlyData[monthKey])
        monthlyData[monthKey] = { newMembers: 0, totalDonations: 0 };
      monthlyData[monthKey].newMembers++;
    }
  });

  donations.forEach((donation) => {
    const date = new Date(donation.date);
    const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
    if (!monthlyData[monthKey])
      monthlyData[monthKey] = { newMembers: 0, totalDonations: 0 };
    monthlyData[monthKey].totalDonations += donation.amount;
  });

  const monthlyStats = Object.entries(monthlyData)
    .map(([monthKey, data]) => {
      const [year, month] = monthKey.split("-");
      const date = new Date(year, parseInt(month) - 1);
      return {
        month: date.toLocaleDateString("en-US", {
          month: "short",
          year: "numeric",
        }),
        newMembers: data.newMembers,
        totalDonations: data.totalDonations,
      };
    })
    .sort((a, b) => new Date(a.month) - new Date(b.month));

  return monthlyStats;
}

function exportMonthlyReportCSV() {
  const monthlyStats = generateMonthlyStats();
  exportToCSV(monthlyStats, "monthly_trends");
}

function renderMembersTrendChart(monthlyStats) {
  const ctx = document.getElementById("membersTrendChart");
  if (ctx) {
    new Chart(ctx, {
      type: "line",
      data: {
        labels: monthlyStats.map((s) => s.month),
        datasets: [
          {
            label: "New Members",
            data: monthlyStats.map((s) => s.newMembers),
            borderColor: "#3B82F6",
            backgroundColor: "rgba(59, 130, 246, 0.1)",
            borderWidth: 3,
            fill: true,
            tension: 0.4,
          },
        ],
      },
      options: {
        responsive: true,
        plugins: { legend: { display: false } },
        scales: { y: { beginAtZero: true, ticks: { stepSize: 1 } } },
      },
    });
  }
}

function renderDonationsTrendChart(monthlyStats) {
  const ctx = document.getElementById("donationsTrendChart");
  if (ctx) {
    new Chart(ctx, {
      type: "bar",
      data: {
        labels: monthlyStats.map((s) => s.month),
        datasets: [
          {
            label: "Donations (₱)",
            data: monthlyStats.map((s) => s.totalDonations),
            backgroundColor: "#10B981",
            borderWidth: 2,
            borderColor: "#fff",
            borderRadius: 8,
          },
        ],
      },
      options: {
        responsive: true,
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: {
              label: function (context) {
                return formatCurrency(context.raw);
              },
            },
          },
        },
        scales: {
          y: {
            beginAtZero: true,
            ticks: {
              callback: function (value) {
                return "₱" + (value >= 1000 ? value / 1000 + "k" : value);
              },
            },
          },
        },
      },
    });
  }
}

// Dropdown toggle functions
function toggleDropdown() {
  const dropdown = document.getElementById("admin-dropdown");
  const btn = document.querySelector(".dropdown-btn");

  dropdown.classList.toggle("open");
  btn.classList.toggle("active");
}

function toggleSuperDropdown() {
  const dropdown = document.getElementById("superadmin-dropdown");
  const btn = document.querySelector(".dropdown-btn-super");

  dropdown.classList.toggle("open");
  btn.classList.toggle("active");
}

// Toggle Settings Menu
function toggleSettingsMenu() {
  const dropdown = document.getElementById("settings-dropdown");
  dropdown.classList.toggle("hidden");
  // Also close appearance submenu when main menu closes
  if (dropdown.classList.contains("hidden")) {
    const submenu = document.getElementById("appearance-submenu");
    if (submenu) submenu.classList.add("hidden");
    const chevron = document.querySelector(".appearance-chevron");
    if (chevron) chevron.classList.remove("open");
  }
}

// Close settings menu when clicking outside
document.addEventListener("click", function (event) {
  const settingsContainer = document.querySelector(".settings-menu-container");
  const settingsDropdown = document.getElementById("settings-dropdown");

  if (
    settingsContainer &&
    settingsDropdown &&
    !settingsContainer.contains(event.target)
  ) {
    settingsDropdown.classList.add("hidden");
    const submenu = document.getElementById("appearance-submenu");
    if (submenu) submenu.classList.add("hidden");
    const chevron = document.querySelector(".appearance-chevron");
    if (chevron) chevron.classList.remove("open");
  }
});

// ========================================
// APPEARANCE / THEME FUNCTIONS
// ========================================

function toggleAppearanceMenu(event) {
  event.stopPropagation();
  const submenu = document.getElementById("appearance-submenu");
  const chevron = document.querySelector(".appearance-chevron");

  submenu.classList.toggle("hidden");
  if (chevron) chevron.classList.toggle("open");
}

function setTheme(theme) {
  // Remove all theme classes
  document.body.classList.remove("dark-mode", "night-mode");

  if (theme === "dark") {
    document.body.classList.add("dark-mode");
  } else if (theme === "night") {
    document.body.classList.add("night-mode");
  }
  // 'light' = default, no extra class needed

  // Save to localStorage
  localStorage.setItem("churchDashboardTheme", theme);

  // Update active checkmark
  document.querySelectorAll(".appearance-option").forEach((btn) => {
    btn.classList.remove("active-theme");
    const check = btn.querySelector(".theme-check");
    if (check) check.classList.add("hidden");
  });

  const activeBtn = document.querySelector(
    `.appearance-option[data-theme="${theme}"]`,
  );
  if (activeBtn) {
    activeBtn.classList.add("active-theme");
    const check = activeBtn.querySelector(".theme-check");
    if (check) check.classList.remove("hidden");
  }

  // Show toast notification
  const themeNames = {
    light: "☀️ Light Mode",
    dark: "🌙 Dark Mode",
    night: "⭐ Night Light",
  };
  showThemeToast(themeNames[theme] || "Theme applied");
}

function showThemeToast(message) {
  // Remove existing toast
  const existing = document.getElementById("theme-toast");
  if (existing) existing.remove();

  const toast = document.createElement("div");
  toast.id = "theme-toast";
  toast.innerHTML = `<i class="fas fa-check-circle mr-2"></i>${message} applied`;
  toast.style.cssText = `
    position: fixed;
    bottom: 24px;
    right: 24px;
    background: #1d4ed8;
    color: white;
    padding: 12px 20px;
    border-radius: 10px;
    font-size: 14px;
    font-weight: 600;
    box-shadow: 0 8px 24px rgba(0,0,0,0.2);
    z-index: 99999;
    animation: slideInRight 0.3s ease;
    display: flex;
    align-items: center;
  `;
  document.body.appendChild(toast);
  setTimeout(() => {
    toast.style.animation = "fadeOut 0.3s ease forwards";
    setTimeout(() => toast.remove(), 300);
  }, 2500);
}

// Apply saved theme on page load
function applyStoredTheme() {
  const savedTheme = localStorage.getItem("churchDashboardTheme") || "light";
  setTheme(savedTheme);
}

// ========================================
// LOGOUT FROM MENU
// ========================================

function handleLogoutFromMenu() {
  // Close the settings dropdown first
  const dropdown = document.getElementById("settings-dropdown");
  if (dropdown) dropdown.classList.add("hidden");

  // Call handleLogout() from logout.js — shows the nice confirmation modal
  if (typeof handleLogout === "function") {
    handleLogout();
  } else if (typeof logout === "function") {
    logout();
  } else if (typeof logoutUser === "function") {
    logoutUser();
  } else {
    // Fallback: show confirmation then redirect
    showConfirmModal({
      title: "Logout",
      message: "Are you sure you want to logout?",
      confirmText: "Logout",
      confirmClass: "bg-red-600 hover:bg-red-700",
      icon: "fa-sign-out-alt",
      iconClass: "text-red-500",
      onConfirm: () => {
        sessionStorage.clear();
        localStorage.removeItem("churchUser");
        window.location.href = "../index.html";
      },
    });
  }
}

// Add this to your dashboard.js file or create a new charts.js file

// Initialize Charts when dashboard loads
function initializeDashboardCharts() {
  // Check if Chart.js is loaded
  if (typeof Chart === "undefined") {
    console.log("Loading Chart.js...");
    const script = document.createElement("script");
    script.src = "https://cdn.jsdelivr.net/npm/chart.js";
    script.onload = () => {
      createTrendsChart();
      createMinistryChart();
    };
    document.head.appendChild(script);
  } else {
    createTrendsChart();
    createMinistryChart();
  }
}

// Monthly Trends Line Chart
function createTrendsChart() {
  const ctx = document.getElementById("trendsChart");
  if (!ctx) return;

  // Destroy existing chart instance to prevent "Canvas already in use" error
  const existingChart = Chart.getChart(ctx);
  if (existingChart) existingChart.destroy();

  const trendsChart = new Chart(ctx, {
    type: "line",
    data: {
      labels: [
        "Jan",
        "Feb",
        "Mar",
        "Apr",
        "May",
        "Jun",
        "Jul",
        "Aug",
        "Sep",
        "Oct",
        "Nov",
        "Dec",
      ],
      datasets: [
        {
          label: "Members",
          data: [120, 125, 130, 128, 135, 140, 145, 148, 152, 155, 160, 165],
          borderColor: "#2563eb",
          backgroundColor: "rgba(37, 99, 235, 0.1)",
          tension: 0.4,
          fill: true,
          pointRadius: 4,
          pointHoverRadius: 6,
        },
        {
          label: "Donations ($1000s)",
          data: [15, 18, 20, 17, 22, 25, 28, 26, 30, 32, 35, 38],
          borderColor: "#10b981",
          backgroundColor: "rgba(16, 185, 129, 0.1)",
          tension: 0.4,
          fill: true,
          pointRadius: 4,
          pointHoverRadius: 6,
        },
        {
          label: "Events",
          data: [8, 10, 9, 12, 11, 10, 13, 12, 14, 15, 13, 16],
          borderColor: "#8b5cf6",
          backgroundColor: "rgba(139, 92, 246, 0.1)",
          tension: 0.4,
          fill: true,
          pointRadius: 4,
          pointHoverRadius: 6,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: true,
          position: "bottom",
          labels: {
            usePointStyle: true,
            padding: 15,
            font: {
              size: 12,
            },
          },
        },
        tooltip: {
          mode: "index",
          intersect: false,
          backgroundColor: "rgba(0,0,0,0.8)",
          padding: 12,
          cornerRadius: 8,
          titleFont: {
            size: 14,
            weight: "bold",
          },
          bodyFont: {
            size: 13,
          },
        },
      },
      scales: {
        x: {
          grid: {
            display: false,
          },
          ticks: {
            font: {
              size: 11,
            },
          },
        },
        y: {
          beginAtZero: true,
          grid: {
            color: "rgba(0,0,0,0.05)",
          },
          ticks: {
            font: {
              size: 11,
            },
          },
        },
      },
      interaction: {
        mode: "nearest",
        axis: "x",
        intersect: false,
      },
    },
  });
}

// Ministry Distribution Doughnut Chart
function createMinistryChart() {
  const ctx = document.getElementById("ministryChart");
  if (!ctx) return;

  // Destroy existing chart instance to prevent "Canvas already in use" error
  const existingChart = Chart.getChart(ctx);
  if (existingChart) existingChart.destroy();

  const ministryChart = new Chart(ctx, {
    type: "doughnut",
    data: {
      labels: ["Worship", "Youth", "Outreach", "Admin", "Children", "Media"],
      datasets: [
        {
          data: [30, 25, 20, 10, 10, 5],
          backgroundColor: [
            "#2563eb",
            "#10b981",
            "#f59e0b",
            "#8b5cf6",
            "#ef4444",
            "#06b6d4",
          ],
          borderWidth: 2,
          borderColor: "#ffffff",
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: true,
          position: "bottom",
          labels: {
            usePointStyle: true,
            padding: 15,
            font: {
              size: 12,
            },
            generateLabels: function (chart) {
              const data = chart.data;
              if (data.labels.length && data.datasets.length) {
                return data.labels.map((label, i) => {
                  const value = data.datasets[0].data[i];
                  const total = data.datasets[0].data.reduce(
                    (a, b) => a + b,
                    0,
                  );
                  const percentage = ((value / total) * 100).toFixed(0);
                  return {
                    text: `${label} (${percentage}%)`,
                    fillStyle: data.datasets[0].backgroundColor[i],
                    hidden: false,
                    index: i,
                  };
                });
              }
              return [];
            },
          },
        },
        tooltip: {
          backgroundColor: "rgba(0,0,0,0.8)",
          padding: 12,
          cornerRadius: 8,
          titleFont: {
            size: 14,
            weight: "bold",
          },
          bodyFont: {
            size: 13,
          },
          callbacks: {
            label: function (context) {
              const label = context.label || "";
              const value = context.parsed;
              const total = context.dataset.data.reduce((a, b) => a + b, 0);
              const percentage = ((value / total) * 100).toFixed(1);
              return `${label}: ${value} members (${percentage}%)`;
            },
          },
        },
      },
    },
  });
}

// Update current time in dashboard
function updateCurrentTime() {
  const timeElement = document.getElementById("current-time");
  if (!timeElement) return;

  function updateTime() {
    const now = new Date();
    const options = {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: true,
    };
    timeElement.textContent = now.toLocaleTimeString("en-US", options);
  }

  updateTime();
  setInterval(updateTime, 1000);
}

// Animate stats numbers on load - using REAL data from database
async function animateStatsNumbers() {
  try {
    // Fetch real stats from database first
    const response = await fetch("dashboard_stats.php");
    const result = await response.json();

    if (result.status !== "success") return;

    const statElements = [
      { id: "total-members", target: result.data.totalMembers },
      { id: "total-donations-dash", target: 38500, prefix: "$", format: true }, // Keep fake for now
      { id: "total-events-dash", target: result.data.upcomingEvents },
      { id: "total-users-dash", target: 8 }, // Keep fake for now
    ];

    statElements.forEach((stat) => {
      const element = document.getElementById(stat.id);
      if (!element) return;

      const duration = 1500;
      const steps = 30;
      const increment = stat.target / steps;
      let current = 0;
      let step = 0;

      const timer = setInterval(() => {
        current += increment;
        step++;

        let displayValue = Math.floor(current);

        if (stat.format) {
          displayValue = displayValue.toLocaleString();
        }

        if (stat.prefix) {
          element.textContent = stat.prefix + displayValue;
        } else {
          element.textContent = displayValue;
        }

        if (step >= steps) {
          clearInterval(timer);
          let finalValue = stat.target;
          if (stat.format) {
            finalValue = finalValue.toLocaleString();
          }
          if (stat.prefix) {
            element.textContent = stat.prefix + finalValue;
          } else {
            element.textContent = finalValue;
          }
        }
      }, duration / steps);
    });
  } catch (error) {
    console.error("Error animating stats:", error);
  }
}

// Call these functions when dashboard loads
document.addEventListener("DOMContentLoaded", () => {
  initializeDashboardCharts();
  updateCurrentTime();
  // animateStatsNumbers(); // DISABLED - using real data from database
});

// Also call when switching to dashboard tab
function onDashboardTabActivated() {
  // Reinitialize charts if they don't exist
  if (!document.getElementById("trendsChart")?.chart) {
    initializeDashboardCharts();
  }
  updateCurrentTime();
}

// Real-time auto-update for members list
let membersUpdateInterval;

function startMembersAutoUpdate() {
  // Update every 5 seconds (5000 milliseconds)
  membersUpdateInterval = setInterval(async () => {
    // Only update if we're on the members tab
    const membersTab = document.getElementById("members-tab");
    if (membersTab && !membersTab.classList.contains("hidden")) {
      await loadMembersFromDatabase();
    }
  }, 5000); // Change this value to adjust update frequency
}

function stopMembersAutoUpdate() {
  if (membersUpdateInterval) {
    clearInterval(membersUpdateInterval);
  }
}

// Start auto-update when page loads
document.addEventListener("DOMContentLoaded", () => {
  startMembersAutoUpdate();
});

// Stop auto-update when page is hidden (browser tab inactive)
document.addEventListener("visibilitychange", () => {
  if (document.hidden) {
    stopMembersAutoUpdate();
  } else {
    startMembersAutoUpdate();
  }
});
// ========================================
// ROLE-BASED DASHBOARD VISIBILITY
// ========================================
// ROLE-BASED DASHBOARD VISIBILITY (CRITICAL FIX)
// ========================================

function applyRoleBasedVisibility() {
  // Try multiple sources to get the current user
  let user = currentUser;

  if (!user) {
    try {
      const session = sessionStorage.getItem("churchUser");
      if (session) {
        user = JSON.parse(session);
        // Also set currentUser if it wasn't set
        if (!currentUser) {
          currentUser = user;
        }
      }
    } catch (e) {
      console.error("Error reading session:", e);
    }
  }

  if (!user) {
    try {
      const localData = localStorage.getItem("currentUser");
      if (localData) {
        user = JSON.parse(localData);
      }
    } catch (e) {
      console.error("Error reading localStorage:", e);
    }
  }

  const userRole = user ? user.role : "user";

  // Remove any existing role classes
  document.body.className = document.body.className.replace(/role-\w+/g, "");

  // Add current role class to body - THIS IS CRITICAL FOR CSS
  document.body.classList.add("role-" + userRole);

  console.log("✅ Applied role-based visibility for role:", userRole);
  console.log("🔍 Body classes:", document.body.className);
}

// Run this IMMEDIATELY when the script loads (before DOMContentLoaded)
applyRoleBasedVisibility();

// Also run when DOM is ready (in case currentUser wasn't set yet)
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", applyRoleBasedVisibility);
} else {
  applyRoleBasedVisibility();
}

// ========================================
// REMOVE USER DASHBOARD VIEW MESSAGE
// ========================================

function removeUserDashboardViewMessage() {
  // Method 1: Find and remove by text content
  const allDivs = document.querySelectorAll("div");

  allDivs.forEach((div) => {
    const text = div.textContent || "";

    // Check if this div contains the restriction message
    if (
      (text.includes("User Dashboard View") ||
        text.includes("You're viewing limited dashboard information") ||
        text.includes("viewing limited dashboard") ||
        text.includes("Contact an administrator for full access")) &&
      text.length < 500
    ) {
      // Ensure it's not a large container

      // Check if it's the actual alert box
      if (
        div.classList.contains("bg-blue-50") ||
        div.classList.contains("bg-blue-100") ||
        div.classList.contains("border-l-4") ||
        div.querySelector(".fa-info-circle")
      ) {
        div.remove();
        console.log("🗑️ Removed user restriction message");
      }
    }
  });

  // Method 2: Remove by common styling patterns
  document
    .querySelectorAll(
      ".bg-blue-50.border-l-4, .bg-blue-100.border-l-4, .border-l-4.border-blue-500",
    )
    .forEach((el) => {
      const text = el.textContent || "";
      if (
        text.includes("viewing") ||
        text.includes("limited") ||
        text.includes("administrator")
      ) {
        el.remove();
        console.log("🗑️ Removed restriction alert by class");
      }
    });

  // Method 3: Remove by finding info-circle icons with restriction text
  document.querySelectorAll(".fa-info-circle").forEach((icon) => {
    const container = icon.closest("div");
    if (container) {
      const text = container.textContent || "";
      if (
        text.includes("User Dashboard View") ||
        text.includes("limited dashboard") ||
        text.includes("administrator")
      ) {
        container.remove();
        console.log("🗑️ Removed restriction message by icon");
      }
    }
  });
}

// ========================================
// INITIALIZATION
// ========================================

// Run on DOM ready
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", function () {
    applyRoleBasedVisibility();
    removeUserDashboardViewMessage();
  });
} else {
  applyRoleBasedVisibility();
  removeUserDashboardViewMessage();
}

// Run after delays to catch dynamically loaded content
setTimeout(function () {
  applyRoleBasedVisibility();
  removeUserDashboardViewMessage();
}, 100);

setTimeout(function () {
  removeUserDashboardViewMessage();
}, 500);

setTimeout(function () {
  removeUserDashboardViewMessage();
}, 1000);

setTimeout(function () {
  removeUserDashboardViewMessage();
}, 2000);

// Monitor for dynamic content changes
const dashboardObserver = new MutationObserver(function (mutations) {
  mutations.forEach(function (mutation) {
    if (mutation.addedNodes.length) {
      removeUserDashboardViewMessage();
    }
  });
});

// Start observing after page loads
setTimeout(function () {
  const dashboardTab = document.getElementById("dashboard-tab");
  if (dashboardTab) {
    dashboardObserver.observe(dashboardTab, {
      childList: true,
      subtree: true,
    });
    console.log("👀 Monitoring dashboard for restriction messages");
  }
}, 500);

// Run periodically as backup
setInterval(removeUserDashboardViewMessage, 3000);

// ========================================
// HOOK INTO EXISTING FUNCTIONS
// ========================================

// Hook into switchTab function
const originalSwitchTabFunc = window.switchTab;
if (typeof switchTab === "function") {
  window.switchTab = function (tabName) {
    if (originalSwitchTabFunc) {
      originalSwitchTabFunc.apply(this, arguments);
    }

    if (tabName === "dashboard") {
      setTimeout(function () {
        removeUserDashboardViewMessage();
        applyRoleBasedVisibility();
        loadRecentActivity();
      }, 100);
    }
  };
}

// Hook into user profile initialization
const originalInitUserProfile = window.initializeUserProfile;
if (typeof initializeUserProfile === "function") {
  window.initializeUserProfile = function () {
    if (originalInitUserProfile) {
      originalInitUserProfile.apply(this, arguments);
    }

    setTimeout(function () {
      applyRoleBasedVisibility();
      removeUserDashboardViewMessage();
    }, 200);
  };
}

// ========================================
// HEADER DATE/TIME UPDATE
// ========================================

function updateHeaderDateTime() {
  const now = new Date();
  const dateEl = document.getElementById("header-date");
  const timeEl = document.getElementById("header-time");

  if (dateEl) {
    dateEl.textContent = now.toLocaleDateString("en-US", {
      weekday: "long",
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  }

  if (timeEl) {
    timeEl.textContent = now.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  }
}

// Initialize header time updates
if (document.getElementById("header-date")) {
  updateHeaderDateTime();
  setInterval(updateHeaderDateTime, 1000);
}

console.log("✅ Dashboard role-based system initialized");

document.addEventListener("visibilitychange", () => {
  if (document.hidden) {
    stopHeartbeat();
    stopStatsAutoRefresh();
  } else {
    startHeartbeat();
    startStatsAutoRefresh();
  }
});

// ============================================================================
// QR CODE & ATTENDANCE SYSTEM - COMPLETE IMPLEMENTATION
// ============================================================================
// Add this entire section to the END of your dashboard.js file (before the final console.log)
// Location: After line 2629 in your current dashboard.js

// ─── GLOBAL VARIABLES FOR QR & ATTENDANCE ───
let scanInterval = null;

// ─── QR CODE FUNCTIONS FOR PROFILE MODAL ───

/**
 * Toggles the QR code display in the profile modal
 * Shows/hides the QR code and generates it when shown
 */
function toggleProfileQR() {
  const container = document.getElementById("profile-qr-container");
  const label = document.getElementById("profile-qr-toggle-label");
  const icon = document.getElementById("profile-qr-toggle-icon");

  if (!container) return;

  const isHidden = container.classList.contains("hidden");

  if (isHidden) {
    // Show QR code section
    container.classList.remove("hidden");
    label.textContent = "Hide QR";
    icon.classList.replace("fa-eye", "fa-eye-slash");

    // ✅ NEW: Use the high-quality PHP QR generator
    const accountNumber =
      currentUser?.accountNumber || currentUser?.account_number || "";

    if (!accountNumber) {
      alert("Account number not found. Please update your profile.");
      return;
    }
    const qrImage = document.getElementById("profile-qr-code");

    // Load the QR code from generate_qr_simple.php
    qrImage.src = `generate_qr_simple.php?account=${accountNumber}&size=500`;
    qrImage.style.display = "block";
  } else {
    // Hide QR code
    container.classList.add("hidden");
    label.textContent = "Show QR";
    icon.classList.replace("fa-eye-slash", "fa-eye");
  }
}

/**
 * Downloads the profile QR code as a PNG image
 */
function downloadProfileQR() {
  const accountNumber =
    currentUser?.accountNumber || currentUser?.account_number || "";

  if (!accountNumber) {
    alert("Account number not found. Cannot download QR code.");
    return;
  }
  const userName = currentUser?.name || "Member";

  // ✅ NEW: Direct download from generate_qr_simple.php
  const downloadUrl = `generate_qr_simple.php?account=${accountNumber}&size=800&download=1&name=${encodeURIComponent(userName)}`;

  // Create invisible download link
  const a = document.createElement("a");
  a.href = downloadUrl;
  a.download = `JILC_QR_${userName.replace(/\s+/g, "_")}.png`;
  a.click();
}

// ─── STANDALONE "MY QR CODE" MODAL ───

/**
 * Opens a standalone modal showing the user's QR code
 * Can be called from a sidebar button or menu
 */
function openMyQRModal() {
  if (!currentUser) {
    alert("Please log in first");
    return;
  }

  const userId = currentUser.id || currentUser.username || "user";
  const userName = currentUser.name || "Member";
  const qrPayload = JSON.stringify({
    id: userId,
    name: userName,
    type: "jilc_member",
  });

  const modal = `
    <div class="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4" onclick="closeQRModal(event)">
      <div class="bg-white rounded-2xl shadow-2xl max-w-md w-full" onclick="event.stopPropagation()">
        
        <!-- Header -->
        <div class="bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-5 flex justify-between items-center rounded-t-2xl">
          <div>
            <h3 class="text-xl font-bold text-white">My QR Code</h3>
            <p class="text-blue-100 text-sm">Scan this at church events</p>
          </div>
          <button onclick="closeQRModal()" class="text-white hover:text-blue-200 text-2xl transition">
            <i class="fas fa-times"></i>
          </button>
        </div>

        <!-- QR Code Display -->
        <div class="p-8 text-center">
          <div class="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-6 inline-block border-2 border-blue-200 shadow-md">
            <div id="my-qr-container" class="bg-white rounded-lg p-4">
              <!-- QR code will be generated here -->
            </div>
          </div>
          
          <div class="mt-6">
            <h4 class="font-bold text-gray-800 text-lg mb-2">${userName}</h4>
            <p class="text-sm text-gray-500 mb-4">Member ID: ${userId}</p>
            
            <button onclick="downloadMyQR()" class="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-semibold transition shadow-lg flex items-center gap-2 mx-auto">
              <i class="fas fa-download"></i>
              Download QR Code
            </button>
          </div>
        </div>

        <!-- Instructions -->
        <div class="bg-gray-50 px-6 py-4 rounded-b-2xl border-t border-gray-200">
          <p class="text-xs text-gray-600 text-center">
            <i class="fas fa-info-circle text-blue-600 mr-1"></i>
            Show this QR code to check in at church events and activities
          </p>
        </div>
      </div>
    </div>
  `;

  document.getElementById("modal-container").innerHTML = modal;

  // Generate QR code
  setTimeout(() => {
    try {
      const qr = qrcode(0, "M");
      qr.addData(qrPayload);
      qr.make();
      document.getElementById("my-qr-container").innerHTML = qr.createSvgTag(
        7,
        0,
      );
    } catch (e) {
      document.getElementById("my-qr-container").innerHTML =
        '<p class="text-red-500 text-sm">Error generating QR</p>';
      console.error("QR generation error:", e);
    }
  }, 50);
}

/**
 * Closes the My QR Code modal
 */
function closeQRModal(event) {
  if (!event || event.target === event.currentTarget) {
    document.getElementById("modal-container").innerHTML = "";
  }
}

/**
 * Downloads the standalone QR code
 */
function downloadMyQR() {
  const svgEl = document.querySelector("#my-qr-container svg");
  if (!svgEl) return;

  const svgData = new XMLSerializer().serializeToString(svgEl);
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  const img = new Image();
  const svgBlob = new Blob([svgData], { type: "image/svg+xml;charset=utf-8" });
  const url = URL.createObjectURL(svgBlob);

  img.onload = function () {
    canvas.width = img.width;
    canvas.height = img.height;
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(img, 0, 0);
    URL.revokeObjectURL(url);

    const pngUrl = canvas.toDataURL("image/png");
    const a = document.createElement("a");
    a.download =
      "JILC_MyQR_" +
      (currentUser ? currentUser.name.replace(/\s+/g, "_") : "Member") +
      ".png";
    a.href = pngUrl;
    a.click();
  };
  img.src = url;
}

// ═══════════════════════════════════════════════════════════════════════════
// CALENDAR EVENTS - ATTENDANCE MANAGEMENT FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════
// These functions support the Event Calendar page's attendance features
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Opens the attendance management modal for Calendar Events
 * Called from calendar_events.js when "Manage Attendance" button is clicked
 */
function openManageAttendanceModal(eventId, eventTitle) {
  const modal = document.getElementById("manage-event-modal");
  if (!modal) {
    console.error("Manage event modal not found");
    return;
  }

  // Get modal content container
  const modalContent = modal.querySelector(".bg-white");
  if (!modalContent) {
    console.error("Modal content container not found");
    return;
  }

  // Build the modal content
  modalContent.innerHTML = `
    <div class="flex justify-between items-center mb-6 pb-4 border-b">
      <div>
        <h3 class="text-2xl font-bold text-gray-800">${eventTitle}</h3>
        <p class="text-sm text-gray-500 mt-1">Manage Event Attendance</p>
      </div>
      <button onclick="closeManageAttendanceModal()" class="text-gray-400 hover:text-gray-600 text-2xl">
        <i class="fas fa-times"></i>
      </button>
    </div>

    <div class="bg-blue-50 border-l-4 border-blue-500 p-4 mb-6 rounded">
      <div class="flex items-center gap-3">
        <i class="fas fa-info-circle text-blue-600 text-xl"></i>
        <div>
          <p class="font-semibold text-blue-900">Attendance Management</p>
          <p class="text-sm text-blue-700">Use the QR Scanner or manual entry to track attendance for this event.</p>
        </div>
      </div>
    </div>

    <div class="space-y-4">
      <div class="grid grid-cols-2 gap-4">
        <div class="bg-gray-50 p-4 rounded-lg">
          <p class="text-sm text-gray-600 mb-1">Event ID</p>
          <p class="font-bold text-gray-800">${eventId}</p>
        </div>
        <div class="bg-gray-50 p-4 rounded-lg">
          <p class="text-sm text-gray-600 mb-1">Total Registered</p>
          <p class="font-bold text-gray-800" id="total-registered-count">Loading...</p>
        </div>
      </div>

      <div class="bg-white border-2 border-gray-200 rounded-lg p-6 text-center">
        <i class="fas fa-qrcode text-gray-300 text-6xl mb-4"></i>
        <h4 class="text-lg font-semibold text-gray-700 mb-2">QR Scanner</h4>
        <p class="text-sm text-gray-500 mb-4">Scan member QR codes to check them in to this event</p>
        <button onclick="initQRScanner('${eventId}', '${eventTitle}')" class="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-semibold transition">
          <i class="fas fa-camera mr-2"></i>Start Scanner
        </button>
      </div>

      <div class="bg-gray-50 p-4 rounded-lg">
        <h4 class="font-semibold text-gray-700 mb-3">Quick Actions</h4>
        <div class="grid grid-cols-2 gap-3">
          <button onclick="viewAttendanceLog('${eventId}')" class="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm transition">
            <i class="fas fa-list mr-2"></i>View Attendance Log
          </button>
          <button onclick="exportAttendance('${eventId}')" class="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg text-sm transition">
            <i class="fas fa-download mr-2"></i>Export Data
          </button>
        </div>
      </div>
    </div>

    <div class="mt-6 pt-4 border-t flex justify-end gap-3">
      <button onclick="closeManageAttendanceModal()" class="bg-gray-500 hover:bg-gray-600 text-white px-6 py-2 rounded-lg transition">
        Close
      </button>
    </div>
  `;

  // Show the modal
  modal.classList.remove("hidden");

  // Load registered count
  loadEventAttendanceCount(eventId);
}

/**
 * Closes the attendance management modal
 */
function closeManageAttendanceModal() {
  const modal = document.getElementById("manage-event-modal");
  if (modal) {
    modal.classList.add("hidden");
  }
}

/**
 * Opens the attendance log viewing modal for Calendar Events
 * Called from calendar_events.js when "View Log" button is clicked
 */
function openAttendanceLogModal(eventId, eventTitle) {
  const modal = document.getElementById("attendance-modal");
  if (!modal) {
    console.error("Attendance modal not found");
    return;
  }

  // Get modal content container
  const modalContent = modal.querySelector(".bg-white");
  if (!modalContent) {
    console.error("Modal content container not found");
    return;
  }

  // Build the modal content
  modalContent.innerHTML = `
    <div class="flex justify-between items-center mb-6 pb-4 border-b">
      <div>
        <h3 class="text-2xl font-bold text-gray-800">${eventTitle}</h3>
        <p class="text-sm text-gray-500 mt-1">Attendance Log</p>
      </div>
      <button onclick="closeAttendanceLogModal()" class="text-gray-400 hover:text-gray-600 text-2xl">
        <i class="fas fa-times"></i>
      </button>
    </div>

    <div class="mb-4 flex justify-between items-center">
      <input 
        type="text" 
        id="attendance-search-input"
        placeholder="Search attendees..."
        class="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 w-64"
        onkeyup="filterAttendanceInModal()"
      />
      <div class="flex gap-2">
        <button onclick="refreshAttendanceLog('${eventId}')" class="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm transition">
          <i class="fas fa-sync-alt mr-2"></i>Refresh
        </button>
        <button onclick="exportAttendance('${eventId}')" class="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm transition">
          <i class="fas fa-file-excel mr-2"></i>Export
        </button>
      </div>
    </div>

    <div class="overflow-x-auto">
      <table class="w-full">
        <thead class="bg-gradient-to-r from-blue-600 to-blue-700 text-white">
          <tr>
            <th class="px-4 py-3 text-left text-sm font-bold">#</th>
            <th class="px-4 py-3 text-left text-sm font-bold">Member Name</th>
            <th class="px-4 py-3 text-left text-sm font-bold">Account Number</th>
            <th class="px-4 py-3 text-left text-sm font-bold">Check-in Time</th>
            <th class="px-4 py-3 text-left text-sm font-bold">Status</th>
          </tr>
        </thead>
        <tbody id="attendance-log-table-body">
          <tr>
            <td colspan="5" class="px-4 py-8 text-center text-gray-400">
              <i class="fas fa-spinner fa-spin text-2xl mb-2"></i>
              <p>Loading attendance records...</p>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <div class="mt-6 pt-4 border-t flex justify-between items-center">
      <div class="text-sm text-gray-600">
        <span id="attendance-total-count">Total: 0</span>
      </div>
      <button onclick="closeAttendanceLogModal()" class="bg-gray-500 hover:bg-gray-600 text-white px-6 py-2 rounded-lg transition">
        Close
      </button>
    </div>
  `;

  // Show the modal
  modal.classList.remove("hidden");

  // Load attendance data
  loadAttendanceLog(eventId);
}

/**
 * Closes the attendance log modal
 */
function closeAttendanceLogModal() {
  const modal = document.getElementById("attendance-modal");
  if (modal) {
    modal.classList.add("hidden");
  }
}

/**
 * Loads attendance count for an event
 */
function loadEventAttendanceCount(eventId) {
  // This would typically make an AJAX call to get the count
  // For now, we'll set a placeholder
  const countEl = document.getElementById("total-registered-count");
  if (countEl) {
    countEl.textContent = "0";
  }

  // TODO: Implement actual AJAX call to fetch_attendance.php
  // Example:
  // fetch(`fetch_attendance.php?event_id=${eventId}&action=count`)
  //   .then(response => response.json())
  //   .then(data => {
  //     if (countEl) countEl.textContent = data.count || 0;
  //   });
}

/**
 * Loads attendance log for an event
 */
function loadAttendanceLog(eventId) {
  const tbody = document.getElementById("attendance-log-table-body");
  const countEl = document.getElementById("attendance-total-count");

  if (!tbody) return;

  // This would typically make an AJAX call to get attendance records
  // For now, we'll show a placeholder message
  tbody.innerHTML = `
    <tr>
      <td colspan="5" class="px-4 py-8 text-center text-gray-400">
        <i class="fas fa-clipboard-list text-4xl mb-2 opacity-40"></i>
        <p>No attendance records yet for this event.</p>
        <p class="text-xs mt-2">Use "Manage Attendance" to start checking in members.</p>
      </td>
    </tr>
  `;

  if (countEl) {
    countEl.textContent = "Total: 0";
  }

  // TODO: Implement actual AJAX call to fetch_attendance.php
  // Example:
  // fetch(`fetch_attendance.php?event_id=${eventId}&action=list`)
  //   .then(response => response.json())
  //   .then(data => {
  //     if (data.success && data.attendance.length > 0) {
  //       displayAttendanceRecords(data.attendance);
  //     }
  //   });
}

/**
 * Refreshes the attendance log
 */
function refreshAttendanceLog(eventId) {
  loadAttendanceLog(eventId);
}

/**
 * Filters attendance records in the modal
 */
function filterAttendanceInModal() {
  const searchInput = document.getElementById("attendance-search-input");
  const tbody = document.getElementById("attendance-log-table-body");

  if (!searchInput || !tbody) return;

  const searchTerm = searchInput.value.toLowerCase();
  const rows = tbody.getElementsByTagName("tr");

  for (let row of rows) {
    const text = row.textContent.toLowerCase();
    if (text.includes(searchTerm)) {
      row.style.display = "";
    } else {
      row.style.display = "none";
    }
  }
}

/**
 * Initializes QR scanner for event attendance
 */
function initQRScanner(eventId, eventTitle) {
  alert(
    `QR Scanner functionality for event "${eventTitle}" (ID: ${eventId})\n\nThis feature requires additional implementation.\n\nYou can implement this using the html5-qrcode library that's already loaded.`,
  );

  // TODO: Implement QR scanner
  // This should open a camera interface to scan member QR codes
  // and automatically check them in to the event
}

/**
 * Exports attendance data
 */
function exportAttendance(eventId) {
  alert(
    `Export functionality for Event ID: ${eventId}\n\nThis will download attendance records as CSV/Excel file.\n\nImplementation needed.`,
  );

  // TODO: Implement export functionality
  // This should fetch attendance data and create a downloadable file
}

/**
 * Views attendance log (alternative entry point)
 */
function viewAttendanceLog(eventId) {
  // This is called from within the manage attendance modal
  closeManageAttendanceModal();

  // Find the event title
  const eventTitle = "Event"; // You might need to pass this or fetch it
  openAttendanceLogModal(eventId, eventTitle);
}

// Make functions globally available
window.openManageAttendanceModal = openManageAttendanceModal;
window.closeManageAttendanceModal = closeManageAttendanceModal;
window.openAttendanceLogModal = openAttendanceLogModal;
window.closeAttendanceLogModal = closeAttendanceLogModal;
window.loadAttendanceLog = loadAttendanceLog;
window.refreshAttendanceLog = refreshAttendanceLog;
window.filterAttendanceInModal = filterAttendanceInModal;
window.initQRScanner = initQRScanner;
window.exportAttendance = exportAttendance;
window.viewAttendanceLog = viewAttendanceLog;

console.log("✅ Calendar Events attendance functions initialized");

// ========================================
// SETTINGS MODALS
// ========================================

function closeSettingsModal() {
  const container = document.getElementById("modal-container");
  if (container) container.innerHTML = "";
}

// ── NOTIFICATIONS ──────────────────────────────────────────────

function openNotificationsModal() {
  const modal = `
    <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" onclick="closeSettingsModal()">
      <div class="bg-white rounded-2xl shadow-2xl w-full max-w-md" onclick="event.stopPropagation()">

        <div class="bg-gradient-to-r from-purple-600 to-purple-700 px-6 py-5 rounded-t-2xl flex justify-between items-center">
          <div class="flex items-center gap-3">
            <div class="bg-white bg-opacity-20 p-2 rounded-lg">
              <i class="fas fa-bell text-white text-lg"></i>
            </div>
            <div>
              <h3 class="text-xl font-bold text-white">Notifications</h3>
              <p class="text-purple-200 text-sm">Manage your alert preferences</p>
            </div>
          </div>
          <button onclick="closeSettingsModal()" class="text-white hover:text-purple-200 text-2xl transition">
            <i class="fas fa-times"></i>
          </button>
        </div>

        <div class="p-6 space-y-4">

          <div class="flex items-center justify-between p-4 bg-purple-50 rounded-xl border border-purple-100">
            <div class="flex items-center gap-3">
              <i class="fas fa-calendar-check text-purple-600 text-lg w-5 text-center"></i>
              <div>
                <p class="font-semibold text-gray-800 text-sm">Event Reminders</p>
                <p class="text-xs text-gray-500">Get notified before upcoming events</p>
              </div>
            </div>
            <label class="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" checked class="sr-only peer" onchange="saveNotifPref('events', this.checked)">
              <div class="w-11 h-6 bg-gray-200 peer-checked:bg-purple-600 rounded-full peer transition-all after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:after:translate-x-5"></div>
            </label>
          </div>

          <div class="flex items-center justify-between p-4 bg-blue-50 rounded-xl border border-blue-100">
            <div class="flex items-center gap-3">
              <i class="fas fa-user-plus text-blue-600 text-lg w-5 text-center"></i>
              <div>
                <p class="font-semibold text-gray-800 text-sm">New Member Alerts</p>
                <p class="text-xs text-gray-500">Notify when a new member joins</p>
              </div>
            </div>
            <label class="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" checked class="sr-only peer" onchange="saveNotifPref('members', this.checked)">
              <div class="w-11 h-6 bg-gray-200 peer-checked:bg-blue-600 rounded-full peer transition-all after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:after:translate-x-5"></div>
            </label>
          </div>

          <div class="flex items-center justify-between p-4 bg-green-50 rounded-xl border border-green-100">
            <div class="flex items-center gap-3">
              <i class="fas fa-hand-holding-heart text-green-600 text-lg w-5 text-center"></i>
              <div>
                <p class="font-semibold text-gray-800 text-sm">Donation Updates</p>
                <p class="text-xs text-gray-500">Alerts for new donation records</p>
              </div>
            </div>
            <label class="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" class="sr-only peer" onchange="saveNotifPref('donations', this.checked)">
              <div class="w-11 h-6 bg-gray-200 peer-checked:bg-green-600 rounded-full peer transition-all after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:after:translate-x-5"></div>
            </label>
          </div>

          <div class="flex items-center justify-between p-4 bg-orange-50 rounded-xl border border-orange-100">
            <div class="flex items-center gap-3">
              <i class="fas fa-clock text-orange-500 text-lg w-5 text-center"></i>
              <div>
                <p class="font-semibold text-gray-800 text-sm">Session Timeout Warning</p>
                <p class="text-xs text-gray-500">Alert before auto-logout (30 min)</p>
              </div>
            </div>
            <label class="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" checked class="sr-only peer" onchange="saveNotifPref('session', this.checked)">
              <div class="w-11 h-6 bg-gray-200 peer-checked:bg-orange-500 rounded-full peer transition-all after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:after:translate-x-5"></div>
            </label>
          </div>

        </div>

        <div class="px-6 pb-6">
          <button onclick="closeSettingsModal()" class="w-full bg-purple-600 hover:bg-purple-700 text-white py-3 rounded-xl font-semibold transition">
            Done
          </button>
        </div>

      </div>
    </div>
  `;
  document.getElementById("modal-container").innerHTML = modal;
  loadNotifPrefs();
}

function saveNotifPref(key, val) {
  localStorage.setItem("notif_" + key, val ? "1" : "0");
}

function loadNotifPrefs() {
  const keys = ["events", "members", "donations", "session"];
  keys.forEach((key) => {
    const val = localStorage.getItem("notif_" + key);
    if (val !== null) {
      const inputs = document.querySelectorAll(`input[onchange*="'${key}'"]`);
      inputs.forEach((input) => {
        input.checked = val === "1";
      });
    }
  });
}

// ── PRIVACY & SECURITY ─────────────────────────────────────────

function openPrivacyModal() {
  const modal = `
    <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" onclick="closeSettingsModal()">
      <div class="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto" onclick="event.stopPropagation()">

        <div class="bg-gradient-to-r from-green-600 to-green-700 px-6 py-5 rounded-t-2xl flex justify-between items-center sticky top-0">
          <div class="flex items-center gap-3">
            <div class="bg-white bg-opacity-20 p-2 rounded-lg">
              <i class="fas fa-shield-alt text-white text-lg"></i>
            </div>
            <div>
              <h3 class="text-xl font-bold text-white">Privacy & Security</h3>
              <p class="text-green-200 text-sm">Manage your account security</p>
            </div>
          </div>
          <button onclick="closeSettingsModal()" class="text-white hover:text-green-200 text-2xl transition">
            <i class="fas fa-times"></i>
          </button>
        </div>

        <div class="p-6 space-y-5">

          <div class="border border-gray-200 rounded-xl p-5">
            <h4 class="font-bold text-gray-800 mb-4 flex items-center gap-2">
              <i class="fas fa-lock text-green-600"></i> Change Password
            </h4>
            <div class="space-y-3">
              <div>
                <label class="text-xs font-semibold text-gray-600 mb-1 block">Current Password</label>
                <div class="relative">
                  <input type="password" id="priv-current-pw" placeholder="Enter current password"
                    class="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500 pr-10">
                  <button type="button" onclick="togglePwVisibility('priv-current-pw', this)" class="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                    <i class="fas fa-eye text-sm"></i>
                  </button>
                </div>
              </div>
              <div>
                <label class="text-xs font-semibold text-gray-600 mb-1 block">New Password</label>
                <div class="relative">
                  <input type="password" id="priv-new-pw" placeholder="Enter new password"
                    class="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500 pr-10">
                  <button type="button" onclick="togglePwVisibility('priv-new-pw', this)" class="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                    <i class="fas fa-eye text-sm"></i>
                  </button>
                </div>
              </div>
              <div>
                <label class="text-xs font-semibold text-gray-600 mb-1 block">Confirm New Password</label>
                <div class="relative">
                  <input type="password" id="priv-confirm-pw" placeholder="Confirm new password"
                    class="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500 pr-10">
                  <button type="button" onclick="togglePwVisibility('priv-confirm-pw', this)" class="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                    <i class="fas fa-eye text-sm"></i>
                  </button>
                </div>
              </div>
              <button onclick="submitPasswordChange()" class="w-full bg-green-600 hover:bg-green-700 text-white py-2.5 rounded-lg text-sm font-semibold transition">
                <i class="fas fa-key mr-2"></i>Update Password
              </button>
            </div>
          </div>

          <div class="border border-gray-200 rounded-xl p-5">
            <h4 class="font-bold text-gray-800 mb-3 flex items-center gap-2">
              <i class="fas fa-desktop text-blue-600"></i> Active Session
            </h4>
            <div class="bg-blue-50 rounded-lg p-3 flex items-center gap-3">
              <div class="bg-blue-600 text-white rounded-full w-9 h-9 flex items-center justify-center flex-shrink-0">
                <i class="fas fa-globe text-sm"></i>
              </div>
              <div>
                <p class="text-sm font-semibold text-gray-800">Current Browser</p>
                <p class="text-xs text-gray-500">Logged in as <span class="font-medium text-blue-600">${currentUser ? currentUser.name : "User"}</span></p>
                <p class="text-xs text-gray-400">Session started on ${new Date().toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}</p>
              </div>
              <span class="ml-auto text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full font-semibold">Active</span>
            </div>
          </div>

          <div class="border border-gray-200 rounded-xl p-5">
            <h4 class="font-bold text-gray-800 mb-3 flex items-center gap-2">
              <i class="fas fa-user-shield text-purple-600"></i> Data Privacy
            </h4>
            <p class="text-xs text-gray-500 leading-relaxed">
              Your personal data is securely stored within the Jesus Is Lord Church Management System.
              Data is only accessible to authorized administrators and is never shared with third parties.
              For concerns, contact your system administrator.
            </p>
          </div>

        </div>

        <div class="px-6 pb-6">
          <button onclick="closeSettingsModal()" class="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 py-3 rounded-xl font-semibold transition">
            Close
          </button>
        </div>

      </div>
    </div>
  `;
  document.getElementById("modal-container").innerHTML = modal;
}

function togglePwVisibility(inputId, btn) {
  const input = document.getElementById(inputId);
  const icon = btn.querySelector("i");
  if (input.type === "password") {
    input.type = "text";
    icon.classList.replace("fa-eye", "fa-eye-slash");
  } else {
    input.type = "password";
    icon.classList.replace("fa-eye-slash", "fa-eye");
  }
}

function submitPasswordChange() {
  const current = document.getElementById("priv-current-pw").value;
  const newPw = document.getElementById("priv-new-pw").value;
  const confirm = document.getElementById("priv-confirm-pw").value;
  if (!current || !newPw || !confirm) {
    alert("Please fill in all password fields.");
    return;
  }
  if (newPw.length < 6) {
    alert("New password must be at least 6 characters.");
    return;
  }
  if (newPw !== confirm) {
    alert("New passwords do not match.");
    return;
  }
  // TODO: connect to change_password.php
  alert("Password updated successfully!");
  document.getElementById("priv-current-pw").value = "";
  document.getElementById("priv-new-pw").value = "";
  document.getElementById("priv-confirm-pw").value = "";
}

// ── HELP & SUPPORT ─────────────────────────────────────────────

function openHelpModal() {
  const modal = `
    <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" onclick="closeSettingsModal()">
      <div class="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto" onclick="event.stopPropagation()">

        <div class="bg-gradient-to-r from-orange-500 to-orange-600 px-6 py-5 rounded-t-2xl flex justify-between items-center sticky top-0">
          <div class="flex items-center gap-3">
            <div class="bg-white bg-opacity-20 p-2 rounded-lg">
              <i class="fas fa-question-circle text-white text-lg"></i>
            </div>
            <div>
              <h3 class="text-xl font-bold text-white">Help & Support</h3>
              <p class="text-orange-100 text-sm">We're here to help you</p>
            </div>
          </div>
          <button onclick="closeSettingsModal()" class="text-white hover:text-orange-200 text-2xl transition">
            <i class="fas fa-times"></i>
          </button>
        </div>

        <div class="p-6 space-y-4">

          <div class="grid grid-cols-2 gap-3">
            <div class="bg-blue-50 border border-blue-100 rounded-xl p-4 text-center">
              <i class="fas fa-users text-blue-600 text-2xl mb-2"></i>
              <p class="text-sm font-semibold text-gray-800">Members</p>
              <p class="text-xs text-gray-500 mt-1">Add, edit, and manage church members</p>
            </div>
            <div class="bg-green-50 border border-green-100 rounded-xl p-4 text-center">
              <i class="fas fa-calendar text-green-600 text-2xl mb-2"></i>
              <p class="text-sm font-semibold text-gray-800">Events</p>
              <p class="text-xs text-gray-500 mt-1">Schedule and track church activities</p>
            </div>
            <div class="bg-yellow-50 border border-yellow-100 rounded-xl p-4 text-center">
              <i class="fas fa-donate text-yellow-600 text-2xl mb-2"></i>
              <p class="text-sm font-semibold text-gray-800">Donations</p>
              <p class="text-xs text-gray-500 mt-1">Record tithes and offerings</p>
            </div>
            <div class="bg-purple-50 border border-purple-100 rounded-xl p-4 text-center">
              <i class="fas fa-qrcode text-purple-600 text-2xl mb-2"></i>
              <p class="text-sm font-semibold text-gray-800">QR Check-in</p>
              <p class="text-xs text-gray-500 mt-1">Use your QR code at events</p>
            </div>
          </div>

          <div class="border border-gray-200 rounded-xl overflow-hidden">
            <div class="bg-gray-50 px-4 py-3 border-b border-gray-200">
              <p class="font-bold text-gray-700 text-sm flex items-center gap-2">
                <i class="fas fa-list-ul text-orange-500"></i> Frequently Asked Questions
              </p>
            </div>
            <div class="divide-y divide-gray-100">
              <details class="group px-4 py-3 cursor-pointer">
                <summary class="text-sm font-semibold text-gray-700 flex items-center justify-between list-none">
                  How do I add a new member?
                  <i class="fas fa-chevron-down text-gray-400 text-xs group-open:rotate-180 transition-transform"></i>
                </summary>
                <p class="text-xs text-gray-500 mt-2 leading-relaxed">Go to the <strong>Members</strong> tab from the sidebar, then click the <strong>+ Add Member</strong> button. Fill in the required details and click Save.</p>
              </details>
              <details class="group px-4 py-3 cursor-pointer">
                <summary class="text-sm font-semibold text-gray-700 flex items-center justify-between list-none">
                  How do I create a church event?
                  <i class="fas fa-chevron-down text-gray-400 text-xs group-open:rotate-180 transition-transform"></i>
                </summary>
                <p class="text-xs text-gray-500 mt-2 leading-relaxed">Go to the <strong>Events</strong> tab, click on a date in the calendar, and fill in the event details. You can set the title, time, location, and description.</p>
              </details>
              <details class="group px-4 py-3 cursor-pointer">
                <summary class="text-sm font-semibold text-gray-700 flex items-center justify-between list-none">
                  How do I use my QR code for check-in?
                  <i class="fas fa-chevron-down text-gray-400 text-xs group-open:rotate-180 transition-transform"></i>
                </summary>
                <p class="text-xs text-gray-500 mt-2 leading-relaxed">Open <strong>⋮ → My QR Code</strong> from the top menu. Show the QR code to the event coordinator who will scan it to mark your attendance.</p>
              </details>
              <details class="group px-4 py-3 cursor-pointer">
                <summary class="text-sm font-semibold text-gray-700 flex items-center justify-between list-none">
                  How do I change my password?
                  <i class="fas fa-chevron-down text-gray-400 text-xs group-open:rotate-180 transition-transform"></i>
                </summary>
                <p class="text-xs text-gray-500 mt-2 leading-relaxed">Go to <strong>⋮ → Privacy & Security</strong> and use the Change Password section. Enter your current password, then your new password twice to confirm.</p>
              </details>
            </div>
          </div>

          <div class="bg-orange-50 border border-orange-200 rounded-xl p-4 flex items-start gap-3">
            <div class="bg-orange-500 text-white rounded-full w-9 h-9 flex items-center justify-center flex-shrink-0 mt-0.5">
              <i class="fas fa-headset text-sm"></i>
            </div>
            <div>
              <p class="font-semibold text-gray-800 text-sm">Need more help?</p>
              <p class="text-xs text-gray-500 mt-1">Contact your system administrator or church IT coordinator for further assistance.</p>
            </div>
          </div>

        </div>

        <div class="px-6 pb-6">
          <button onclick="closeSettingsModal()" class="w-full bg-orange-500 hover:bg-orange-600 text-white py-3 rounded-xl font-semibold transition">
            Got it!
          </button>
        </div>

      </div>
    </div>
  `;
  document.getElementById("modal-container").innerHTML = modal;
}

// ── ABOUT ──────────────────────────────────────────────────────

function openAboutModal() {
  const modal = `
    <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" onclick="closeSettingsModal()">
      <div class="bg-white rounded-2xl shadow-2xl w-full max-w-md" onclick="event.stopPropagation()">

        <div class="bg-gradient-to-r from-blue-600 to-indigo-700 px-6 py-8 rounded-t-2xl text-center">
          <div class="w-20 h-20 bg-white rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg overflow-hidden">
            <img src="../pictures/JIL logo.jpg" alt="JIL Logo" class="w-full h-full object-contain p-1"
              onerror="this.parentElement.innerHTML='<i class=\'fas fa-church text-blue-600 text-3xl\'></i>'">
          </div>
          <h3 class="text-2xl font-bold text-white">Jesus Is Lord Church</h3>
          <p class="text-blue-200 text-sm mt-1">Management Information System</p>
          <span class="inline-block mt-3 bg-white bg-opacity-20 text-white text-xs px-3 py-1 rounded-full font-semibold">
            Version 1.0.0
          </span>
        </div>

        <div class="p-6 space-y-4">

          <div class="grid grid-cols-2 gap-3">
            <div class="bg-blue-50 rounded-xl p-4 text-center border border-blue-100">
              <i class="fas fa-cross text-blue-600 text-xl mb-2"></i>
              <p class="text-xs font-semibold text-gray-700">Jesus Is Lord Church</p>
              <p class="text-xs text-gray-500">Canlaon City, Philippines</p>
            </div>
            <div class="bg-indigo-50 rounded-xl p-4 text-center border border-indigo-100">
              <i class="fas fa-code text-indigo-600 text-xl mb-2"></i>
              <p class="text-xs font-semibold text-gray-700">Built with</p>
              <p class="text-xs text-gray-500">HTML, CSS, JS & PHP</p>
            </div>
          </div>

          <div class="border border-gray-200 rounded-xl divide-y divide-gray-100">
            <div class="flex justify-between items-center px-4 py-3">
              <span class="text-sm text-gray-600 flex items-center gap-2"><i class="fas fa-tag text-blue-500 w-4"></i> Version</span>
              <span class="text-sm font-semibold text-gray-800">1.0.0</span>
            </div>
            <div class="flex justify-between items-center px-4 py-3">
              <span class="text-sm text-gray-600 flex items-center gap-2"><i class="fas fa-calendar-alt text-green-500 w-4"></i> Released</span>
              <span class="text-sm font-semibold text-gray-800">2026</span>
            </div>
            <div class="flex justify-between items-center px-4 py-3">
              <span class="text-sm text-gray-600 flex items-center gap-2"><i class="fas fa-user-cog text-purple-500 w-4"></i> Logged in as</span>
              <span class="text-sm font-semibold text-blue-600">${currentUser ? currentUser.role.toUpperCase() : "USER"}</span>
            </div>
          </div>

          <div class="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-4 text-center border border-blue-100">
            <i class="fas fa-heart text-red-500 mr-1"></i>
            <span class="text-xs text-gray-600">Made with love for the glory of God</span>
          </div>

        </div>

        <div class="px-6 pb-6">
          <button onclick="closeSettingsModal()" class="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-xl font-semibold transition">
            Close
          </button>
        </div>

      </div>
    </div>
  `;
  document.getElementById("modal-container").innerHTML = modal;
}
