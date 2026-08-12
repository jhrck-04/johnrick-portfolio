/**
 * Logout Script
 * Handles user logout with a confirmation modal, loading state, and success screen.
 */

// ========================================
// INACTIVITY AUTO-LOGOUT
// ========================================

let inactivityTimer;
const INACTIVITY_TIMEOUT = 30 * 60 * 1000; // 30 minutes

function resetInactivityTimer() {
  clearTimeout(inactivityTimer);
  inactivityTimer = setTimeout(() => {
    alert('Your session has expired due to inactivity.');
    forceLogout();
  }, INACTIVITY_TIMEOUT);
}

document.addEventListener('mousemove', resetInactivityTimer);
document.addEventListener('keypress', resetInactivityTimer);
document.addEventListener('click', resetInactivityTimer);
document.addEventListener('scroll', resetInactivityTimer);

resetInactivityTimer();

// ========================================
// MAIN LOGOUT ENTRY POINT
// ========================================

function handleLogout() {
  showLogoutModal();
}

// ========================================
// MODAL
// ========================================

function showLogoutModal() {
  const modal = `
    <div id="logoutModal" class="fixed inset-0 z-50 overflow-hidden">
      <div class="logout-modal-backdrop flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:p-0">
        <!-- Background overlay -->
        <div class="fixed inset-0 bg-gray-900 bg-opacity-75 transition-opacity" onclick="closeLogoutModal()"></div>

        <!-- Modal panel -->
        <div class="logout-modal-content inline-block align-bottom bg-white rounded-2xl text-left overflow-hidden shadow-2xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full relative z-10">
          <div class="bg-white px-6 pt-6 pb-4">
            <!-- Icon -->
            <div class="flex items-center justify-center w-16 h-16 mx-auto bg-red-100 rounded-full mb-4">
              <i class="fas fa-sign-out-alt text-3xl text-red-600"></i>
            </div>

            <!-- Content -->
            <div class="text-center">
              <h3 class="text-2xl font-bold text-gray-900 mb-2">
                Logout Confirmation
              </h3>
              <p class="text-gray-600 mb-6">
                Are you sure you want to logout from your account?
              </p>
            </div>
          </div>

          <!-- Actions -->
          <div class="bg-gray-50 px-6 py-4 flex flex-col sm:flex-row-reverse gap-3">
            <button
              onclick="confirmLogout()"
              class="logout-confirm-btn w-full sm:w-auto justify-center bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-lg transition-all duration-300 flex items-center gap-2 font-semibold">
              <i class="fas fa-check"></i>
              <span>Yes, Logout</span>
            </button>
            <button
              onclick="closeLogoutModal()"
              class="logout-cancel-btn w-full sm:w-auto justify-center bg-white hover:bg-gray-50 text-gray-700 border-2 border-gray-300 px-6 py-3 rounded-lg transition-all duration-300 flex items-center gap-2 font-semibold">
              <i class="fas fa-times"></i>
              <span>Cancel</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  `;

  document.getElementById('modal-container').innerHTML = modal;
}

function closeLogoutModal() {
  const modal = document.getElementById('logoutModal');
  if (!modal) return;

  const backdrop = modal.querySelector('.logout-modal-backdrop');
  if (backdrop) backdrop.classList.add('closing');

  setTimeout(() => {
    const container = document.getElementById('modal-container');
    if (container) container.innerHTML = '';
  }, 300);
}

// ========================================
// CONFIRM & PERFORM LOGOUT
// ========================================

function confirmLogout() {
  const container = document.getElementById('modal-container');
  if (container) container.innerHTML = '';

  showLogoutLoading();

  setTimeout(() => {
    hideLogoutLoading();
    showLogoutSuccess();

    setTimeout(() => {
      performLogout();
    }, 2500);
  }, 1500);
}

function showLogoutLoading() {
  const loadingOverlay = `
    <div id="logoutLoadingOverlay" class="fixed inset-0 z-50 bg-gray-900 bg-opacity-90 flex items-center justify-center">
      <div class="text-center">
        <div class="logout-spinner inline-block rounded-full h-16 w-16 border-t-4 border-b-4 border-white mb-4"></div>
        <p class="text-white text-xl font-semibold">Logging out...</p>
      </div>
    </div>
  `;
  const container = document.getElementById('modal-container');
  if (container) container.innerHTML = loadingOverlay;
}

function hideLogoutLoading() {
  const el = document.getElementById('logoutLoadingOverlay');
  if (el) el.remove();
}

function showLogoutSuccess() {
  const successMessage = `
    <div id="logoutSuccessMessage" class="fixed inset-0 z-50 bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center">
      <div class="text-center text-white">
        <div class="logout-success-icon inline-block mb-6">
          <svg width="120" height="120" viewBox="0 0 120 120">
            <circle cx="60" cy="60" r="54" fill="white" opacity="0.2"/>
            <circle cx="60" cy="60" r="45" fill="none" stroke="white" stroke-width="3"/>
            <path class="logout-checkmark-path" d="M30 60 L50 80 L90 40" fill="none" stroke="white" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </div>
        <h2 class="text-4xl font-bold mb-3">Successfully Logged Out!</h2>
        <p class="text-xl opacity-90">Thank you for using our system</p>
        <p class="text-sm opacity-75 mt-2">Redirecting to login page...</p>
      </div>
    </div>
  `;
  const container = document.getElementById('modal-container');
  if (container) container.innerHTML = successMessage;
}

function performLogout() {
  // Preserve theme preference across logout
  const savedTheme = localStorage.getItem('churchDashboardTheme');

  sessionStorage.clear();
  localStorage.clear();
  clearAllCookies();

  // Re-save theme so it applies on next login
  if (savedTheme) {
    localStorage.setItem('churchDashboardTheme', savedTheme);
  }

  window.location.href = '../index.html';
}

// ========================================
// FORCE LOGOUT (session timeout / emergency)
// ========================================

function forceLogout() {
  try {
    const savedTheme = localStorage.getItem('churchDashboardTheme');
    sessionStorage.clear();
    localStorage.clear();
    clearAllCookies();
    if (savedTheme) localStorage.setItem('churchDashboardTheme', savedTheme);
    window.location.href = '../index.html';
  } catch (error) {
    console.error('Force logout error:', error);
    window.location.href = '../index.html';
  }
}

// ========================================
// COOKIE HELPER
// ========================================

function clearAllCookies() {
  const cookies = document.cookie.split(';');
  for (let i = 0; i < cookies.length; i++) {
    const cookie = cookies[i];
    const eqPos = cookie.indexOf('=');
    const name = eqPos > -1 ? cookie.substr(0, eqPos).trim() : cookie.trim();
    document.cookie = name + '=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/';
    document.cookie = name + '=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/;domain=' + window.location.hostname;
  }
}

// ========================================
// CLOSE ON ESCAPE KEY
// ========================================

document.addEventListener('keydown', function (event) {
  if (event.key === 'Escape') {
    const modal = document.getElementById('logoutModal');
    if (modal) closeLogoutModal();
  }
});