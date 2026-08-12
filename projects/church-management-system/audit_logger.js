/**
 * audit_logger.js
 * ─────────────────────────────────────────────────────────────
 * Thin JS wrapper that sends audit log entries to the server.
 *
 * Usage anywhere in dashboard.js (after this file is loaded):
 *
 *   AuditLogger.log('CREATE', 'Members', 'Added new member: Juan dela Cruz');
 *   AuditLogger.log('DELETE', 'Events',  'Deleted event: Sunday Service (ID 12)');
 *   AuditLogger.log('UPDATE', 'Members', 'Updated member info: Juan dela Cruz');
 *   AuditLogger.log('LOGIN',  'Auth',    'User logged in');
 *   AuditLogger.log('EXPORT', 'Reports', 'Exported audit logs CSV');
 *
 * Available action values (must match PHP ENUM):
 *   CREATE | UPDATE | DELETE | LOGIN | LOGOUT | EXPORT |
 *   MARK_FINISHED | ADD_PARTICIPANT | REMOVE_PARTICIPANT
 * ─────────────────────────────────────────────────────────────
 */

const AuditLogger = (() => {
  const ENDPOINT = "audit_log_process.php"; // relative to dashboard page

  /**
   * Fire-and-forget log call.
   * Returns a Promise but you rarely need to await it.
   *
   * @param {string} logAction  – one of the ENUM values above
   * @param {string} module     – friendly module name, e.g. 'Members'
   * @param {string} details    – human-readable description
   */
  async function log(logAction, module, details) {
    try {
      const body = new FormData();
      body.append("action", "log");
      body.append("log_action", logAction);
      body.append("module", module);
      body.append("details", details);

      const res = await fetch(ENDPOINT, { method: "POST", body });
      const json = await res.json();

      if (json.status !== "success") {
        console.warn("[AuditLogger] Server returned:", json.message);
      }
    } catch (err) {
      // Never crash the calling function because of a logging failure
      console.warn("[AuditLogger] Failed to write log:", err);
    }
  }

  // ── Load & render audit logs inside the audit tab ──────────────────────

  let _currentPage = 1;
  let _currentFilters = {};

  async function loadLogs(page = 1, filters = {}) {
    _currentPage = page;
    _currentFilters = filters;

    const tbody = document.getElementById("audit-tbody");
    const paging = document.getElementById("audit-paging");
    const info = document.getElementById("audit-info");
    if (!tbody) return;

    tbody.innerHTML = `
            <tr>
              <td colspan="5" class="px-6 py-8 text-center text-gray-500">
                <i class="fas fa-spinner fa-spin mr-2"></i>Loading audit logs…
              </td>
            </tr>`;

    try {
      const body = new FormData();
      body.append("action", "fetch");
      body.append("page", page);
      Object.entries(filters).forEach(([k, v]) => v && body.append(k, v));

      const res = await fetch(ENDPOINT, { method: "POST", body });
      const data = await res.json();

      if (data.status !== "success") {
        tbody.innerHTML = `<tr><td colspan="5" class="px-6 py-8 text-center text-red-500">
                    <i class="fas fa-exclamation-circle mr-2"></i>${data.message}</td></tr>`;
        return;
      }

      if (!data.logs.length) {
        tbody.innerHTML = `<tr><td colspan="5" class="px-6 py-8 text-center text-gray-400">
                    <i class="fas fa-inbox mr-2"></i>No audit log entries found.</td></tr>`;
        if (info) info.textContent = "No entries found";
        if (paging) paging.innerHTML = "";
        return;
      }

      // Render rows
      tbody.innerHTML = data.logs
        .map((row) => {
          const badge = actionBadge(row.action);
          return `
                <tr class="hover:bg-gray-50 border-b border-gray-100 transition">
                    <td class="px-4 py-3 text-sm text-gray-600 whitespace-nowrap">
                        ${escHtml(row.timestamp)}
                    </td>
                    <td class="px-4 py-3">
                        <div class="font-medium text-gray-800 text-sm">${escHtml(row.full_name)}</div>
                        <div class="text-xs text-gray-400">${escHtml(row.role)}</div>
                    </td>
                    <td class="px-4 py-3">
                        <span class="${badge.cls} px-2 py-1 rounded text-xs font-semibold">${badge.label}</span>
                    </td>
                    <td class="px-4 py-3 text-sm text-gray-700">${escHtml(row.module)}</td>
                    <td class="px-4 py-3 text-sm text-gray-600">${escHtml(row.details)}</td>
                </tr>`;
        })
        .join("");

      // Info text
      const from = (page - 1) * data.per_page + 1;
      const to = Math.min(page * data.per_page, data.total);
      if (info)
        info.textContent = `Showing ${from}–${to} of ${data.total} entries`;

      // Pagination
      if (paging) renderPagination(paging, data.page, data.total_pages);
    } catch (err) {
      tbody.innerHTML = `<tr><td colspan="5" class="px-6 py-8 text-center text-red-500">
                Failed to load audit logs.</td></tr>`;
      console.error("[AuditLogger] loadLogs error:", err);
    }
  }

  function renderPagination(container, current, total) {
    if (total <= 1) {
      container.innerHTML = "";
      return;
    }

    let html = '<div class="flex items-center gap-1">';

    // Prev
    html += `<button onclick="AuditLogger.goPage(${current - 1})"
            class="px-3 py-1 rounded text-sm ${current === 1 ? "text-gray-300 cursor-not-allowed" : "bg-blue-600 text-white hover:bg-blue-700"}"
            ${current === 1 ? "disabled" : ""}>
            <i class="fas fa-chevron-left"></i>
        </button>`;

    // Page numbers (show up to 7 around current)
    const pages = [];
    for (let i = 1; i <= total; i++) {
      if (i === 1 || i === total || (i >= current - 2 && i <= current + 2))
        pages.push(i);
      else if (pages[pages.length - 1] !== "...") pages.push("...");
    }
    pages.forEach((p) => {
      if (p === "...") {
        html += `<span class="px-2 text-gray-400">…</span>`;
      } else {
        html += `<button onclick="AuditLogger.goPage(${p})"
                    class="px-3 py-1 rounded text-sm ${p === current ? "bg-blue-600 text-white" : "bg-gray-100 hover:bg-gray-200 text-gray-700"}">
                    ${p}
                </button>`;
      }
    });

    // Next
    html += `<button onclick="AuditLogger.goPage(${current + 1})"
            class="px-3 py-1 rounded text-sm ${current === total ? "text-gray-300 cursor-not-allowed" : "bg-blue-600 text-white hover:bg-blue-700"}"
            ${current === total ? "disabled" : ""}>
            <i class="fas fa-chevron-right"></i>
        </button>`;

    html += "</div>";
    container.innerHTML = html;
  }

  function goPage(page) {
    if (page < 1) return;
    loadLogs(page, _currentFilters);
  }

  function applyFilters() {
    const filters = {
      filter_action:
        document.getElementById("audit-filter-action")?.value || "",
      filter_module:
        document.getElementById("audit-filter-module")?.value || "",
      filter_from: document.getElementById("audit-filter-from")?.value || "",
      filter_to: document.getElementById("audit-filter-to")?.value || "",
      filter_search:
        document.getElementById("audit-filter-search")?.value || "",
    };
    loadLogs(1, filters);
  }

  function resetFilters() {
    [
      "audit-filter-action",
      "audit-filter-module",
      "audit-filter-from",
      "audit-filter-to",
      "audit-filter-search",
    ].forEach((id) => {
      const el = document.getElementById(id);
      if (el) el.value = "";
    });
    loadLogs(1, {});
  }

  function exportCsv() {
    const params = new URLSearchParams({
      action: "export_csv",
      filter_action:
        document.getElementById("audit-filter-action")?.value || "",
      filter_module:
        document.getElementById("audit-filter-module")?.value || "",
      filter_from: document.getElementById("audit-filter-from")?.value || "",
      filter_to: document.getElementById("audit-filter-to")?.value || "",
    });
    window.location.href = `audit_log_process.php?${params.toString()}`;

    // Log the export action itself
    AuditLogger.log("EXPORT", "Audit Logs", "Exported audit logs to CSV");
  }

  // ── Utilities ──────────────────────────────────────────────────────────

  function actionBadge(action) {
    const map = {
      CREATE: { cls: "bg-green-100 text-green-700", label: "CREATE" },
      UPDATE: { cls: "bg-blue-100 text-blue-700", label: "UPDATE" },
      DELETE: { cls: "bg-red-100 text-red-700", label: "DELETE" },
      LOGIN: { cls: "bg-purple-100 text-purple-700", label: "LOGIN" },
      LOGOUT: { cls: "bg-gray-100 text-gray-600", label: "LOGOUT" },
      EXPORT: { cls: "bg-yellow-100 text-yellow-700", label: "EXPORT" },
      MARK_FINISHED: { cls: "bg-teal-100 text-teal-700", label: "FINISHED" },
      ADD_PARTICIPANT: {
        cls: "bg-indigo-100 text-indigo-700",
        label: "PARTICIPANT+",
      },
      REMOVE_PARTICIPANT: {
        cls: "bg-orange-100 text-orange-700",
        label: "PARTICIPANT-",
      },
    };
    return map[action] || { cls: "bg-gray-100 text-gray-600", label: action };
  }

  function escHtml(str) {
    return String(str ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  // ── Public API ─────────────────────────────────────────────────────────
  return { log, loadLogs, goPage, applyFilters, resetFilters, exportCsv };
})();
