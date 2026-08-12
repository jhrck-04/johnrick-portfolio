// ========================================
// ROLE-BASED DASHBOARD ACCESS CONTROL
// ========================================

// Define role permissions
const rolePermissions = {
  user: {
    canViewDashboard: true,
    canViewMembers: true,
    canViewEvents: true,
    canViewDonations: false,
    canViewCalendar: false,
    canViewReports: false,
    canViewAudit: false,
    canViewUsers: false,
    canViewDatabase: false,
    canViewBackup: false,
    canViewPermissions: false,
    canEditMembers: false,
    canEditEvents: false,
    canAddDonations: false,
    dashboardContent: "limited", // limited, standard, full
  },
  admin: {
    canViewDashboard: true,
    canViewMembers: true,
    canViewEvents: true,
    canViewDonations: true,
    canViewCalendar: true,
    canViewReports: true,
    canViewAudit: true,
    canViewUsers: false,
    canViewDatabase: false,
    canViewBackup: false,
    canViewPermissions: false,
    canEditMembers: true,
    canEditEvents: true,
    canAddDonations: true,
    dashboardContent: "standard", // limited, standard, full
  },
  superadmin: {
    canViewDashboard: true,
    canViewMembers: true,
    canViewEvents: true,
    canViewDonations: true,
    canViewCalendar: true,
    canViewReports: true,
    canViewAudit: true,
    canViewUsers: true,
    canViewDatabase: true,
    canViewBackup: true,
    canViewPermissions: true,
    canEditMembers: true,
    canEditEvents: true,
    canAddDonations: true,
    dashboardContent: "full", // limited, standard, full
  },
};

// Get current user role from sessionStorage (FIXED)
function getCurrentUserRole() {
  // Try sessionStorage first (where your app stores user)
  const sessionUser = sessionStorage.getItem("churchUser");
  if (sessionUser) {
    const currentUser = JSON.parse(sessionUser);
    return currentUser.role || "user";
  }

  // Fallback to localStorage
  const localUser = localStorage.getItem("currentUser");
  if (localUser) {
    const currentUser = JSON.parse(localUser);
    return currentUser.role || "user";
  }

  return "user";
}

// Apply role-based access control on page load
function applyRoleBasedAccess() {
  const userRole = getCurrentUserRole();
  const permissions =
    rolePermissions[userRole.toLowerCase()] || rolePermissions.user;

  console.log("Applying role-based access for:", userRole);

  // Apply dashboard content restrictions
  applyDashboardRestrictions(permissions);

  // Apply sidebar visibility
  applySidebarRestrictions(permissions);

  // Apply action button restrictions
  applyActionButtonRestrictions(permissions);
}

// Apply dashboard content restrictions based on role
function applyDashboardRestrictions(permissions) {
  const dashboardContent = permissions.dashboardContent;

  // Apply restrictions based on content level
  if (dashboardContent === "limited") {
    // User role - limited dashboard
    createLimitedDashboardView();
  } else if (dashboardContent === "standard") {
    // Admin role - standard dashboard
    removeLimitedDashboardView();
  } else if (dashboardContent === "full") {
    // SuperAdmin role - full dashboard
    removeLimitedDashboardView();
  }
}

// Create limited dashboard view for users
function createLimitedDashboardView() {
  const dashboardTab = document.getElementById("dashboard-tab");
  if (!dashboardTab) return;

  // Check if notice already exists
  if (document.getElementById("limited-access-notice")) return;

  // Add notice for limited access
  const notice = document.createElement("div");
  notice.id = "limited-access-notice";
  notice.className =
    "bg-blue-50 border-l-4 border-blue-600 p-4 mb-6 rounded-lg";
  notice.innerHTML = `
    <div class="flex items-center gap-3">
      <i class="fas fa-info-circle text-blue-600 text-2xl"></i>
      <div>
        <p class="font-bold text-blue-900">User Dashboard View</p>
        <p class="text-sm text-blue-700">You're viewing limited dashboard information. Contact an administrator for full access.</p>
      </div>
    </div>
  `;

  // Insert after the user profile card
  const profileCard = dashboardTab.querySelector(
    ".bg-white.rounded-xl.shadow-lg",
  );
  if (profileCard) {
    profileCard.insertAdjacentElement("afterend", notice);
  }

  // Hide donation stats card
  const statsCards = dashboardTab.querySelectorAll(".stats-card");
  if (statsCards.length >= 2) {
    statsCards[1].style.display = "none"; // Hide donations card
  }
  if (statsCards.length >= 4) {
    statsCards[3].style.display = "none"; // Hide active users card
  }

  // Hide charts section (Monthly Trends and Recent Activity)
  const chartsSection = dashboardTab.querySelector(
    ".grid.grid-cols-1.lg\\:grid-cols-3",
  );
  if (chartsSection) {
    chartsSection.style.display = "none";
    console.log("✓ Charts section hidden for user");
  }

  // FIXED: Hide the entire Quick Actions and Ministry Distribution section
  const quickActionsMinistryGrid = dashboardTab.querySelector(
    ".grid.grid-cols-1.lg\\:grid-cols-2.gap-6.mb-8",
  );
  if (quickActionsMinistryGrid) {
    quickActionsMinistryGrid.style.display = "none";
    console.log("✓ Quick Actions and Ministry Distribution hidden for user");
  }
}

// Remove limited dashboard view (for admin/superadmin)
function removeLimitedDashboardView() {
  const notice = document.getElementById("limited-access-notice");
  if (notice) {
    notice.remove();
  }

  // Show all stats cards
  const statsCards = document.querySelectorAll(".stats-card");
  statsCards.forEach((card) => {
    card.style.display = "";
  });

  // Show charts section for admin/superadmin
  const chartsSection = document.querySelector(
    ".grid.grid-cols-1.lg\\:grid-cols-3",
  );
  if (chartsSection) {
    chartsSection.style.display = "";
  }

  // Show Quick Actions and Ministry Distribution for admin/superadmin
  const quickActionsMinistryGrid = document.querySelector(
    ".grid.grid-cols-1.lg\\:grid-cols-2.gap-6.mb-8",
  );
  if (quickActionsMinistryGrid) {
    quickActionsMinistryGrid.style.display = "";
  }
}

// Apply sidebar restrictions based on role
function applySidebarRestrictions(permissions) {
  // Admin panel section
  const adminPanel = document.getElementById("admin-panel-section");
  const superAdminPanel = document.getElementById("superadmin-panel-section");

  // Show/hide admin panel
  if (
    !permissions.canViewCalendar &&
    !permissions.canViewReports &&
    !permissions.canViewAudit
  ) {
    if (adminPanel) adminPanel.classList.add("hidden");
  } else {
    if (adminPanel) adminPanel.classList.remove("hidden");
  }

  // Show/hide superadmin panel
  if (
    !permissions.canViewUsers &&
    !permissions.canViewDatabase &&
    !permissions.canViewBackup &&
    !permissions.canViewPermissions
  ) {
    if (superAdminPanel) superAdminPanel.classList.add("hidden");
  } else {
    if (superAdminPanel) superAdminPanel.classList.remove("hidden");
  }

  // Hide donations tab for users
  const donationsBtn = document.querySelector(
    "[onclick=\"switchTab('donations')\"]",
  );
  if (donationsBtn && !permissions.canViewDonations) {
    donationsBtn.parentElement.classList.add("hidden");
  } else if (donationsBtn && permissions.canViewDonations) {
    donationsBtn.parentElement.classList.remove("hidden");
  }
}

// Apply action button restrictions
function applyActionButtonRestrictions(permissions) {
  // Add donation button
  const addDonationBtn = document.getElementById("add-donation-btn");
  if (addDonationBtn) {
    if (permissions.canAddDonations) {
      addDonationBtn.classList.remove("hidden");
    } else {
      addDonationBtn.classList.add("hidden");
    }
  }

  // Event calendar add button
  const addEventBtn = document.getElementById("add-event-calendar-btn");
  if (addEventBtn) {
    if (permissions.canEditEvents) {
      addEventBtn.classList.remove("hidden");
    } else {
      addEventBtn.classList.add("hidden");
    }
  }

  // Quick action buttons in dashboard
  const quickActionBtns = document.querySelectorAll(".quick-action-btn");
  quickActionBtns.forEach((btn) => {
    const btnText = btn.textContent.toLowerCase();

    if (btnText.includes("add member") && !permissions.canEditMembers) {
      btn.style.opacity = "0.5";
      btn.style.pointerEvents = "none";
      btn.title = "Requires Admin access";
    }

    if (btnText.includes("donation") && !permissions.canAddDonations) {
      btn.style.opacity = "0.5";
      btn.style.pointerEvents = "none";
      btn.title = "Requires Admin access";
    }

    if (btnText.includes("report") && !permissions.canViewReports) {
      btn.style.opacity = "0.5";
      btn.style.pointerEvents = "none";
      btn.title = "Requires Admin access";
    }
  });
}

// Check if user has specific permission
function hasPermission(permissionName) {
  const userRole = getCurrentUserRole();
  const permissions =
    rolePermissions[userRole.toLowerCase()] || rolePermissions.user;
  return permissions[permissionName] || false;
}

// Prevent unauthorized access to tabs
function checkTabAccess(tabName) {
  const userRole = getCurrentUserRole();
  const permissions =
    rolePermissions[userRole.toLowerCase()] || rolePermissions.user;

  const tabPermissions = {
    dashboard: "canViewDashboard",
    members: "canViewMembers",
    events: "canViewEvents",
    donations: "canViewDonations",
    calendar: "canViewCalendar",
    reports: "canViewReports",
    audit: "canViewAudit",
    users: "canViewUsers",
    database: "canViewDatabase",
    backup: "canViewBackup",
    permissions: "canViewPermissions",
  };

  const requiredPermission = tabPermissions[tabName];

  if (requiredPermission && !permissions[requiredPermission]) {
    showAccessDeniedMessage(tabName);
    return false;
  }

  return true;
}

// Show access denied message
function showAccessDeniedMessage(tabName) {
  const modal = document.createElement("div");
  modal.className =
    "fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50";
  modal.innerHTML = `
    <div class="bg-white rounded-xl shadow-2xl p-8 max-w-md mx-4 animate-slide-in">
      <div class="text-center">
        <div class="bg-red-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4">
          <i class="fas fa-lock text-4xl text-red-600"></i>
        </div>
        <h3 class="text-2xl font-bold text-gray-800 mb-2">Access Denied</h3>
        <p class="text-gray-600 mb-6">
          You don't have permission to access the <strong>${tabName}</strong> section. 
          Please contact your administrator for access.
        </p>
        <button 
          onclick="this.closest('.fixed').remove()" 
          class="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg transition font-semibold"
        >
          <i class="fas fa-check mr-2"></i>Understood
        </button>
      </div>
    </div>
  `;
  document.body.appendChild(modal);

  // Auto-remove after 5 seconds
  setTimeout(() => {
    if (modal.parentElement) {
      modal.remove();
    }
  }, 5000);
}

// Override the existing switchTab function to include permission check
const originalSwitchTab = window.switchTab;
window.switchTab = function (tabName) {
  if (!checkTabAccess(tabName)) {
    return; // Don't switch if no permission
  }

  // Call original function if permission granted
  if (originalSwitchTab) {
    originalSwitchTab(tabName);
  }

  // Re-apply restrictions when switching tabs
  setTimeout(() => {
    applyRoleBasedAccess();
  }, 100);
};

// Initialize role-based access on page load
document.addEventListener("DOMContentLoaded", () => {
  // Wait a bit for currentUser to be set
  setTimeout(() => {
    applyRoleBasedAccess();
  }, 500);
});

// Re-apply access control when user logs in
function onUserLogin(user) {
  sessionStorage.setItem("churchUser", JSON.stringify(user));
  applyRoleBasedAccess();
}

// Export functions for use in other scripts
window.roleBasedAccess = {
  applyRoleBasedAccess,
  hasPermission,
  checkTabAccess,
  getCurrentUserRole,
  onUserLogin,
};
