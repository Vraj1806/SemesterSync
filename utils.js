// ─── TOAST NOTIFICATIONS ───────────────────────────────────────────────────
function showToast(message, type = "success") {
    let existing = document.getElementById("toastContainer");
    if (!existing) {
        existing = document.createElement("div");
        existing.id = "toastContainer";
        existing.style.cssText = "position:fixed;top:20px;right:20px;z-index:9999;display:flex;flex-direction:column;gap:10px;";
        document.body.appendChild(existing);
    }
    const colors = {
        success: { bg: "#e6f9f0", color: "#01b574", icon: "fa-check-circle" },
        error:   { bg: "#fff0ef", color: "#ff5b5b", icon: "fa-times-circle" },
        warning: { bg: "#fff8e6", color: "#ffbb33", icon: "fa-exclamation-circle" },
        info:    { bg: "#e8f7ff", color: "#39b8ff", icon: "fa-info-circle" }
    };
    const c = colors[type] || colors.success;
    const toast = document.createElement("div");
    toast.style.cssText = `background:${c.bg};color:${c.color};padding:12px 18px;border-radius:12px;font-size:14px;font-weight:500;display:flex;align-items:center;gap:10px;box-shadow:0 4px 20px rgba(0,0,0,0.1);min-width:240px;animation:slideIn 0.3s ease;`;
    toast.innerHTML = `<i class="fas ${c.icon}"></i><span>${message}</span>`;
    existing.appendChild(toast);
    setTimeout(() => { toast.style.animation = "slideOut 0.3s ease"; setTimeout(() => toast.remove(), 280); }, 3000);
}

// inject toast keyframes once
if (!document.getElementById("toastStyles")) {
    const s = document.createElement("style");
    s.id = "toastStyles";
    s.textContent = `
        @keyframes slideIn  { from { opacity:0; transform:translateX(40px); } to { opacity:1; transform:translateX(0); } }
        @keyframes slideOut { from { opacity:1; transform:translateX(0); }    to { opacity:0; transform:translateX(40px); } }
    `;
    document.head.appendChild(s);
}

// ─── SHA-256 PASSWORD HASHING ──────────────────────────────────────────────
async function hashPassword(password) {
    const msgBuffer = new TextEncoder().encode(password);
    const hashBuffer = await crypto.subtle.digest("SHA-256", msgBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, "0")).join("");
}

// ─── MOBILE SIDEBAR TOGGLE ────────────────────────────────────────────────
function initSidebar() {
    const sidebar = document.querySelector(".sidebar");
    if (!sidebar) return;

    // inject hamburger button
    const btn = document.createElement("button");
    btn.id = "hamburgerBtn";
    btn.innerHTML = '<i class="fas fa-bars"></i>';
    btn.style.cssText = "display:none;position:fixed;top:15px;left:15px;z-index:1100;background:var(--primary-blue);color:white;border:none;width:40px;height:40px;border-radius:10px;cursor:pointer;font-size:16px;";
    document.body.appendChild(btn);

    // overlay for mobile
    const overlay = document.createElement("div");
    overlay.id = "sidebarOverlay";
    overlay.style.cssText = "display:none;position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.4);z-index:1050;";
    document.body.appendChild(overlay);

    btn.onclick = () => {
        sidebar.style.transform = "translateX(0)";
        overlay.style.display = "block";
    };
    overlay.onclick = () => {
        sidebar.style.transform = "translateX(-100%)";
        overlay.style.display = "none";
    };

    // inject mobile CSS
    if (!document.getElementById("mobileStyles")) {
        const s = document.createElement("style");
        s.id = "mobileStyles";
        s.textContent = `
            @media (max-width: 768px) {
                .sidebar { position:fixed !important; top:0; left:0; height:100vh; z-index:1100; transform:translateX(-100%); transition:transform 0.3s ease; }
                #hamburgerBtn { display:flex !important; align-items:center; justify-content:center; }
                .main-content { padding: 20px !important; padding-top: 65px !important; }
                .stats-grid { grid-template-columns: repeat(2,1fr) !important; }
                .dashboard-grid { grid-template-columns: 1fr !important; }
                .profile-layout { grid-template-columns: 1fr !important; }
                .exams-grid { grid-template-columns: 1fr !important; }
                .subjects-grid { grid-template-columns: repeat(2,1fr) !important; }
                .topics-grid { grid-template-columns: repeat(2,1fr) !important; }
                table { font-size: 12px !important; }
            }
            @media (max-width: 480px) {
                .stats-grid { grid-template-columns: 1fr !important; }
                .subjects-grid { grid-template-columns: 1fr !important; }
                .topics-grid { grid-template-columns: 1fr !important; }
            }
        `;
        document.head.appendChild(s);
    }
}

// ─── REMINDER CHECKER ─────────────────────────────────────────────────────
function checkReminders(currentUser) {
    const todayStr = new Date().toISOString().split("T")[0];
    const tomorrow = new Date(); tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = tomorrow.toISOString().split("T")[0];

    const tasks = JSON.parse(localStorage.getItem(currentUser + "_tasks")) || [];
    const assignments = JSON.parse(localStorage.getItem(currentUser + "_assignments")) || [];
    const exams = JSON.parse(localStorage.getItem(currentUser + "_exams")) || [];

    let shown = JSON.parse(sessionStorage.getItem("remindersShown")) || [];

    const check = (items, dateField, nameField, type) => {
        items.forEach(item => {
            const key = type + "_" + item[nameField] + "_" + item[dateField];
            if (shown.includes(key)) return;
            if (item[dateField] === todayStr) {
                showToast(`${type} due TODAY: "${item[nameField]}"`, "warning");
                shown.push(key);
            } else if (item[dateField] === tomorrowStr) {
                showToast(`${type} due TOMORROW: "${item[nameField]}"`, "info");
                shown.push(key);
            }
        });
    };

    check(tasks.filter(t => !t.completed), "date", "name", "Task");
    check(assignments.filter(a => a.status !== "submitted"), "dueDate", "title", "Assignment");
    check(exams, "date", "subject", "Exam");

    sessionStorage.setItem("remindersShown", JSON.stringify(shown));
}

// ─── HELPERS ──────────────────────────────────────────────────────────────
function formatDate(d) {
    if (!d) return "";
    return new Date(d + "T00:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function cap(s) { return s ? s.charAt(0).toUpperCase() + s.slice(1) : ""; }