/**
 * Real-Time Upcoming Events Display - ENHANCED VERSION
 * Features: Skeleton loading, better error handling, retry logic, network status detection
 * Auto-updates every 30 seconds with visual feedback
 */

class UpcomingEventsManager {
  constructor(options = {}) {
    // Configuration
    this.updateInterval = options.updateInterval || 30000; // 30 seconds
    this.maxRetries = options.maxRetries || 3;
    this.retryDelay = options.retryDelay || 5000; // 5 seconds

    // State
    this.intervalId = null;
    this.isLoading = false;
    this.lastUpdate = null;
    this.retryCount = 0;
    this.events = [];

    // DOM references
    this.container = null;
    this.statsCountElement = null;

    // Initialize
    this.init();
  }

  /**
   * Initialize the manager
   */
  init() {
    console.log("🚀 Initializing Enhanced Upcoming Events Manager");

    // Cache DOM references
    this.cacheDOM();

    // Show skeleton loader initially
    this.showSkeletonLoader();

    // Load events immediately
    this.loadUpcomingEvents();

    // Start auto-refresh
    this.startAutoRefresh();

    // Setup event listeners
    this.setupEventListeners();
  }

  /**
   * Cache DOM references
   */
  cacheDOM() {
    this.container = document.querySelector(
      ".grid.grid-cols-1.md\\:grid-cols-3.gap-4",
    );
    this.statsCountElement = document.getElementById("total-events-dash");

    if (!this.container) {
      console.error("❌ Events container not found");
    }
  }

  /**
   * Setup event listeners
   */
  setupEventListeners() {
    // Visibility change - pause/resume updates
    document.addEventListener("visibilitychange", () => {
      if (document.hidden) {
        console.log("⏸️ Tab hidden - pausing auto-refresh");
        this.stopAutoRefresh();
      } else {
        console.log("▶️ Tab visible - resuming auto-refresh");
        this.loadUpcomingEvents();
        this.startAutoRefresh();
      }
    });

    // Online/offline status
    window.addEventListener("online", () => {
      console.log("🌐 Connection restored");
      this.retryCount = 0;
      this.loadUpcomingEvents();
    });

    window.addEventListener("offline", () => {
      console.log("📴 Connection lost");
      this.showError("No internet connection");
    });
  }

  /**
   * Start auto-refresh interval
   */
  startAutoRefresh() {
    this.stopAutoRefresh(); // Clear any existing interval

    this.intervalId = setInterval(() => {
      console.log("🔄 Auto-refreshing upcoming events...");
      this.loadUpcomingEvents();
    }, this.updateInterval);

    console.log(
      `✅ Auto-refresh started (every ${this.updateInterval / 1000}s)`,
    );
  }

  /**
   * Stop auto-refresh interval
   */
  stopAutoRefresh() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  /**
   * Load upcoming events from server
   */
  async loadUpcomingEvents() {
    // Prevent multiple simultaneous requests
    if (this.isLoading) {
      console.log("⚠️ Already loading, skipping...");
      return;
    }

    this.isLoading = true;
    this.showLoadingState();

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

      const response = await fetch("fetch_upcoming_events.php", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "Cache-Control": "no-cache",
          "X-Requested-With": "XMLHttpRequest",
        },
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();

      if (data.success) {
        console.log(`✅ Loaded ${data.count} upcoming events`);
        this.events = data.events;
        this.lastUpdate = new Date();
        this.retryCount = 0; // Reset retry count on success

        this.renderEvents(data.events);
        this.updateEventCount(data.count);
        this.updateLastUpdateTime();
      } else {
        throw new Error(data.message || "Failed to load events");
      }
    } catch (error) {
      console.error("❌ Error loading events:", error);

      if (error.name === "AbortError") {
        this.handleError("Request timeout - server not responding");
      } else if (!navigator.onLine) {
        this.handleError("No internet connection");
      } else {
        this.handleError(error.message || "Could not connect to server");
      }
    } finally {
      this.isLoading = false;
    }
  }

  /**
   * Handle errors with retry logic
   */
  handleError(message) {
    if (this.retryCount < this.maxRetries) {
      this.retryCount++;
      console.log(
        `🔄 Retry attempt ${this.retryCount}/${this.maxRetries} in ${this.retryDelay / 1000}s...`,
      );

      this.showError(
        `${message} - Retrying (${this.retryCount}/${this.maxRetries})...`,
      );

      setTimeout(() => {
        this.loadUpcomingEvents();
      }, this.retryDelay);
    } else {
      console.error("❌ Max retries reached");
      this.showError(message);
    }
  }

  /**
   * Show skeleton loader
   */
  showSkeletonLoader() {
    if (!this.container) return;

    this.container.innerHTML = `
            ${this.createSkeletonCard()}
            ${this.createSkeletonCard()}
            ${this.createSkeletonCard()}
        `;
  }

  /**
   * Create skeleton card HTML
   */
  createSkeletonCard() {
    return `
            <div class="event-preview-card p-4 border-l-4 border-gray-300 bg-gray-50 rounded-lg">
                <div class="flex items-start gap-3">
                    <div class="skeleton-loader w-12 h-14 rounded"></div>
                    <div class="flex-1 space-y-2">
                        <div class="skeleton-loader h-4 w-3/4 rounded"></div>
                        <div class="skeleton-loader h-3 w-1/2 rounded"></div>
                        <div class="skeleton-loader h-3 w-2/3 rounded"></div>
                    </div>
                </div>
            </div>
        `;
  }

  /**
   * Show loading state (subtle overlay)
   */
  showLoadingState() {
    if (!this.container) return;
    this.container.style.opacity = "0.7";
  }

  /**
   * Hide loading state
   */
  hideLoadingState() {
    if (!this.container) return;
    this.container.style.opacity = "1";
  }

  /**
   * Render events
   */
  renderEvents(events) {
    if (!this.container) return;

    this.hideLoadingState();
    this.container.innerHTML = "";

    if (events.length === 0) {
      this.showNoEvents();
      return;
    }

    // Create event cards
    events.forEach((event, index) => {
      const card = this.createEventCard(event, index);
      this.container.appendChild(card);
    });

    // Animate cards
    this.animateCards();
  }

  /**
   * Create event card element
   */
  createEventCard(event, index) {
    const card = document.createElement("div");

    // Color schemes
    const colors = [
      {
        border: "border-blue-600",
        bg: "bg-gradient-to-br from-blue-50 to-blue-100",
        badge: "bg-blue-600",
        icon: "text-blue-700",
      },
      {
        border: "border-purple-600",
        bg: "bg-gradient-to-br from-purple-50 to-purple-100",
        badge: "bg-purple-600",
        icon: "text-purple-700",
      },
      {
        border: "border-green-600",
        bg: "bg-gradient-to-br from-green-50 to-green-100",
        badge: "bg-green-600",
        icon: "text-green-700",
      },
    ];

    const color = colors[index % colors.length];
    card.className = `event-preview-card p-4 border-l-4 ${color.border} ${color.bg} rounded-lg hover:shadow-xl transition-all duration-300 cursor-pointer transform`;

    const typeIcon = this.getEventTypeIcon(event.type);
    const daysUntil = this.getDaysUntil(event.date);

    card.innerHTML = `
            <div class="flex items-start gap-3">
                <div class="event-date ${color.badge} text-white p-2 rounded-lg text-center min-w-[54px] shadow-lg">
                    <p class="text-xs font-bold uppercase tracking-wide">${event.month}</p>
                    <p class="text-2xl font-bold leading-none mt-1">${event.day}</p>
                </div>
                <div class="flex-1">
                    <div class="flex items-start justify-between gap-2 mb-2">
                        <h4 class="font-bold text-gray-800 text-base leading-tight">${this.escapeHtml(event.title)}</h4>
                        <span class="text-xs px-2 py-1 bg-white bg-opacity-80 rounded-full text-gray-700 font-medium whitespace-nowrap flex items-center gap-1 shadow-sm">
                            ${typeIcon}
                            <span class="hidden sm:inline">${this.escapeHtml(event.type)}</span>
                        </span>
                    </div>
                    
                    <div class="space-y-1">
                        <p class="text-sm ${color.icon} flex items-center gap-2 font-medium">
                            <i class="fas fa-clock w-4"></i>
                            ${this.formatTime(event.time)}
                        </p>
                        <p class="text-sm ${color.icon} flex items-center gap-2 font-medium">
                            <i class="fas fa-map-marker-alt w-4"></i>
                            ${this.escapeHtml(event.location)}
                        </p>
                    </div>
                    
                    <div class="flex items-center justify-between mt-3 pt-2 border-t border-gray-200 border-opacity-50">
                        ${
                          event.attendees > 0
                            ? `
                            <span class="text-xs text-gray-600 flex items-center gap-1">
                                <i class="fas fa-users"></i>
                                ${event.attendees} expected
                            </span>
                        `
                            : "<span></span>"
                        }
                        
                        ${
                          daysUntil !== null
                            ? `
                            <span class="text-xs font-semibold ${color.icon}">
                                ${
                                  daysUntil === 0
                                    ? "🔥 Today!"
                                    : daysUntil === 1
                                      ? "⭐ Tomorrow"
                                      : `📅 ${daysUntil} days`
                                }
                            </span>
                        `
                            : ""
                        }
                    </div>
                </div>
            </div>
        `;

    // Add click handler
    card.addEventListener("click", () => {
      this.showEventDetails(event);
    });

    // Add hover tooltip
    card.title = `Click for more details about ${event.title}`;

    return card;
  }

  /**
   * Get days until event
   */
  getDaysUntil(dateString) {
    try {
      const eventDate = new Date(dateString);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      eventDate.setHours(0, 0, 0, 0);

      const diffTime = eventDate - today;
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      return diffDays >= 0 ? diffDays : null;
    } catch (e) {
      return null;
    }
  }

  /**
   * Animate cards on load
   */
  animateCards() {
    const cards = this.container.querySelectorAll(".event-preview-card");

    cards.forEach((card, index) => {
      card.style.opacity = "0";
      card.style.transform = "translateY(20px) scale(0.95)";

      setTimeout(() => {
        card.style.transition = "all 0.5s cubic-bezier(0.34, 1.56, 0.64, 1)";
        card.style.opacity = "1";
        card.style.transform = "translateY(0) scale(1)";
      }, index * 100);
    });
  }

  /**
   * Get event type icon
   */
  getEventTypeIcon(type) {
    const icons = {
      service: '<i class="fas fa-church"></i>',
      meeting: '<i class="fas fa-handshake"></i>',
      fellowship: '<i class="fas fa-users"></i>',
      prayer: '<i class="fas fa-praying-hands"></i>',
      outreach: '<i class="fas fa-hands-helping"></i>',
      worship: '<i class="fas fa-music"></i>',
      study: '<i class="fas fa-book-open"></i>',
      youth: '<i class="fas fa-child"></i>',
      conference: '<i class="fas fa-microphone"></i>',
      retreat: '<i class="fas fa-mountain"></i>',
      other: '<i class="fas fa-calendar"></i>',
    };

    return icons[type?.toLowerCase()] || icons["other"];
  }

  /**
   * Format time
   */
  formatTime(time) {
    if (!time) return "Time TBA";

    if (time.includes("AM") || time.includes("PM")) {
      return time;
    }

    try {
      const [hours, minutes] = time.split(":");
      const hour = parseInt(hours);
      const ampm = hour >= 12 ? "PM" : "AM";
      const displayHour = hour % 12 || 12;
      return `${displayHour}:${minutes} ${ampm}`;
    } catch (e) {
      return time;
    }
  }

  /**
   * Show no events state
   */
  showNoEvents() {
    this.container.innerHTML = `
            <div class="col-span-3 text-center py-16 events-empty-state">
                <div class="inline-flex items-center justify-center w-24 h-24 bg-gradient-to-br from-blue-100 to-purple-100 rounded-full mb-6 shadow-lg">
                    <i class="fas fa-calendar-times text-5xl text-gray-400"></i>
                </div>
                <h3 class="text-2xl font-bold text-gray-800 mb-2">No Upcoming Events</h3>
            </div>
        `;
  }

  /**
   * Show error state
   */
  showError(message) {
    if (!this.container) return;

    this.hideLoadingState();

    this.container.innerHTML = `
            <div class="col-span-3 text-center py-12 events-error">
                <div class="inline-flex items-center justify-center w-20 h-20 bg-red-100 rounded-full mb-4">
                    <i class="fas fa-exclamation-triangle text-4xl text-red-600"></i>
                </div>
                <h3 class="text-xl font-bold text-gray-800 mb-2">Unable to Load Events</h3>
                <p class="text-red-600 mb-4">${this.escapeHtml(message)}</p>
                <button 
                    onclick="upcomingEventsManager.refresh()"
                    class="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition shadow hover:shadow-lg"
                >
                    <i class="fas fa-sync-alt mr-2"></i>Try Again
                </button>
            </div>
        `;
  }

  /**
   * Update event count in stats
   */
  updateEventCount(count) {
    if (!this.statsCountElement) return;

    const currentCount = parseInt(this.statsCountElement.textContent) || 0;

    if (currentCount !== count) {
      // Animate the change
      this.statsCountElement.classList.add("scale-125", "text-blue-700");

      setTimeout(() => {
        this.animateNumber(this.statsCountElement, currentCount, count, 500);

        setTimeout(() => {
          this.statsCountElement.classList.remove("scale-125", "text-blue-700");
        }, 500);
      }, 100);
    }
  }

  /**
   * Animate number change
   */
  animateNumber(element, start, end, duration) {
    const range = end - start;
    const increment = range / (duration / 16);
    let current = start;

    const timer = setInterval(() => {
      current += increment;

      if (
        (increment > 0 && current >= end) ||
        (increment < 0 && current <= end)
      ) {
        element.textContent = end;
        clearInterval(timer);
      } else {
        element.textContent = Math.floor(current);
      }
    }, 16);
  }

  /**
   * Update last update time
   */
  updateLastUpdateTime() {
    const element = document.getElementById("events-last-update");
    if (element && this.lastUpdate) {
      element.textContent = `Last updated: ${this.lastUpdate.toLocaleTimeString()}`;
      element.className = "text-xs text-green-600 mt-1 realtime-indicator";
    }
  }

  /**
   * Show event details
   */
  showEventDetails(event) {
    const message = `
📅 ${event.title}

📆 Date: ${new Date(event.date).toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
🕐 Time: ${this.formatTime(event.time)}
📍 Location: ${event.location}
🏷️ Type: ${event.type}
${event.attendees > 0 ? `👥 Expected Attendees: ${event.attendees}` : ""}
${event.created_by ? `✍️ Created by: ${event.created_by}` : ""}
        `.trim();

    alert(message);
  }

  /**
   * Escape HTML
   */
  escapeHtml(text) {
    const div = document.createElement("div");
    div.textContent = text || "";
    return div.innerHTML;
  }

  /**
   * Manual refresh
   */
  refresh() {
    console.log("🔄 Manual refresh triggered");
    this.retryCount = 0;
    this.showSkeletonLoader();
    this.loadUpcomingEvents();
  }

  /**
   * Destroy and cleanup
   */
  destroy() {
    this.stopAutoRefresh();
    console.log("🧹 Upcoming Events Manager destroyed");
  }
}

// Initialize when DOM is ready
let upcomingEventsManager;

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", () => {
    upcomingEventsManager = new UpcomingEventsManager({
      updateInterval: 30000, // 30 seconds
      maxRetries: 3,
      retryDelay: 5000,
    });
  });
} else {
  upcomingEventsManager = new UpcomingEventsManager({
    updateInterval: 30000,
    maxRetries: 3,
    retryDelay: 5000,
  });
}

// Cleanup on page unload
window.addEventListener("beforeunload", () => {
  if (upcomingEventsManager) {
    upcomingEventsManager.destroy();
  }
});
