// Handle login with database authentication
function handleLogin() {
    const username = document.getElementById('login-username').value.trim();
    const password = document.getElementById('login-password').value;
    const errorDiv = document.getElementById('login-error');
    const loginBtn = event.target;
    
    // Clear previous errors
    errorDiv.classList.add('hidden');
    
    // Basic validation
    if (!username || !password) {
        showError('Please enter both username and password');
        return;
    }
    
    // Disable button and show loading
    loginBtn.disabled = true;
    loginBtn.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>Signing In...';
    
    // Create FormData for AJAX request
    const formData = new FormData();
    formData.append('username', username);
    formData.append('password', password);
    
    // Send AJAX request to PHP backend
    fetch('login_process.php', {
        method: 'POST',
        body: formData
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        return response.json();
    })
    .then(data => {
        console.log('Server response:', data);
        
        if (data.status === 'success') {
            // Create session data
            const sessionData = {
                user_id: data.user_id,
                username: username,
                email: data.email,
                name: data.name,
                role: data.role,
                loginTime: new Date().toISOString(),
                isAuthenticated: true
            };
            
            // Store in sessionStorage
            sessionStorage.setItem('churchUser', JSON.stringify(sessionData));
            sessionStorage.setItem('church_authenticated', 'true');
            sessionStorage.setItem('church_role', data.role);
            sessionStorage.setItem('church_username', username);
            sessionStorage.setItem('church_user_id', data.user_id);
            sessionStorage.setItem('church_email', data.email);
            sessionStorage.setItem('church_full_name', data.name);
            
            // Show animated success screen instead of simple message
            showSuccessAnimation(data);
            
        } else {
            // Show error message from server
            showError(data.message || 'Invalid username or password');
            resetLoginButton(loginBtn);
        }
    })
    .catch(error => {
        console.error('Login error:', error);
        showError('Connection error. Please try again.');
        resetLoginButton(loginBtn);
    });
}

// Show animated success screen
function showSuccessAnimation(userData) {
    const successHTML = `
        <div id="success-overlay" class="fixed inset-0 z-50 bg-gradient-to-br from-blue-700 via-blue-800 to-blue-900 flex items-center justify-center p-4 overflow-auto" style="animation: fadeIn 0.3s ease-in;">
            <div class="w-full max-w-5xl">
                
                <!-- Success Card - Landscape Layout -->
                <div class="bg-white rounded-3xl shadow-2xl overflow-hidden" style="animation: slideInFromBottom 0.6s ease-out; box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);">
                    
                    <!-- Main Content Grid -->
                    <div class="grid md:grid-cols-3 gap-0">
                        
                        <!-- Left Column: Church Logo & Checkmark -->
                        <div class="bg-gradient-to-br from-blue-700 to-blue-900 p-6 md:p-8 text-center flex flex-col justify-center items-center">
                            <div class="mb-4" style="animation: scaleIn 0.6s ease-out;">
                                <i class="fas fa-church text-white text-5xl md:text-6xl" style="animation: pulse 2s ease-in-out infinite;"></i>
                            </div>
                            <h1 class="text-xl md:text-2xl font-bold text-white mb-1" style="text-shadow: 0 0 20px rgba(255, 255, 255, 0.5);">Jesus Is Lord Church</h1>
                            <p class="text-blue-200 text-xs md:text-sm mb-6">Management Information System</p>
                            
                            <!-- Success Checkmark -->
                            <div class="bg-white rounded-full p-2 shadow-xl">
                                <svg class="w-16 h-16 md:w-20 md:h-20" viewBox="0 0 52 52">
                                    <circle class="checkmark-circle" cx="26" cy="26" r="25" fill="none" stroke="#4ade80" stroke-width="2"/>
                                    <path class="checkmark-check" fill="none" stroke="#4ade80" stroke-width="3" d="M14 27l7 7 16-16"/>
                                </svg>
                            </div>
                        </div>

                        <!-- Middle Column: Welcome & Success Message -->
                        <div class="p-6 md:p-8 flex flex-col justify-center">
                            <h2 class="text-2xl md:text-3xl font-bold text-gray-800 mb-2 text-center" style="animation: fadeIn 1s ease-in;">Welcome Back!</h2>
                            <p class="text-lg md:text-xl text-green-600 font-semibold mb-4 text-center" style="animation: fadeIn 1s ease-in;">${userData.name}</p>
                            
                            <div class="bg-gradient-to-r from-green-50 to-blue-50 border-2 border-green-300 rounded-xl p-4 mb-4" style="animation: fadeIn 1s ease-in;">
                                <div class="flex items-center justify-center gap-2 mb-2">
                                    <i class="fas fa-check-circle text-green-600 text-xl"></i>
                                    <p class="text-green-700 font-semibold">Login Successful!</p>
                                </div>
                                <p class="text-green-600 text-xs md:text-sm text-center">You're being redirected to the dashboard...</p>
                            </div>

                            <!-- User Info Cards -->
                            <div class="grid grid-cols-2 gap-3 mb-4">
                                <div class="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-3 border border-blue-200 text-center" style="animation: fadeIn 1s ease-in;">
                                    <i class="fas fa-user-shield text-blue-700 text-xl mb-1"></i>
                                    <p class="text-xs text-gray-600">Role</p>
                                    <p class="text-sm font-bold text-blue-800">${userData.role || 'User'}</p>
                                </div>
                                <div class="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-3 border border-blue-200 text-center" style="animation: fadeIn 1s ease-in;">
                                    <i class="fas fa-clock text-blue-700 text-xl mb-1"></i>
                                    <p class="text-xs text-gray-600">Login Time</p>
                                    <p class="text-sm font-bold text-blue-800">${new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })}</p>
                                </div>
                            </div>

                            <!-- Loading Progress Bar -->
                            <div class="w-full bg-gray-200 rounded-full h-2 overflow-hidden" style="animation: fadeIn 1s ease-in;">
                                <div class="bg-gradient-to-r from-blue-600 to-blue-800 h-2 rounded-full transition-all" id="progress-bar" style="width: 0%; transition: width 3000ms linear;"></div>
                            </div>
                        </div>

                        <!-- Right Column: Weather Forecast & Stats -->
                        <div class="p-6 md:p-8 bg-gradient-to-br from-blue-50 to-blue-100 flex flex-col justify-center">

                            <!-- Weather Widget -->
                            <div id="weather-widget" class="bg-white rounded-xl p-4 mb-4 shadow-sm overflow-hidden" style="animation: fadeIn 1s ease-in;">
                                <!-- Loading state -->
                                <div id="weather-loading" class="flex items-center justify-center gap-2 py-2">
                                    <i class="fas fa-spinner fa-spin text-blue-500"></i>
                                    <span class="text-xs text-gray-500">Fetching weather...</span>
                                </div>
                                <!-- Weather content (hidden until loaded) -->
                                <div id="weather-content" class="hidden">
                                    <!-- Header -->
                                    <div class="flex items-center justify-between mb-3">
                                        <div class="flex items-center gap-1">
                                            <i class="fas fa-map-marker-alt text-blue-600 text-xs"></i>
                                            <span class="text-xs font-bold text-gray-600 tracking-wide">CALAMBA CITY, PH</span>
                                        </div>
                                        <span id="weather-date" class="text-xs text-gray-400"></span>
                                    </div>
                                    <!-- Current weather -->
                                    <div class="flex items-center justify-between mb-3">
                                        <div class="flex items-center gap-3">
                                            <div id="weather-icon-wrap" class="text-4xl"></div>
                                            <div>
                                                <div class="flex items-end gap-1">
                                                    <span id="weather-temp" class="text-3xl font-black text-blue-900"></span>
                                                    <span class="text-sm text-gray-500 mb-1">°C</span>
                                                </div>
                                                <p id="weather-desc" class="text-xs font-semibold text-blue-700 capitalize"></p>
                                            </div>
                                        </div>
                                        <div class="text-right space-y-1">
                                            <div class="flex items-center justify-end gap-1">
                                                <i class="fas fa-tint text-blue-400 text-xs"></i>
                                                <span id="weather-humidity" class="text-xs text-gray-600"></span>
                                            </div>
                                            <div class="flex items-center justify-end gap-1">
                                                <i class="fas fa-wind text-blue-400 text-xs"></i>
                                                <span id="weather-wind" class="text-xs text-gray-600"></span>
                                            </div>
                                            <div class="flex items-center justify-end gap-1">
                                                <i class="fas fa-thermometer-half text-orange-400 text-xs"></i>
                                                <span id="weather-feels" class="text-xs text-gray-600"></span>
                                            </div>
                                        </div>
                                    </div>
                                    <!-- 3-day forecast strip -->
                                    <div id="weather-forecast" class="grid grid-cols-3 gap-1 pt-2 border-t border-gray-100"></div>
                                    <!-- Weather prayer -->
                                    <div id="weather-prayer" class="mt-3 bg-blue-50 rounded-lg p-2 border-l-3 border-blue-400">
                                        <p id="weather-prayer-text" class="text-xs text-blue-700 italic"></p>
                                    </div>
                                </div>
                                <!-- Error state -->
                                <div id="weather-error" class="hidden text-center py-1">
                                    <i class="fas fa-cloud-slash text-gray-300 text-2xl mb-1"></i>
                                    <p class="text-xs text-gray-400">Weather unavailable</p>
                                </div>
                            </div>

                            <!-- Quick Stats -->
                            <div class="grid grid-cols-3 gap-2" style="animation: fadeIn 1.2s ease-in;">
                                <div class="bg-white rounded-lg p-2 text-center border border-blue-200 shadow-sm">
                                    <i class="fas fa-users text-blue-700 text-lg mb-1"></i>
                                    <p class="text-xs text-gray-600">Members</p>
                                    <p class="text-sm md:text-base font-bold text-blue-800">250+</p>
                                </div>
                                <div class="bg-white rounded-lg p-2 text-center border border-blue-200 shadow-sm">
                                    <i class="fas fa-calendar text-blue-700 text-lg mb-1"></i>
                                    <p class="text-xs text-gray-600">Events</p>
                                    <p class="text-sm md:text-base font-bold text-blue-800">12</p>
                                </div>
                                <div class="bg-white rounded-lg p-2 text-center border border-blue-200 shadow-sm">
                                    <i class="fas fa-donate text-blue-700 text-lg mb-1"></i>
                                    <p class="text-xs text-gray-600">Donations</p>
                                    <p class="text-sm md:text-base font-bold text-blue-800">$5.2K</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <style>
            @keyframes fadeIn {
                from { opacity: 0; }
                to { opacity: 1; }
            }

            @keyframes slideInFromBottom {
                from {
                    transform: translateY(50px);
                    opacity: 0;
                }
                to {
                    transform: translateY(0);
                    opacity: 1;
                }
            }

            @keyframes scaleIn {
                from {
                    transform: scale(0);
                    opacity: 0;
                }
                to {
                    transform: scale(1);
                    opacity: 1;
                }
            }

            @keyframes checkmark {
                0% { stroke-dashoffset: 100; }
                100% { stroke-dashoffset: 0; }
            }

            @keyframes pulse {
                0%, 100% { transform: scale(1); }
                50% { transform: scale(1.05); }
            }

            .checkmark-circle {
                stroke-dasharray: 166;
                stroke-dashoffset: 166;
                animation: checkmark 0.6s ease-in-out 0.3s forwards;
            }

            .checkmark-check {
                stroke-dasharray: 48;
                stroke-dashoffset: 48;
                animation: checkmark 0.3s ease-in-out 0.9s forwards;
            }
        </style>
    `;

    // Append to body
    document.body.insertAdjacentHTML('beforeend', successHTML);

    // Animate progress bar
    setTimeout(() => {
        const progressBar = document.getElementById('progress-bar');
        if (progressBar) {
            progressBar.style.width = '100%';
        }
    }, 100);

    // Fetch live weather for Calamba City
    fetchWeather();

    // Redirect to dashboard after animation
    setTimeout(() => {
        window.location.href = 'dashboard/dashboard.html';
    }, 3500); // 3.5 seconds to enjoy the animation
}

// Show error message
function showError(message) {
    const errorDiv = document.getElementById('login-error');
    errorDiv.className = 'bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4';
    errorDiv.textContent = message;
    errorDiv.classList.remove('hidden');
    
    setTimeout(() => {
        errorDiv.classList.add('hidden');
    }, 5000);
}

// Show success message (kept for compatibility but not used with animation)
function showSuccess(message) {
    const errorDiv = document.getElementById('login-error');
    errorDiv.className = 'bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4';
    errorDiv.textContent = message;
    errorDiv.classList.remove('hidden');
}

// Reset login button to original state
function resetLoginButton(btn) {
    btn.disabled = false;
    btn.innerHTML = '<i class="fas fa-sign-in-alt mr-2"></i>Sign In';
}

// Check if user is already logged in
function checkExistingSession() {
    const churchUser = sessionStorage.getItem('churchUser');
    if (churchUser) {
        try {
            const session = JSON.parse(churchUser);
            if (session.isAuthenticated) {
                // User is already logged in, redirect to dashboard
                window.location.href = 'dashboard/dashboard.html';
            }
        } catch (e) {
            console.log('No valid session found');
        }
    }
}

// Allow Enter key to login
document.addEventListener('DOMContentLoaded', function() {
    // Check for existing session on page load
    checkExistingSession();
    
    const loginUsername = document.getElementById('login-username');
    const loginPassword = document.getElementById('login-password');
    
    if (loginUsername) {
        loginUsername.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') handleLogin();
        });
    }
    
    if (loginPassword) {
        loginPassword.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') handleLogin();
        });
    }
    
    // Auto-focus on username field
    if (loginUsername) {
        loginUsername.focus();
    }
});

// Forgot Password Functions
let foundAccountData = null;

// Show forgot password modal
function showForgotPassword() {
    document.getElementById('forgot-password-modal').classList.remove('hidden');
    document.getElementById('forgot-email').value = '';
    document.getElementById('forgot-unique-id').value = '';
    clearForgotMessages();
}

// Close forgot password modal
function closeForgotPassword() {
    document.getElementById('forgot-password-modal').classList.add('hidden');
    document.getElementById('search-account-section').classList.remove('hidden');
    document.getElementById('reset-password-section').classList.add('hidden');
    foundAccountData = null;
    clearForgotMessages();
}

// Clear error and success messages
function clearForgotMessages() {
    document.getElementById('forgot-error').classList.add('hidden');
    document.getElementById('forgot-success').classList.add('hidden');
}

// Show error in forgot password modal
function showForgotError(message) {
    const errorDiv = document.getElementById('forgot-error');
    errorDiv.textContent = message;
    errorDiv.classList.remove('hidden');
    document.getElementById('forgot-success').classList.add('hidden');
}

// Show success in forgot password modal
function showForgotSuccess(message) {
    const successDiv = document.getElementById('forgot-success');
    successDiv.textContent = message;
    successDiv.classList.remove('hidden');
    document.getElementById('forgot-error').classList.add('hidden');
}

// Search for account by email or unique ID
function searchAccount() {
    const email = document.getElementById('forgot-email').value.trim();
    const uniqueId = document.getElementById('forgot-unique-id').value.trim();
    
    clearForgotMessages();
    
    // Validation: at least one field must be filled
    if (!email && !uniqueId) {
        showForgotError('Please enter either your email address or account number.');
        return;
    }
    
    // Validate email format if provided
    if (email && !isValidEmail(email)) {
        showForgotError('Please enter a valid email address.');
        return;
    }
    
    // Disable button and show loading
    const searchBtn = event.target;
    searchBtn.disabled = true;
    searchBtn.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>Searching...';
    
    // Create FormData for AJAX request
    const formData = new FormData();
    if (email) formData.append('email', email);
    if (uniqueId) formData.append('unique_id', uniqueId);
    
    // Send AJAX request to PHP backend
    fetch('search_account.php', {
        method: 'POST',
        body: formData
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        return response.json();
    })
    .then(data => {
        console.log('Search response:', data);
        
        if (data.status === 'success') {
            // Account found - store data and show reset section
            foundAccountData = data;
            showResetSection(data);
        } else {
            // Account not found
            showForgotError(data.message || 'No account found with the provided information.');
            searchBtn.disabled = false;
            searchBtn.innerHTML = '<i class="fas fa-search mr-2"></i>Search Account';
        }
    })
    .catch(error => {
        console.error('Search error:', error);
        showForgotError('Connection error. Please try again.');
        searchBtn.disabled = false;
        searchBtn.innerHTML = '<i class="fas fa-search mr-2"></i>Search Account';
    });
}

// Show reset password section after account is found
function showResetSection(accountData) {
    // Hide search section
    document.getElementById('search-account-section').classList.add('hidden');
    
    // Show reset section
    document.getElementById('reset-password-section').classList.remove('hidden');
    
    // Display account info
    const accountInfo = document.getElementById('account-info');
    accountInfo.textContent = `Account: ${accountData.name} (${accountData.email})`;
    
    // Clear password fields
    document.getElementById('new-password').value = '';
    document.getElementById('confirm-password').value = '';
    
    clearForgotMessages();
}

// Go back to search section
function backToSearch() {
    document.getElementById('reset-password-section').classList.add('hidden');
    document.getElementById('search-account-section').classList.remove('hidden');
    foundAccountData = null;
    clearForgotMessages();
    
    // Reset search button
    const searchBtn = document.querySelector('#search-account-section button[onclick="searchAccount()"]');
    if (searchBtn) {
        searchBtn.disabled = false;
        searchBtn.innerHTML = '<i class="fas fa-search mr-2"></i>Search Account';
    }
}

// Reset password
function resetPassword() {
    const newPassword = document.getElementById('new-password').value;
    const confirmPassword = document.getElementById('confirm-password').value;
    
    clearForgotMessages();
    
    // Validation
    if (!newPassword || !confirmPassword) {
        showForgotError('Please fill in both password fields.');
        return;
    }
    
    if (newPassword.length < 6) {
        showForgotError('Password must be at least 6 characters long.');
        return;
    }
    
    if (newPassword !== confirmPassword) {
        showForgotError('Passwords do not match.');
        return;
    }
    
    if (!foundAccountData) {
        showForgotError('Session expired. Please search for your account again.');
        backToSearch();
        return;
    }
    
    // Disable button and show loading
    const resetBtn = event.target;
    resetBtn.disabled = true;
    resetBtn.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>Resetting...';
    
    // Create FormData for AJAX request
    const formData = new FormData();
    formData.append('user_id', foundAccountData.user_id);
    formData.append('new_password', newPassword);
    
    // Send AJAX request to PHP backend
    fetch('reset_password.php', {
        method: 'POST',
        body: formData
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        return response.json();
    })
    .then(data => {
        console.log('Reset response:', data);
        
        if (data.status === 'success') {
            // Password reset successful
            showForgotSuccess('Password reset successful! You can now login with your new password.');
            
            // Close modal after 3 seconds
            setTimeout(() => {
                closeForgotPassword();
            }, 3000);
        } else {
            // Reset failed
            showForgotError(data.message || 'Failed to reset password. Please try again.');
            resetBtn.disabled = false;
            resetBtn.innerHTML = '<i class="fas fa-key mr-2"></i>Reset Password';
        }
    })
    .catch(error => {
        console.error('Reset error:', error);
        showForgotError('Connection error. Please try again.');
        resetBtn.disabled = false;
        resetBtn.innerHTML = '<i class="fas fa-key mr-2"></i>Reset Password';
    });
}

// Email validation helper
function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

// ─────────────────────────────────────────────────
//  WEATHER FORECAST — Calamba City, PH
//  Uses Open-Meteo (free, no API key)
//  Coordinates: 14.2123° N, 121.1647° E
// ─────────────────────────────────────────────────
async function fetchWeather() {
    const LAT = 14.2123;
    const LON = 121.1647;

    // WMO weather code → { label, emoji, Google-style icon class }
    const WMO = {
        0:  { label: 'Clear Sky',         emoji: '☀️',  icon: 'fas fa-sun',              color: '#f59e0b' },
        1:  { label: 'Mainly Clear',      emoji: '🌤️', icon: 'fas fa-cloud-sun',         color: '#f59e0b' },
        2:  { label: 'Partly Cloudy',     emoji: '⛅',  icon: 'fas fa-cloud-sun',         color: '#6b7280' },
        3:  { label: 'Overcast',          emoji: '☁️',  icon: 'fas fa-cloud',             color: '#6b7280' },
        45: { label: 'Foggy',             emoji: '🌫️', icon: 'fas fa-smog',              color: '#9ca3af' },
        48: { label: 'Icy Fog',           emoji: '🌫️', icon: 'fas fa-smog',              color: '#9ca3af' },
        51: { label: 'Light Drizzle',     emoji: '🌦️', icon: 'fas fa-cloud-drizzle',     color: '#3b82f6' },
        53: { label: 'Drizzle',           emoji: '🌧️', icon: 'fas fa-cloud-rain',        color: '#3b82f6' },
        55: { label: 'Heavy Drizzle',     emoji: '🌧️', icon: 'fas fa-cloud-showers-heavy',color:'#1d4ed8' },
        61: { label: 'Light Rain',        emoji: '🌧️', icon: 'fas fa-cloud-rain',        color: '#3b82f6' },
        63: { label: 'Rain',              emoji: '🌧️', icon: 'fas fa-cloud-rain',        color: '#2563eb' },
        65: { label: 'Heavy Rain',        emoji: '⛈️',  icon: 'fas fa-cloud-showers-heavy',color:'#1d4ed8' },
        80: { label: 'Rain Showers',      emoji: '🌦️', icon: 'fas fa-cloud-sun-rain',    color: '#3b82f6' },
        81: { label: 'Rain Showers',      emoji: '🌧️', icon: 'fas fa-cloud-rain',        color: '#2563eb' },
        82: { label: 'Violent Showers',   emoji: '⛈️',  icon: 'fas fa-cloud-showers-heavy',color:'#1d4ed8' },
        95: { label: 'Thunderstorm',      emoji: '⛈️',  icon: 'fas fa-bolt',              color: '#7c3aed' },
        96: { label: 'Thunderstorm',      emoji: '⛈️',  icon: 'fas fa-bolt',              color: '#7c3aed' },
        99: { label: 'Heavy Thunderstorm',emoji: '🌩️', icon: 'fas fa-bolt',              color: '#6d28d9' },
    };

    // Prayers matching weather conditions
    const WEATHER_PRAYERS = {
        sunny:    "Lord, as the sun shines bright today, may Your light guide every step we take. Thank You for this beautiful day. Amen.",
        cloudy:   "Father, even when skies are grey, Your love shines constant. May our hearts stay bright in Your presence today. Amen.",
        rainy:    "Lord, as rain nourishes the earth, may Your grace nourish our souls today. Keep our community safe and sheltered. Amen.",
        stormy:   "Lord, You calm every storm. Be our shelter and peace today. Protect our congregation and community. Amen.",
        foggy:    "Father, when the path is unclear, light our way with Your Word. Give us clarity and peace this day. Amen.",
    };

    function getWeatherPrayer(code) {
        if ([95,96,99].includes(code)) return WEATHER_PRAYERS.stormy;
        if ([45,48].includes(code)) return WEATHER_PRAYERS.foggy;
        if (code >= 51) return WEATHER_PRAYERS.rainy;
        if (code >= 2) return WEATHER_PRAYERS.cloudy;
        return WEATHER_PRAYERS.sunny;
    }

    function getWMO(code) {
        return WMO[code] || { label: 'Unknown', emoji: '🌡️', icon: 'fas fa-thermometer-half', color: '#6b7280' };
    }

    const DAYS = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];

    try {
        const url = `https://api.open-meteo.com/v1/forecast?latitude=${LAT}&longitude=${LON}`
            + `&current=temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m`
            + `&daily=weather_code,temperature_2m_max,temperature_2m_min`
            + `&timezone=Asia%2FManila&forecast_days=4`;

        const res  = await fetch(url);
        const data = await res.json();

        const cur   = data.current;
        const daily = data.daily;
        const wmo   = getWMO(cur.weather_code);

        // Populate current weather
        document.getElementById('weather-icon-wrap').innerHTML =
            `<i class="${wmo.icon} text-4xl" style="color:${wmo.color}"></i>`;
        document.getElementById('weather-temp').textContent     = Math.round(cur.temperature_2m);
        document.getElementById('weather-desc').textContent     = wmo.label;
        document.getElementById('weather-humidity').textContent = `${cur.relative_humidity_2m}% humidity`;
        document.getElementById('weather-wind').textContent     = `${Math.round(cur.wind_speed_10m)} km/h wind`;
        document.getElementById('weather-feels').textContent    = `Feels ${Math.round(cur.apparent_temperature)}°C`;
        document.getElementById('weather-date').textContent     =
            new Date().toLocaleDateString('en-US', { weekday:'short', month:'short', day:'numeric' });

        // 3-day forecast (skip today = index 0, show next 3)
        const forecastEl = document.getElementById('weather-forecast');
        forecastEl.innerHTML = '';
        for (let i = 1; i <= 3; i++) {
            const d    = new Date(daily.time[i] + 'T00:00:00');
            const fw   = getWMO(daily.weather_code[i]);
            const tMax = Math.round(daily.temperature_2m_max[i]);
            const tMin = Math.round(daily.temperature_2m_min[i]);
            forecastEl.innerHTML += `
                <div class="bg-blue-50 rounded-lg p-1.5 text-center">
                    <p class="text-xs font-bold text-gray-500">${DAYS[d.getDay()]}</p>
                    <i class="${fw.icon} text-base my-1" style="color:${fw.color}"></i>
                    <p class="text-xs font-bold text-blue-900">${tMax}°</p>
                    <p class="text-xs text-gray-400">${tMin}°</p>
                </div>`;
        }

        // Weather prayer
        document.getElementById('weather-prayer-text').textContent = getWeatherPrayer(cur.weather_code);

        // Show content, hide loader
        document.getElementById('weather-loading').classList.add('hidden');
        document.getElementById('weather-content').classList.remove('hidden');

    } catch (err) {
        console.error('Weather fetch error:', err);
        document.getElementById('weather-loading').classList.add('hidden');
        document.getElementById('weather-error').classList.remove('hidden');
    }
}