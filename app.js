/* =========================================================
   SprintLab – MVP SPA (UI-only, static data, clickable flow)
   - Login + Register (with validation + duplicate email check)
   - Dashboard (search + working filter button)
   - Scenario Overview + "Create Active Scenario" (professor)
   - Role Distribution (prof assign + student self-select)
   - Scenario Hub
   - Role Workspaces (PO/BA/Dev/Tester)
   - Stakeholders List + Chat (scripted replies)
   - Backlog List + Detail (prev/next)
   - Outcome (student) + Aggregated Outcome (professor, optional)
   - iPhone 13 frame is enforced in CSS (#app 390×844)
   ========================================================= */

/* -----------------------------
   0) Utilities
-------------------------------- */
const LS_KEY = "sprintlab_state_v2";

function nowIso() {
  return new Date().toISOString();
}

function escapeHtml(str = "") {
  return String(str)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function isValidEmail(email) {
  // simple, sufficient for MVP
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email).trim());
}

function deepClone(obj) {
  return JSON.parse(JSON.stringify(obj));
}

function saveState() {
  localStorage.setItem(LS_KEY, JSON.stringify(state));
}

function loadState() {
  const raw = localStorage.getItem(LS_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function setRoute(route, params = {}) {
  state.nav.route = route;
  state.nav.params = params;
  saveState();
  render();
}

function getSelectedScenario() {
  const id = state.user.selectedScenarioId;
  return DATA.scenarios.find(s => s.id === id) || null;
}

function requireAuthOrRedirect() {
  if (!state.auth.isLoggedIn) {
    setRoute("login");
    return false;
  }
  return true;
}

function currentRoleLabel() {
  return state.user.role || "Student";
}

function isProfessor() {
  return state.user.type === "professor";
}

function icon(name) {
  return `<i data-lucide="${name}"></i>`;
}

function badge(text, kind = "gray") {
  return `<span class="badge ${kind}">${escapeHtml(text)}</span>`;
}

function rolePill(text) {
  return `<span class="role-pill">${escapeHtml(text)}</span>`;
}

/* -----------------------------
   1) Static MVP Data (Scenario + Backlog + Chat scripts)
-------------------------------- */
const DATA = {
  scenarios: [
    {
      id: "scenario01",
      title: "Scenario 01 – Returns Management App",
      short: "Build a comprehensive returns management system for an e-commerce platform.",
      status: "In progress",
      active: true,
      overview: `The Returns Management App is a simplified e-commerce returns system designed to help customers initiate product returns and enable warehouse teams to process them efficiently. It provides a realistic business context to practice requirements clarification, stakeholder communication, backlog creation, and cross-functional role collaboration.`,
      goals: [
        "Improve customer experience when requesting product returns",
        "Reduce manual processing for warehouse staff",
        "Provide clearer visibility of return statuses",
        "Minimize return processing time and errors"
      ],
      constraints: [
        "Limited development capacity (students simulating roles)",
        "Only one return flow in the MVP (happy path)",
        "AI-stakeholder messages are predefined, not dynamic",
        "No integration with real e-commerce systems"
      ],
      personas: [
        {
          id: "customer",
          name: "Customer",
          subtitle: "End User",
          bio: "Wants to return products easily and track return status."
        },
        {
          id: "warehouse",
          name: "Warehouse Operator",
          subtitle: "Operations Staff",
          bio: "Processes physical returns and updates inventory."
        },
        {
          id: "manager",
          name: "Returns Manager",
          subtitle: "Management",
          bio: "Oversees operations, approves refunds, analyzes return trends."
        }
      ],
      successCriteria: [
        "Students can understand a clear real-world context for their role",
        "Scenario supports PM tasks: backlog refinement, communication, trade-offs",
        "Prototype shows coherent story from problem → role → interaction → outcome",
        "Professors can use scenario to guide a classroom simulation"
      ]
    },
    {
      id: "scenario02",
      title: "Scenario 02 – Inventory Tracking System",
      short: "Develop a real-time inventory tracking solution for warehouse operations.",
      status: "Coming soon",
      active: false
    },
    {
      id: "scenario03",
      title: "Scenario 03 – Customer Support Portal",
      short: "Build a lightweight customer support portal for ticketing and tracking.",
      status: "Coming soon",
      active: false
    }
  ],

  // 6 core backlog items for Scenario 01 (static, but “makes sense”)
  backlog: {
    scenario01: [
      {
        id: 1,
        title: "Customer can initiate return request",
        roles: ["PO", "BA", "Dev"],
        priority: "High",
        status: "In Progress",
        story:
          "As a customer, I want to initiate a return request online, so that I can return unwanted or defective products without having to call customer service.",
        ac: [
          "Customer can access return form from order history",
          "Form includes reason for return (dropdown) and optional comments",
          "System validates return eligibility (within 30-day window)",
          "Confirmation email sent after submission",
          "Return request visible in customer account"
        ]
      },
      {
        id: 2,
        title: "System generates return shipping label",
        roles: ["PO", "Dev"],
        priority: "High",
        status: "To Do",
        story:
          "As a customer, I want the system to generate a return shipping label, so that I can ship the item back with minimal effort.",
        ac: [
          "Label is generated after eligible return submission",
          "Label includes sender, warehouse return address, and tracking code",
          "Customer can download label as PDF",
          "Label generation failure shows a clear error message"
        ]
      },
      {
        id: 3,
        title: "Real-time return status tracking",
        roles: ["PO", "BA", "Dev"],
        priority: "High",
        status: "To Do",
        story:
          "As a customer, I want to track my return status in real time, so that I know where the return is in the process.",
        ac: [
          "Return status is visible in customer account",
          "Statuses include: Requested, Shipped, Received, Approved/Rejected, Refunded",
          "Status updates are timestamped",
          "Customer sees next-step hint based on status"
        ]
      },
      {
        id: 4,
        title: "Warehouse operator verifies returned item",
        roles: ["BA", "Dev", "Tester"],
        priority: "Medium",
        status: "To Do",
        story:
          "As a warehouse operator, I want to verify returned items, so that refunds are processed only for valid returns.",
        ac: [
          "Warehouse can mark item as Received",
          "Warehouse can record inspection outcome (approved/rejected)",
          "Warehouse can record reason for rejection",
          "Inspection updates return status"
        ]
      },
      {
        id: 5,
        title: "Automated refund processing",
        roles: ["PO", "Dev", "Tester"],
        priority: "Medium",
        status: "To Do",
        story:
          "As a returns manager, I want refunds to be processed automatically after approval, so that customers receive refunds faster.",
        ac: [
          "Refund is triggered only after return is approved",
          "Refund status is visible to customer",
          "Refund processing time is displayed (5–7 business days)",
          "Refund errors are logged and show a fallback message"
        ]
      },
      {
        id: 6,
        title: "Returns analytics dashboard (basic)",
        roles: ["PO", "BA"],
        priority: "Low",
        status: "To Do",
        story:
          "As a returns manager, I want basic analytics, so that I can identify common return reasons and product issues.",
        ac: [
          "Dashboard shows top return reasons",
          "Dashboard shows return volume per week",
          "Dashboard includes an export placeholder (non-functional)"
        ]
      }
    ]
  },

  // Scripted replies (role-aware enough for MVP)
  chatScripts: {
    customer: [
      {
        match: ["return window", "eligible", "eligibility", "30"],
        reply:
          "I expect to return items within 30 days of purchase. If it's outside that, the app should clearly tell me I can't return it."
      },
      {
        match: ["label", "shipping"],
        reply:
          "I want a shipping label right after I submit the return—ideally downloadable. If something fails, I need clear instructions."
      },
      {
        match: ["status", "track", "tracking"],
        reply:
          "I want to see the status in my account: Requested → Shipped → Received → Approved → Refunded. I also want to know what to do next."
      },
      {
        match: ["refund", "money"],
        reply:
          "Refund time should be transparent. If it takes 5–7 days, the app should show that and confirm when the refund is initiated."
      },
      {
        match: ["reason", "dropdown"],
        reply:
          "Give me simple reasons like 'Defective', 'Wrong size', 'Changed mind', and a comments box. Keep it fast."
      },
      {
        match: [],
        reply:
          "My main priorities are: simple flow, clear eligibility, easy label download, and transparent status/refund updates."
      }
    ],

    warehouse: [
      {
        match: ["received", "receive"],
        reply:
          "We need an easy way to mark a return as Received, and we should scan/enter a tracking code to link it to the request."
      },
      {
        match: ["inspection", "verify"],
        reply:
          "After receiving, we must inspect: approved vs rejected, plus reason. That decision should update the customer status."
      },
      {
        match: ["inventory", "stock"],
        reply:
          "If the item is approved and resellable, inventory should be updated. For MVP, a placeholder note is fine."
      },
      {
        match: ["exceptions", "damaged"],
        reply:
          "Rejected returns should include a reason and optionally photos (future). For MVP, reason text is enough."
      },
      {
        match: [],
        reply:
          "Our workflow is: Receive → Inspect → Mark outcome → Update status. It must be quick and consistent."
      }
    ],

    manager: [
      {
        match: ["success", "criteria"],
        reply:
          "Success means fewer manual steps, faster cycle time, and fewer customer complaints. Status visibility is key."
      },
      {
        match: ["scope", "mvp", "capacity"],
        reply:
          "Keep MVP focused on the happy path: submit return, label, tracking statuses, warehouse verify, refund placeholder."
      },
      {
        match: ["risk", "failure"],
        reply:
          "Risks include unclear eligibility rules and inconsistent status updates. Ensure the UI explains rules at each step."
      },
      {
        match: ["analytics", "dashboard"],
        reply:
          "Analytics is nice-to-have. Prioritize core flow first, then add a basic view of reasons/volume as a placeholder."
      },
      {
        match: [],
        reply:
          "Prioritize: customer UX, operational clarity, and consistent statuses. Make trade-offs explicit in your notes."
      }
    ]
  }
};

/* -----------------------------
   2) Default State
-------------------------------- */
function defaultState() {
  return {
    version: 2,
    auth: {
      isLoggedIn: false,
      email: "",
      // In MVP we simulate accounts in local state:
      accounts: [
        { name: "Demo Student", email: "demo@sprintlab.edu", password: "demo123", type: "student" },
        { name: "Demo Professor", email: "prof@sprintlab.edu", password: "prof123", type: "professor" },
        { name: "Emma Johnson", email: "emma@uni.edu", password: "emma123", type: "student" }
      ]
    },
    user: {
      name: "Student",
      email: "",
      type: "student", // student | professor
      role: "Student", // Student | PO | BA | Dev | Tester
      selectedScenarioId: null
    },
    nav: {
      route: "login",
      params: {}
    },
    ui: {
      dashboard: {
        search: "",
        filterOpen: false,
        filterRole: "All",
        filterStatus: "All"
      },
      auth: {
        loginErrors: {},
        registerErrors: {},
        registerForm: { name: "", email: "", password: "" },
        loginForm: { email: "", password: "" }
      }
    },
    // Active scenario instance flags (UI-only)
    activeScenario: {
      scenario01: { isActive: true } // keep true for MVP demo
    },
    // Role distribution per scenario
    roles: {
      scenario01: [
        { name: "PO", label: "Product Owner", status: "assigned", person: "Emma Johnson" },
        { name: "BA", label: "Business Analyst", status: "available", person: null },
        { name: "Dev", label: "Developer", status: "assigned", person: "Michael Chen" },
        { name: "Tester", label: "Tester", status: "available", person: null }
      ]
    },
    // Workspace tasks completion (UI-only)
    workspace: {
      scenario01: {
        PO: { tasksDone: { t1: true, t2: true, t3: false, t4: false } },
        BA: { tasksDone: { t1: false, t2: false, t3: false } },
        Dev: { tasksDone: { t1: false, t2: false, t3: false } },
        Tester: { tasksDone: { t1: false, t2: false, t3: false } }
      }
    },
    // Chat history per scenario + stakeholder
    chats: {
      scenario01: {
        customer: { messages: [], unread: 2 },
        warehouse: { messages: [], unread: 0 },
        manager: { messages: [], unread: 0 }
      }
    },
    // Backlog filters and touched items (for highlights)
    backlogUI: {
      scenario01: {
        filterPriority: "All",
        filterStatus: "All",
        filterRole: "All"
      }
    },
    activity: {
      scenario01: {
        backlogTouchedIds: [],
        chatCount: 0
      }
    },
    // Outcome reflection (student only, optional)
    reflections: {
      scenario01: ""
    },
    // Professor monitoring (static, optional)
    classView: {
      scenario01: {
        groups: [
          { name: "Team A", role: "PO", status: "Completed", chats: 4, backlogTouched: 4 },
          { name: "Team B", role: "BA", status: "In Progress", chats: 2, backlogTouched: 2 },
          { name: "Team C", role: "Dev", status: "Idle", chats: 1, backlogTouched: 1 },
          { name: "Team D", role: "Tester", status: "In Progress", chats: 3, backlogTouched: 2 }
        ]
      }
    }
  };
}

let state = loadState() || defaultState();

/* -----------------------------
   3) Header Builder
-------------------------------- */
function header({ title = "SprintLab", subtitle = "", showBack = false, backRoute = null, backParams = {} } = {}) {
  const role = currentRoleLabel();
  const showRolePill = state.auth.isLoggedIn && state.user.selectedScenarioId;

  const renounceBtn =
    state.auth.isLoggedIn &&
    state.user.selectedScenarioId &&
    !isProfessor() &&
    role !== "Student"
      ? `
        <button
          class="btn btn-ghost renounce-btn"
          id="btnRenounce"
          title="Renounce role"
          aria-label="Renounce role"
        >
          ${icon("x")}
        </button>
      `
      : "";

  const backBtn = showBack
    ? `<button class="btn btn-ghost" id="btnBack" style="padding:8px 10px;border-radius:10px;font-size:12px;display:flex;align-items:center;gap:6px;">
         ${icon("arrow-left")} <span>Back</span>
       </button>`
    : "";

  const profileBtn = state.auth.isLoggedIn
    ? `<button class="btn btn-secondary" id="btnProfile" style="padding:8px 10px;border-radius:999px;display:flex;align-items:center;gap:6px;">
         ${icon("user")}
       </button>`
    : "";

  const logoutBtn = state.auth.isLoggedIn
    ? `<button class="btn btn-ghost" id="btnLogout" style="padding:8px 10px;border-radius:10px;display:flex;align-items:center;gap:6px;">
         ${icon("log-out")}
       </button>`
    : "";

  const sub = subtitle ? `<div class="subtle">${escapeHtml(subtitle)}</div>` : "";

  return `
    <div class="header">
      <div class="app-brand">
        <div class="app-logo">SL</div>
        <div>
          <div class="app-title">${escapeHtml(title)}</div>
          ${sub}
        </div>
      </div>

      <div class="header-actions">
        ${backBtn}
        ${showRolePill ? rolePill(role) : ""}
        ${renounceBtn}
        ${profileBtn}
        ${logoutBtn}
      </div>
    </div>
  `;
}

/* -----------------------------
   4) Screens – Render Functions
-------------------------------- */
function screenLogin() {
  const errs = state.ui.auth.loginErrors || {};
  const form = state.ui.auth.loginForm || { email: "", password: "" };

  return `
    ${header({ title: "SprintLab" })}
    <div class="screen">
      <div class="auth-container">
        <div class="auth-logo">SL</div>
        <h1 style="margin-bottom:6px;">Welcome to SprintLab</h1>
        <p style="margin-bottom:18px;">Log in to continue</p>

        <div class="auth-box" style="text-align:left;">
          <div style="font-weight:600;margin-bottom:8px;">Demo Account Credentials:</div>
          <div class="small" style="margin-bottom:6px;"><b>Student:</b> demo@sprintlab.edu / demo123</div>
          <div class="small"><b>Professor:</b> prof@sprintlab.edu / prof123</div>
        </div>

        <div class="input-group">
          <label>Email</label>
          <input id="loginEmail" type="text" placeholder="you@example.com" value="${escapeHtml(form.email)}" />
          ${errs.email ? `<div class="input-error">${escapeHtml(errs.email)}</div>` : ""}
        </div>

        <div class="input-group">
          <label>Password</label>
          <input id="loginPassword" type="password" placeholder="••••••••" value="${escapeHtml(form.password)}" />
          ${errs.password ? `<div class="input-error">${escapeHtml(errs.password)}</div>` : ""}
          ${errs.general ? `<div class="input-error" style="margin-top:10px;">${escapeHtml(errs.general)}</div>` : ""}
        </div>

        <button class="btn btn-primary btn-full" id="btnLogin">Log In</button>

        <div style="margin-top:14px;">
          <button class="btn btn-ghost" id="goRegister" style="width:100%;">Create account</button>
        </div>
      </div>
      <div class="safe-area"></div>
    </div>
  `;
}

function screenRegister() {
  const errs = state.ui.auth.registerErrors || {};
  const f = state.ui.auth.registerForm || { name: "", email: "", password: "" };

  return `
    ${header({ title: "SprintLab", showBack: true, backRoute: "login" })}
    <div class="screen">
      <div class="auth-container" style="padding-top:10px;">
        <h1 style="margin-bottom:6px;">Create your account</h1>
        <p style="margin-bottom:18px;">UI-only registration (stored locally)</p>

        <div class="input-group">
          <label>Name</label>
          <input id="regName" type="text" placeholder="Your name" value="${escapeHtml(f.name)}" />
          ${errs.name ? `<div class="input-error">${escapeHtml(errs.name)}</div>` : ""}
        </div>

        <div class="input-group">
          <label>Email</label>
          <input id="regEmail" type="text" placeholder="you@example.com" value="${escapeHtml(f.email)}" />
          ${errs.email ? `<div class="input-error">${escapeHtml(errs.email)}</div>` : ""}
        </div>

        <div class="input-group">
          <label>Password</label>
          <input id="regPassword" type="password" placeholder="At least 4 characters" value="${escapeHtml(f.password)}" />
          ${errs.password ? `<div class="input-error">${escapeHtml(errs.password)}</div>` : ""}
          ${errs.general ? `<div class="input-error" style="margin-top:10px;">${escapeHtml(errs.general)}</div>` : ""}
        </div>

        <div class="info-box" style="text-align:left;margin-bottom:14px;">
          Tip: This MVP stores accounts in your browser only. No backend.
        </div>

        <button class="btn btn-primary btn-full" id="btnRegister">Register / Sign up</button>

        <div style="margin-top:14px;">
          <button class="btn btn-ghost" id="goLogin" style="width:100%;">Already have an account? Log in</button>
        </div>
      </div>
      <div class="safe-area"></div>
    </div>
  `;
}

function screenDashboard() {
  if (!requireAuthOrRedirect()) return "";

  const ui = state.ui.dashboard;
  const query = (ui.search || "").trim().toLowerCase();

  let list = DATA.scenarios.map(s => {
    const userRoleTag = s.id === "scenario01" && s.active
      ? (state.user.selectedScenarioId === "scenario01" ? currentRoleLabel() : "Unassigned")
      : "Unassigned";

    return {
      ...s,
      userRoleTag
    };
  });

  // Apply search
  if (query) {
    list = list.filter(s =>
      s.title.toLowerCase().includes(query) ||
      (s.short || "").toLowerCase().includes(query)
    );
  }

  // Apply filters (working filter button requirement)
  if (ui.filterRole !== "All") {
    list = list.filter(s => s.userRoleTag === ui.filterRole);
  }
  if (ui.filterStatus !== "All") {
    list = list.filter(s => s.status === ui.filterStatus);
  }

  const filterPanel = ui.filterOpen
    ? `
      <div class="card" style="margin-top:10px;">
        <div style="display:flex;gap:10px;align-items:center;justify-content:space-between;">
          <div style="font-weight:600;">Filters</div>
          <button class="btn btn-ghost" id="closeFilter" style="padding:8px 10px;border-radius:10px;">${icon("x")}</button>
        </div>

        <div style="margin-top:12px;">
          <div class="small" style="margin-bottom:6px;">Role tag</div>
          <div style="display:flex;gap:10px;flex-wrap:wrap;">
            ${["All", "Unassigned", "Student", "PO", "BA", "Dev", "Tester", "Professor"].map(r => `
              <button class="btn ${ui.filterRole === r ? "btn-primary" : "btn-secondary"}"
                      data-filter-role="${escapeHtml(r)}"
                      style="padding:8px 10px;border-radius:999px;font-size:12px;">
                ${escapeHtml(r)}
              </button>
            `).join("")}
          </div>
        </div>

        <div style="margin-top:12px;">
          <div class="small" style="margin-bottom:6px;">Scenario status</div>
          <div style="display:flex;gap:10px;flex-wrap:wrap;">
            ${["All", "In progress", "Coming soon"].map(st => `
              <button class="btn ${ui.filterStatus === st ? "btn-primary" : "btn-secondary"}"
                      data-filter-status="${escapeHtml(st)}"
                      style="padding:8px 10px;border-radius:999px;font-size:12px;">
                ${escapeHtml(st)}
              </button>
            `).join("")}
          </div>
        </div>
      </div>
    `
    : "";

  return `
    ${header({ title: "SprintLab" })}
    <div class="screen">
      <h1 style="margin-bottom:10px;">Available Scenarios</h1>

      <div class="card" style="padding:12px;display:flex;gap:10px;align-items:center;">
        <div style="flex:1;display:flex;gap:8px;align-items:center;">
          <span style="color:#64748b;">${icon("search")}</span>
          <input id="scenarioSearch"
                 type="text"
                 placeholder="Search scenarios..."
                 value="${escapeHtml(state.ui.dashboard.search)}"
                 style="border:none;outline:none;background:transparent;width:100%;font-size:14px;" />
        </div>
        <button class="btn btn-secondary" id="btnFilter"
                style="padding:10px 12px;border-radius:12px;display:flex;align-items:center;justify-content:center;">
          ${icon("filter")}
        </button>
      </div>

      ${filterPanel}

      <div class="info-box" style="margin-top:12px;">
        Currently showing 1 active scenario. More scenarios coming soon!
      </div>

      <div style="margin-top:12px;">
        ${list.map(s => scenarioCard(s)).join("")}
      </div>

      <div class="safe-area"></div>
    </div>
  `;
}

function scenarioCard(s) {
  const disabled = !s.active;
  const roleTag = s.userRoleTag;

  const statusBadge =
    s.status === "In progress"
      ? badge("In progress", "warning")
      : badge("Coming soon", "gray");

  const openBtn = disabled
    ? `<button class="btn btn-secondary" disabled style="opacity:0.55;">Locked</button>`
    : `<button class="btn btn-primary" data-open-scenario="${escapeHtml(s.id)}" style="padding:10px 12px;border-radius:12px;">Open</button>`;

  const lockIcon = disabled ? `<div style="color:#94a3b8;">${icon("lock")}</div>` : "";

  return `
    <div class="card" style="${disabled ? "opacity:0.5;" : ""}">
      <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:10px;">
        <div style="display:flex;gap:10px;align-items:flex-start;">
          ${lockIcon}
          <div>
            <h2 style="font-size:16px;margin-bottom:6px;">${escapeHtml(s.title)}</h2>
            <p>${escapeHtml(s.short || "")}</p>
          </div>
        </div>
        <div>${statusBadge}</div>
      </div>

      <div style="display:flex;justify-content:space-between;align-items:center;margin-top:14px;">
        <div class="small">Role: ${escapeHtml(roleTag)}</div>
        ${openBtn}
      </div>
    </div>
  `;
}

function screenScenarioOverview() {
  if (!requireAuthOrRedirect()) return "";

  const scen = getSelectedScenario();
  if (!scen) return screenDashboard();

  const subtitle = scen.title;

  const personaCards = (scen.personas || []).map(p => `
    <div class="card" style="padding:12px;">
      <div style="font-weight:600;margin-bottom:4px;">${escapeHtml(p.name)}</div>
      <div class="small" style="margin-bottom:8px;">${escapeHtml(p.subtitle)}</div>
      <p>${escapeHtml(p.bio)}</p>
    </div>
  `).join("");

  const createBtn = isProfessor()
    ? `<button class="btn btn-primary" id="btnCreateActive" style="margin-top:12px;">Create active scenario</button>`
    : "";

  return `
    ${header({ title: "SprintLab", subtitle, showBack: true, backRoute: "home" })}
    <div class="screen">
      <h1 style="margin-bottom:6px;">Scenario 01</h1>
      <p style="margin-bottom:14px;">Returns Management App</p>

      <h2 style="margin:14px 0 8px;">Overview</h2>
      <p>${escapeHtml(scen.overview || "")}</p>

      <h2 style="margin:18px 0 8px;">Goals</h2>
      <div class="card" style="padding:12px;">
        <ul style="margin:0;padding-left:18px;color:#475569;">
          ${(scen.goals || []).map(g => `<li style="margin:8px 0;">${escapeHtml(g)}</li>`).join("")}
        </ul>
      </div>

      <h2 style="margin:18px 0 8px;">Constraints</h2>
      <div class="card" style="padding:12px;">
        <ul style="margin:0;padding-left:18px;color:#475569;">
          ${(scen.constraints || []).map(c => `<li style="margin:8px 0;">${escapeHtml(c)}</li>`).join("")}
        </ul>
      </div>

      <h2 style="margin:18px 0 8px;">Personas</h2>
      <div style="display:grid;gap:12px;">${personaCards}</div>

      <h2 style="margin:18px 0 8px;">Success criteria</h2>
      <div class="card" style="padding:12px;">
        <ul style="margin:0;padding-left:18px;color:#475569;">
          ${(scen.successCriteria || []).map(sc => `<li style="margin:8px 0;">${escapeHtml(sc)}</li>`).join("")}
        </ul>
      </div>

      ${createBtn}

      <div class="safe-area"></div>
    </div>
  `;
}

function screenRoleDistribution() {
  if (!requireAuthOrRedirect()) return "";
  const scen = getSelectedScenario();
  if (!scen) return screenDashboard();

  const roles = state.roles[scen.id] || [];
  const subtitle = `${scen.title}`;

  const hint = `
    <div class="info-box" style="margin-top:12px;">
      Tip: Click on an available role to select it for yourself.
    </div>
  `;

  const rows = roles.map(r => {
    const assigned = r.status === "assigned";
    const statusChip = assigned ? badge("Assigned", "success") : badge("Available", "gray");
    const personLine = assigned ? escapeHtml(r.person || "Assigned") : "No student assigned";

    // Student self-select: only if available and professor didn’t lock it
    const clickable = !isProfessor() && r.status === "available";
    const cardAttrs = clickable ? `data-pick-role="${escapeHtml(r.name)}"` : "";
    const extraStyle = clickable ? "cursor:pointer;" : "opacity:1;";

    // Professor assign control (UI-only)
    const profAssign = isProfessor()
      ? `
        <div style="margin-top:10px;display:flex;gap:10px;">
          <input type="text" placeholder="Student name"
                 data-prof-assign-input="${escapeHtml(r.name)}"
                 style="flex:1;padding:10px;border:1px solid #cbd5f5;border-radius:10px;" />
          <button class="btn btn-secondary" data-prof-assign-btn="${escapeHtml(r.name)}" style="padding:10px 12px;border-radius:12px;">
            Assign
          </button>
        </div>
      `
      : "";

    return `
      <div class="card" ${cardAttrs} style="${extraStyle}">
        <div class="role-row">
          <div>
            <div style="font-weight:600;font-size:15px;">${escapeHtml(r.label)}</div>
            <div class="small" style="margin-top:4px;">${escapeHtml(personLine)}</div>
          </div>
          <div>${statusChip}</div>
        </div>
        ${profAssign}
      </div>
    `;
  }).join("");

  const selectedRole = state.nav.params.selectedRole || null;
  const confirmBlock = (!isProfessor() && selectedRole)
    ? `
      <div class="card" style="margin-top:14px;border:1px solid #bfdbfe;background:#eff6ff;">
        <div style="font-weight:600;margin-bottom:8px;">Confirm role selection</div>
        <div class="small" style="margin-bottom:12px;">You selected: <b>${escapeHtml(selectedRole)}</b></div>
        <button class="btn btn-primary btn-full" id="btnConfirmRole">Confirm Role</button>
      </div>
    `
    : "";

  const saveDistributionBtn = isProfessor()
    ? `<button class="btn btn-primary btn-full" id="btnSaveDistribution" style="margin-top:14px;">Save distribution</button>`
    : "";

  return `
    ${header({ title: "SprintLab", subtitle, showBack: true, backRoute: "hub" })}
    <div class="screen">
      <h1 style="margin-bottom:6px;">Role Distribution</h1>
      <p style="margin-bottom:14px;">${isProfessor() ? "Assign students to roles for this session." : "Select an available role to join the project."}</p>

      <h2 style="margin:12px 0 8px;">Team Roles</h2>
      ${rows}
      ${hint}
      ${confirmBlock}
      ${saveDistributionBtn}

      <div class="safe-area"></div>
    </div>
  `;
}

function screenHub() {
  if (!requireAuthOrRedirect()) return "";
  const scen = getSelectedScenario();
  if (!scen) return screenDashboard();

  const subtitle = `${scen.title} ${currentRoleLabel() !== "Student" ? " • " + currentRoleLabel() : ""}`;

  // Simple progress: requirements = any chat or overview visited; backlog = backlog touched; testing = any task completed; outcome = reflection or reached outcome
  const act = state.activity[scen.id] || { backlogTouchedIds: [], chatCount: 0 };
  const hasReq = act.chatCount > 0; // proxy
  const hasBacklog = (act.backlogTouchedIds || []).length > 0;

  const roleTasks = state.workspace[scen.id]?.[currentRoleLabel()]?.tasksDone || {};
  const hasTesting = Object.values(roleTasks).some(Boolean);
  const hasOutcome = (state.reflections[scen.id] || "").trim().length > 0;

  const stepClass = (cond) => cond ? "step active" : "step";

  return `
    ${header({ title: "SprintLab", subtitle })}
    <div class="screen">
      <h1 style="margin-bottom:4px;">Scenario Hub</h1>
      <p style="margin-bottom:14px;">Navigate to different areas of the scenario</p>

      <div class="progress-card">
        <div style="font-weight:600;margin-bottom:10px;">Progress</div>
        <div class="progress-steps">
          <div class="${stepClass(hasReq)}">
            <div class="step-circle">1</div>
            <div class="step-label">Requirements</div>
          </div>
          <div class="${stepClass(hasBacklog)}">
            <div class="step-circle">2</div>
            <div class="step-label">Backlog</div>
          </div>
          <div class="${stepClass(hasTesting)}">
            <div class="step-circle">3</div>
            <div class="step-label">Testing</div>
          </div>
          <div class="${stepClass(hasOutcome)}">
            <div class="step-circle">4</div>
            <div class="step-label">Outcome</div>
          </div>
        </div>
      </div>

      <div class="grid">
        ${hubTile("Scenario Overview", "View goals, constraints, and personas", "file-text", "overview")}
        ${hubTile("Role Distribution", "See team roles and assignments", "users", "roles")}
        ${hubTile("My Workspace", "Role workspace and tasks", "briefcase", "workspace")}
        ${hubTile("Stakeholders", "Chat with AI stakeholders", "message-circle", "stakeholders")}
        ${hubTile("Backlog", "View and manage backlog items", "list-checks", "backlog")}
        ${hubTile("Outcome & Summary", "Review progress and reflections", "trending-up", isProfessor() ? "prof_outcome" : "outcome")}
      </div>

      <div class="safe-area"></div>
    </div>
  `;
}

function hubTile(title, desc, iconName, route) {
  return `
    <div class="card" data-go="${escapeHtml(route)}" style="cursor:pointer;">
      <div class="card-icon">${icon(iconName)}</div>
      <div class="card-title">${escapeHtml(title)}</div>
      <div class="card-desc">${escapeHtml(desc)}</div>
    </div>
  `;
}

function screenWorkspace() {
  if (!requireAuthOrRedirect()) return "";
  const scen = getSelectedScenario();
  if (!scen) return screenDashboard();

  const role = currentRoleLabel();
  const subtitle = `${scen.title} • ${role}`;

  const ctxCard = `
    <div class="card" style="border:1px solid #bfdbfe;background:#eff6ff;margin-top:12px;">
      <div style="font-weight:600;margin-bottom:4px;">Current step</div>
      <div>${escapeHtml(role === "PO" ? "Step 2: Refine backlog items based on stakeholder input" :
          role === "BA" ? "Step 1: Clarify requirements and acceptance criteria" :
          role === "Dev" ? "Step 3: Plan implementation assumptions and dependencies" :
          role === "Tester" ? "Step 3: Plan test cases and edge cases" : "Choose a role to access workspace tasks.")}</div>
    </div>
  `;

  const tasks = getWorkspaceTasks(role);
  const tasksHtml = tasks.map(t => taskRow(scen.id, role, t)).join("");

  const quickLinks = `
    <div class="card" style="margin-top:12px;cursor:pointer;" data-go="stakeholders">
      <div class="card-icon">${icon("message-circle")}</div>
      <div class="card-title">Talk to Stakeholders</div>
      <div class="card-desc">Get requirements and feedback</div>
    </div>
    <div class="card" style="margin-top:12px;cursor:pointer;" data-go="backlog">
      <div class="card-icon">${icon("list-checks")}</div>
      <div class="card-title">View Backlog</div>
      <div class="card-desc">Review and update items</div>
    </div>
  `;

  return `
    ${header({ title: "SprintLab", subtitle, showBack: true, backRoute: "hub" })}
    <div class="screen">
      <h1 style="margin-bottom:6px;">${escapeHtml(role === "Student" ? "My Workspace" : roleNameLong(role) + " Workspace")}</h1>
      <p>${escapeHtml(roleDescription(role))}</p>

      ${ctxCard}

      <h2 style="margin:16px 0 10px;">Active Tasks</h2>
      <div style="display:grid;gap:10px;">
        ${tasksHtml || `<div class="info-box">Pick a role in Role Distribution to unlock role tasks.</div>`}
      </div>

      ${quickLinks}
      <div class="safe-area"></div>
    </div>
  `;
}

function roleNameLong(role) {
  if (role === "PO") return "Product Owner";
  if (role === "BA") return "Business Analyst";
  if (role === "Dev") return "Developer";
  if (role === "Tester") return "Tester";
  return "Student";
}

function roleDescription(role) {
  if (role === "PO") return "Define and prioritize product features based on stakeholder needs";
  if (role === "BA") return "Refine user stories and acceptance criteria; clarify requirements";
  if (role === "Dev") return "Identify implementation assumptions, dependencies, and technical notes";
  if (role === "Tester") return "Plan tests, edge cases, and validate acceptance criteria";
  return "Select a role to access role-specific tasks and tools.";
}

function getWorkspaceTasks(role) {
  // UI-only tasks that align with EPICs and acceptance criteria
  if (role === "PO") {
    return [
      { id: "t1", text: "Interview stakeholders to gather requirements" },
      { id: "t2", text: "Define user stories with acceptance criteria" },
      { id: "t3", text: "Prioritize backlog items" },
      { id: "t4", text: "Review and approve test cases" }
    ];
  }
  if (role === "BA") {
    return [
      { id: "t1", text: "Clarify personas’ goals and constraints" },
      { id: "t2", text: "Refine user story wording for top backlog items" },
      { id: "t3", text: "Validate acceptance criteria completeness (happy path)" }
    ];
  }
  if (role === "Dev") {
    return [
      { id: "t1", text: "Identify dependencies for label generation and tracking" },
      { id: "t2", text: "Draft implementation assumptions (UI-only)" },
      { id: "t3", text: "Flag risky areas (eligibility rules, status consistency)" }
    ];
  }
  if (role === "Tester") {
    return [
      { id: "t1", text: "Draft test scenarios for eligibility validation" },
      { id: "t2", text: "Draft test cases for status transitions" },
      { id: "t3", text: "Validate navigation flows (no dead ends)" }
    ];
  }
  return [];
}

function taskRow(scenarioId, role, task) {
  const done = !!state.workspace[scenarioId]?.[role]?.tasksDone?.[task.id];
  return `
    <div class="task ${done ? "completed" : ""}">
      <input type="checkbox" data-task="${escapeHtml(role)}:${escapeHtml(task.id)}" ${done ? "checked" : ""} />
      <div style="${done ? "text-decoration:line-through;color:#64748b;" : ""}">
        ${escapeHtml(task.text)}
      </div>
    </div>
  `;
}

function screenStakeholders() {
  if (!requireAuthOrRedirect()) return "";
  const scen = getSelectedScenario();
  if (!scen) return screenDashboard();

  const subtitle = `${scen.title} • ${currentRoleLabel()}`;

  const cards = (scen.personas || []).map(p => {
    const unread = state.chats[scen.id]?.[p.id]?.unread || 0;
    return `
      <div class="card" style="margin-top:12px;">
        <div style="display:flex;align-items:center;justify-content:space-between;">
          <div>
            <div style="font-size:16px;font-weight:600;">
              ${escapeHtml(p.name)}
              ${unread ? `<span class="badge info" style="margin-left:8px;">${unread}</span>` : ""}
            </div>
            <div class="small">${escapeHtml(p.subtitle)}</div>
          </div>
        </div>
        <p style="margin-top:10px;">${escapeHtml(p.bio)}</p>
        <button class="btn btn-primary btn-full" data-open-chat="${escapeHtml(p.id)}" style="margin-top:12px;display:flex;align-items:center;justify-content:center;gap:8px;">
          ${icon("message-circle")} <span>Open Chat</span>
        </button>
      </div>
    `;
  }).join("");

  return `
    ${header({ title: "SprintLab", subtitle, showBack: true, backRoute: "workspace" })}
    <div class="screen">
      <h1 style="margin-bottom:6px;">Stakeholders</h1>
      <p style="margin-bottom:14px;">Chat with AI stakeholders to gather requirements and feedback</p>
      ${cards}
      <div class="safe-area"></div>
    </div>
  `;
}

function screenChat() {
  if (!requireAuthOrRedirect()) return "";
  const scen = getSelectedScenario();
  if (!scen) return screenDashboard();

  const stakeholderId = state.nav.params.stakeholderId;
  const persona = scen.personas.find(p => p.id === stakeholderId);
  if (!persona) return screenStakeholders();

  const subtitle = `${scen.title} • ${persona.name}`;

  const chatState = state.chats[scen.id]?.[stakeholderId];
  const msgs = chatState?.messages || [];

  const msgHtml = msgs.map(m => `
    <div class="message ${m.from === "user" ? "user" : "ai"}">${escapeHtml(m.text)}</div>
  `).join("");

  const hintText = isProfessor()
    ? "Professor view: review message history (UI-only)."
    : `Hint: Ask about eligibility, label, status tracking, or acceptance criteria from your role (${currentRoleLabel()}).`;

  return `
    ${header({ title: "SprintLab", subtitle, showBack: true, backRoute: "stakeholders" })}
    <div class="screen" style="padding:0;">
      <div class="chat-container">
        <div style="padding:16px;border-bottom:1px solid #e5e7eb;background:#fff;">
          <div style="font-weight:600;font-size:15px;">${escapeHtml(persona.name)} <span class="small">(${escapeHtml(persona.subtitle)})</span></div>
          <div class="small" style="margin-top:6px;">${escapeHtml(hintText)}</div>
        </div>

        <div class="chat-messages" id="chatMessages">
          ${msgHtml || `<div class="small" style="padding:10px;color:#64748b;">No messages yet. Start by asking a question.</div>`}
        </div>

        <div class="chat-input">
          <textarea id="chatInput" rows="2" placeholder="Type your question…"></textarea>
          <button class="btn btn-primary" id="btnSend" style="padding:10px 12px;border-radius:12px;">Send</button>
        </div>
      </div>
    </div>
  `;
}

function screenBacklog() {
  if (!requireAuthOrRedirect()) return "";
  const scen = getSelectedScenario();
  if (!scen) return screenDashboard();

  const subtitle = `${scen.title} • ${currentRoleLabel()}`;
  const items = DATA.backlog[scen.id] || [];

  const ui = state.backlogUI[scen.id] || { filterPriority: "All", filterStatus: "All", filterRole: "All" };

  let filtered = items.slice();

  if (ui.filterPriority !== "All") filtered = filtered.filter(i => i.priority === ui.filterPriority);
  if (ui.filterStatus !== "All") filtered = filtered.filter(i => i.status === ui.filterStatus);
  if (ui.filterRole !== "All") filtered = filtered.filter(i => (i.roles || []).includes(ui.filterRole));

  const selects = `
    <div style="display:flex;gap:12px;margin:14px 0;">
      <select id="filterPriority" style="flex:1;padding:10px;border:1px solid #cbd5f5;border-radius:12px;">
        ${["All", "High", "Medium", "Low"].map(p => `<option ${ui.filterPriority===p?"selected":""}>${p} Priorities</option>`).join("")}
      </select>
      <select id="filterStatus" style="flex:1;padding:10px;border:1px solid #cbd5f5;border-radius:12px;">
        ${["All", "To Do", "In Progress", "Done"].map(s => `<option ${ui.filterStatus===s?"selected":""}>${s === "All" ? "All Status" : s}</option>`).join("")}
      </select>
    </div>
    <div style="display:flex;gap:12px;margin-bottom:10px;">
      <select id="filterRole" style="flex:1;padding:10px;border:1px solid #cbd5f5;border-radius:12px;">
        ${["All", "PO", "BA", "Dev", "Tester"].map(r => `<option ${ui.filterRole===r?"selected":""}>${r === "All" ? "All Roles" : r}</option>`).join("")}
      </select>
    </div>
  `;

  const list = filtered.map(i => backlogRow(i)).join("");

  return `
    ${header({ title: "SprintLab", subtitle, showBack: true, backRoute: "hub" })}
    <div class="screen">
      <h1 style="margin-bottom:6px;">Product Backlog</h1>
      <p>View and manage backlog items</p>

      ${selects}

      ${list || `<div class="info-box">No items match the selected filters.</div>`}

      <div class="safe-area"></div>
    </div>
  `;
}

function backlogRow(item) {
  const roleTags = (item.roles || []).map(r => `<span class="badge gray" style="margin-right:6px;">${escapeHtml(r)}</span>`).join("");

  const priorityChip =
    item.priority === "High" ? badge("High", "warning") :
    item.priority === "Medium" ? badge("Medium", "info") :
    badge("Low", "gray");

  const statusChip =
    item.status === "In Progress" ? badge("In Progress", "info") :
    item.status === "Done" ? badge("Done", "success") :
    badge("To Do", "gray");

  return `
    <div class="backlog-item" data-open-item="${escapeHtml(item.id)}" style="cursor:pointer;background:#fff;">
      <div class="backlog-header">
        <div style="display:flex;gap:8px;align-items:center;">
          <div class="small">#${escapeHtml(item.id)}</div>
          <div style="font-weight:600;">${escapeHtml(item.title)}</div>
        </div>
        <div style="color:#94a3b8;">${icon("chevron-right")}</div>
      </div>

      <div style="margin-top:8px;">${roleTags}</div>

      <div style="margin-top:10px;display:flex;gap:10px;flex-wrap:wrap;">
        ${priorityChip}
        ${statusChip}
      </div>
    </div>
  `;
}

function screenBacklogDetail() {
  if (!requireAuthOrRedirect()) return "";
  const scen = getSelectedScenario();
  if (!scen) return screenDashboard();

  const itemId = Number(state.nav.params.itemId);
  const items = DATA.backlog[scen.id] || [];
  const idx = items.findIndex(i => i.id === itemId);
  const item = items[idx];
  if (!item) return screenBacklog();

  // Track “touched” items for highlights
  const act = state.activity[scen.id] || (state.activity[scen.id] = { backlogTouchedIds: [], chatCount: 0 });
  if (!act.backlogTouchedIds.includes(itemId)) act.backlogTouchedIds.push(itemId);

  const subtitle = `${scen.title} • Backlog #${itemId}`;

  const priorityChip =
    item.priority === "High" ? badge("Priority: High", "warning") :
    item.priority === "Medium" ? badge("Priority: Medium", "info") :
    badge("Priority: Low", "gray");

  const statusChip =
    item.status === "In Progress" ? badge("In Progress", "info") :
    item.status === "Done" ? badge("Done", "success") :
    badge("To Do", "gray");

  const roleTags = (item.roles || []).map(r => `<span class="badge gray" style="margin-right:6px;">${escapeHtml(r)}</span>`).join("");

  const prevBtn = idx > 0
    ? `<button class="btn btn-secondary" id="btnPrevItem" style="flex:1;">Previous</button>`
    : `<button class="btn btn-secondary" disabled style="flex:1;opacity:0.6;">Previous</button>`;

  const nextBtn = idx < items.length - 1
    ? `<button class="btn btn-secondary" id="btnNextItem" style="flex:1;">Next</button>`
    : `<button class="btn btn-secondary" disabled style="flex:1;opacity:0.6;">Next</button>`;

  return `
    ${header({ title: "SprintLab", subtitle, showBack: true, backRoute: "backlog" })}
    <div class="screen">
      <div class="small" style="margin-bottom:6px;">#${escapeHtml(item.id)} ${roleTags}</div>
      <h1 style="margin-bottom:10px;">${escapeHtml(item.title)}</h1>

      <div style="display:flex;gap:10px;flex-wrap:wrap;margin-bottom:14px;">
        ${priorityChip}
        ${statusChip}
      </div>

      <div class="card" style="margin-bottom:12px;">
        <div style="font-weight:600;margin-bottom:8px;">User Story</div>
        <p style="font-style:italic;color:#334155;">${escapeHtml(item.story)}</p>
      </div>

      <div class="card">
        <div style="font-weight:600;margin-bottom:10px;">Acceptance Criteria</div>
        <ul style="margin:0;padding-left:18px;color:#475569;">
          ${(item.ac || []).map(a => `<li style="margin:8px 0;">${escapeHtml(a)}</li>`).join("")}
        </ul>
      </div>

      <h2 style="margin:18px 0 10px;">Role Responsibilities (concept)</h2>
      <div class="card" style="padding:12px;">
        <div class="small" style="margin-bottom:8px;"><b>PO:</b> prioritize value; accept scope</div>
        <div class="small" style="margin-bottom:8px;"><b>BA:</b> refine story and AC; clarify edge cases</div>
        <div class="small" style="margin-bottom:8px;"><b>Dev:</b> implementation notes and assumptions</div>
        <div class="small"><b>Tester:</b> test ideas and validations</div>
      </div>

      <div style="display:flex;gap:10px;margin-top:14px;">
        ${prevBtn}
        ${nextBtn}
      </div>

      <div class="safe-area"></div>
    </div>
  `;
}

function screenOutcomeStudent() {
  if (!requireAuthOrRedirect()) return "";
  const scen = getSelectedScenario();
  if (!scen) return screenDashboard();

  const subtitle = `${scen.title} • ${currentRoleLabel()}`;

  const act = state.activity[scen.id] || { backlogTouchedIds: [], chatCount: 0 };
  const touched = act.backlogTouchedIds.length;
  const chats = act.chatCount;

  const reflection = state.reflections[scen.id] || "";

  return `
    ${header({ title: "SprintLab", subtitle, showBack: true, backRoute: "hub" })}
    <div class="screen">
      <h1 style="margin-bottom:6px;">Outcome Summary</h1>
      <p style="margin-bottom:14px;">Review your progress and reflect on the experience</p>

      <h2 style="margin:12px 0 10px;">Timeline</h2>
      <div class="card">
        ${timelineRow("Requirements Gathering", "Dec 5, 2024")}
        ${timelineRow("Backlog Refinement", "Dec 6, 2024")}
        ${timelineRow("Test Planning", "Dec 8, 2024")}
        ${timelineRow("Outcome Review", "Dec 10, 2024")}
      </div>

      <h2 style="margin:18px 0 10px;">Key Highlights</h2>
      <div class="card">
        <div class="small" style="margin-bottom:10px;">✓ Interviewed stakeholders and gathered requirements</div>
        <div class="small" style="margin-bottom:10px;">✓ Stakeholder chats: <b>${escapeHtml(chats)}</b></div>
        <div class="small" style="margin-bottom:10px;">✓ Backlog items opened: <b>${escapeHtml(touched)}</b></div>
        <div class="small">✓ Reviewed role workspace tasks (UI-only)</div>
      </div>

      <h2 style="margin:18px 0 10px;">Reflection</h2>
      <div class="card">
        <div class="small" style="margin-bottom:8px;color:#64748b;">
          Guiding questions: What went well? What would you change? What did you learn about trade-offs?
        </div>
        <textarea id="reflectionInput" rows="5" style="width:100%;padding:12px;border:1px solid #cbd5f5;border-radius:12px;resize:none;"
          placeholder="Type your reflection (student-only, saved locally)">${escapeHtml(reflection)}</textarea>
        <button class="btn btn-primary btn-full" id="btnSaveReflection" style="margin-top:12px;">Save Reflection</button>
        <button class="btn btn-secondary btn-full" id="btnExitToDashboard" style="margin-top:10px;">Exit to Home</button>
      </div>

      <div class="safe-area"></div>
    </div>
  `;
}

function timelineRow(title, date) {
  return `
    <div class="timeline-item" style="margin-bottom:14px;">
      <div class="timeline-dot">${icon("check")}</div>
      <div>
        <div style="font-weight:600;">${escapeHtml(title)}</div>
        <div class="small">${escapeHtml(date)}</div>
      </div>
    </div>
  `;
}

function screenOutcomeProfessor() {
  if (!requireAuthOrRedirect()) return "";
  const scen = getSelectedScenario();
  if (!scen) return screenDashboard();

  const subtitle = `${scen.title} • Professor`;

  const rows = (state.classView[scen.id]?.groups || []).map(g => `
    <tr>
      <td style="padding:10px;border-bottom:1px solid #e5e7eb;">${escapeHtml(g.name)}</td>
      <td style="padding:10px;border-bottom:1px solid #e5e7eb;">${escapeHtml(g.role)}</td>
      <td style="padding:10px;border-bottom:1px solid #e5e7eb;">${escapeHtml(g.status)}</td>
      <td style="padding:10px;border-bottom:1px solid #e5e7eb;">${escapeHtml(g.chats)}</td>
      <td style="padding:10px;border-bottom:1px solid #e5e7eb;">${escapeHtml(g.backlogTouched)}</td>
    </tr>
  `).join("");

  return `
    ${header({ title: "SprintLab", subtitle, showBack: true, backRoute: "hub" })}
    <div class="screen">
      <h1 style="margin-bottom:6px;">Aggregated Outcome</h1>
      <p style="margin-bottom:14px;">Professor view: high-level class progress (UI-only)</p>

      <div class="card">
        <div style="display:flex;gap:10px;flex-wrap:wrap;">
          ${badge("Active: 2", "info")}
          ${badge("Idle: 1", "gray")}
          ${badge("Completed: 1", "success")}
        </div>
      </div>

      <h2 style="margin:18px 0 10px;">Teams / students</h2>
      <div class="card" style="padding:0;overflow:hidden;">
        <table style="width:100%;border-collapse:collapse;font-size:13px;">
          <thead style="background:#f8fafc;">
            <tr>
              <th style="text-align:left;padding:10px;border-bottom:1px solid #e5e7eb;">Team</th>
              <th style="text-align:left;padding:10px;border-bottom:1px solid #e5e7eb;">Role</th>
              <th style="text-align:left;padding:10px;border-bottom:1px solid #e5e7eb;">Status</th>
              <th style="text-align:left;padding:10px;border-bottom:1px solid #e5e7eb;">Chats</th>
              <th style="text-align:left;padding:10px;border-bottom:1px solid #e5e7eb;">Backlog</th>
            </tr>
          </thead>
          <tbody>${rows}</tbody>
        </table>
      </div>

      <div class="info-box" style="margin-top:12px;">
        In MVP, this is a static monitoring view. Future versions can connect real activity.
      </div>

      <button class="btn btn-secondary btn-full" id="btnExitToDashboard" style="margin-top:12px;">Exit to Home</button>

      <div class="safe-area"></div>
    </div>
  `;
}

/* -----------------------------
   5) Router – picks screen based on state.nav.route
-------------------------------- */
function render() {
  const app = document.getElementById("app");
  if (!app) return;

  let html = "";

  switch (state.nav.route) {
    case "login": html = screenLogin(); break;
    case "register": html = screenRegister(); break;
    case "home": html = screenDashboard(); break;
    case "overview": html = screenScenarioOverview(); break;
    case "roles": html = screenRoleDistribution(); break;
    case "hub": html = screenHub(); break;
    case "workspace": html = screenWorkspace(); break;
    case "stakeholders": html = screenStakeholders(); break;
    case "chat": html = screenChat(); break;
    case "backlog": html = screenBacklog(); break;
    case "backlog_detail": html = screenBacklogDetail(); break;
    case "outcome": html = screenOutcomeStudent(); break;
    case "prof_outcome": html = screenOutcomeProfessor(); break;
    default: html = screenLogin(); break;
  }

  app.innerHTML = html;

  // Bind events for the newly rendered DOM
  bindGlobalActions();
  bindRouteActions(state.nav.route);

  // Render icons
  if (window.lucide && typeof window.lucide.createIcons === "function") {
    window.lucide.createIcons();
  }
}

/* -----------------------------
   6) Event Binding
-------------------------------- */
function bindGlobalActions() {
  const logout = document.getElementById("btnLogout");
  if (logout) {
    logout.addEventListener("click", () => {
      state.auth.isLoggedIn = false;
      state.auth.email = "";
      state.user.email = "";
      state.user.type = "student";
      state.user.name = "Student";
      state.user.role = "Student";
      state.user.selectedScenarioId = null;
      state.nav = { route: "login", params: {} };
      saveState();
      render();
    });
  }

  const back = document.getElementById("btnBack");
  if (back) {
    back.addEventListener("click", () => {
      // Prefer explicit backRoute passed to header via params:
      const r = state.nav.params.__backRoute;
      const p = state.nav.params.__backParams || {};
      if (r) setRoute(r, p);
      else window.history.back();
    });
  }

  const renounce = document.getElementById("btnRenounce");
  if (renounce) {
    renounce.addEventListener("click", () => {
      const scen = getSelectedScenario();
      if (!scen) return;

      const role = state.user.role;
      if (!role || role === "Student") return;

      const roles = state.roles[scen.id] || [];
      const entry = roles.find(r => r.name === role);
      // only free it if user owns it
      if (entry && entry.status === "assigned" && entry.person === state.user.name) {
        entry.status = "available";
        entry.person = null;
      }

      state.user.role = "Student";
      saveState();
      setRoute("roles", { selectedRole: null });
    });
  }
}

function bindRouteActions(route) {
  if (route === "login") bindLogin();
  if (route === "register") bindRegister();
  if (route === "home") bindDashboard();
  if (route === "overview") bindOverview();
  if (route === "roles") bindRoles();
  if (route === "hub") bindHub();
  if (route === "workspace") bindWorkspace();
  if (route === "stakeholders") bindStakeholders();
  if (route === "chat") bindChat();
  if (route === "backlog") bindBacklog();
  if (route === "backlog_detail") bindBacklogDetail();
  if (route === "outcome") bindOutcomeStudent();
  if (route === "prof_outcome") bindOutcomeProfessor();
}

/* -----------------------------
   7) Bindings per screen
-------------------------------- */
function bindLogin() {
  const goReg = document.getElementById("goRegister");
  if (goReg) goReg.addEventListener("click", () => setRoute("register"));

  const email = document.getElementById("loginEmail");
  const pass = document.getElementById("loginPassword");
  const btn = document.getElementById("btnLogin");

  if (email) {
    email.addEventListener("input", (e) => {
      state.ui.auth.loginForm.email = e.target.value;
      saveState();
    });
  }
  if (pass) {
    pass.addEventListener("input", (e) => {
      state.ui.auth.loginForm.password = e.target.value;
      saveState();
    });
  }

  if (btn) {
    btn.addEventListener("click", () => {
      const e = (state.ui.auth.loginForm.email || "").trim();
      const p = state.ui.auth.loginForm.password || "";

      const errs = {};
      if (!e) errs.email = "Email is required.";
      else if (!isValidEmail(e)) errs.email = "Enter a valid email format.";
      if (!p) errs.password = "Password is required.";

      if (Object.keys(errs).length) {
        state.ui.auth.loginErrors = errs;
        saveState();
        render();
        return;
      }

      // Validate against stored accounts (MVP)
      const acc = state.auth.accounts.find(a => a.email.toLowerCase() === e.toLowerCase() && a.password === p);
      if (!acc) {
        state.ui.auth.loginErrors = { general: "Invalid email or password." };
        saveState();
        render();
        return;
      }

      state.auth.isLoggedIn = true;
      state.auth.email = acc.email;

      state.user.email = acc.email;
      state.user.name = acc.name;
      state.user.type = acc.type;
      state.user.role = "Student";
      state.user.selectedScenarioId = null;

      state.ui.auth.loginErrors = {};
      saveState();
      setRoute("home");
    });
  }
}

function bindRegister() {
  const goLogin = document.getElementById("goLogin");
  if (goLogin) goLogin.addEventListener("click", () => setRoute("login"));

  const name = document.getElementById("regName");
  const email = document.getElementById("regEmail");
  const pass = document.getElementById("regPassword");
  const btn = document.getElementById("btnRegister");

  if (name) name.addEventListener("input", (e) => { state.ui.auth.registerForm.name = e.target.value; saveState(); });
  if (email) email.addEventListener("input", (e) => { state.ui.auth.registerForm.email = e.target.value; saveState(); });
  if (pass) pass.addEventListener("input", (e) => { state.ui.auth.registerForm.password = e.target.value; saveState(); });

  if (btn) {
    btn.addEventListener("click", () => {
      const f = state.ui.auth.registerForm;
      const n = (f.name || "").trim();
      const e = (f.email || "").trim();
      const p = (f.password || "");

      // Bugs you listed: empty field -> validation message; invalid email -> validation message; duplicate email -> error.
      const errs = {};
      if (!n) errs.name = "Name is required.";
      if (!e) errs.email = "Email is required.";
      else if (!isValidEmail(e)) errs.email = "Enter a valid email format.";
      if (!p) errs.password = "Password is required.";
      else if (p.length < 4) errs.password = "Password must be at least 4 characters.";

      const exists = state.auth.accounts.some(a => a.email.toLowerCase() === e.toLowerCase());
      if (!errs.email && exists) errs.email = "Email already registered.";

      if (Object.keys(errs).length) {
        state.ui.auth.registerErrors = errs;
        saveState();
        render();
        return;
      }

      // Create account (local)
      state.auth.accounts.push({
        name: n,
        email: e,
        password: p,
        type: "student" // MVP default for new registrations
      });

      // Auto-login after register
      state.auth.isLoggedIn = true;
      state.auth.email = e;
      state.user.name = n;
      state.user.email = e;
      state.user.type = "student";
      state.user.role = "Student";
      state.user.selectedScenarioId = null;

      state.ui.auth.registerErrors = {};
      saveState();
      setRoute("home");
    });
  }
}

function bindDashboard() {
  const search = document.getElementById("scenarioSearch");
  if (search) {
    search.addEventListener("input", (e) => {
      state.ui.dashboard.search = e.target.value;
      saveState();
      render();
    });
  }

  // Working filter button (fix your bug report)
  const filter = document.getElementById("btnFilter");
  if (filter) {
    filter.addEventListener("click", () => {
      state.ui.dashboard.filterOpen = !state.ui.dashboard.filterOpen;
      saveState();
      render();
    });
  }

  const close = document.getElementById("closeFilter");
  if (close) {
    close.addEventListener("click", () => {
      state.ui.dashboard.filterOpen = false;
      saveState();
      render();
    });
  }

  document.querySelectorAll("[data-filter-role]").forEach(btn => {
    btn.addEventListener("click", () => {
      state.ui.dashboard.filterRole = btn.getAttribute("data-filter-role");
      saveState();
      render();
    });
  });

  document.querySelectorAll("[data-filter-status]").forEach(btn => {
    btn.addEventListener("click", () => {
      state.ui.dashboard.filterStatus = btn.getAttribute("data-filter-status");
      saveState();
      render();
    });
  });

  document.querySelectorAll("[data-open-scenario]").forEach(btn => {
    btn.addEventListener("click", () => {
      const id = btn.getAttribute("data-open-scenario");
      state.user.selectedScenarioId = id;
      saveState();
      // Go to hub directly (matches your screenshots)
      setRoute("hub");
    });
  });
}

function bindOverview() {
  // Create Active Scenario (professor)
  const btn = document.getElementById("btnCreateActive");
  if (btn) {
    btn.addEventListener("click", () => {
      const scen = getSelectedScenario();
      if (!scen) return;
      state.activeScenario[scen.id] = { isActive: true };
      saveState();
      setRoute("roles");
    });
  }
}

function bindRoles() {
  // Student: click available role
  document.querySelectorAll("[data-pick-role]").forEach(card => {
    card.addEventListener("click", () => {
      const role = card.getAttribute("data-pick-role");
      setRoute("roles", { selectedRole: role });
    });
  });

  const confirm = document.getElementById("btnConfirmRole");
  if (confirm) {
    confirm.addEventListener("click", () => {
      const scen = getSelectedScenario();
      if (!scen) return;

      const selected = state.nav.params.selectedRole;
      if (!selected) return;

      const roles = state.roles[scen.id] || [];
      const entry = roles.find(r => r.name === selected);

      if (!entry || entry.status !== "available") return;

      entry.status = "assigned";
      entry.person = state.user.name;

      state.user.role = selected;
      saveState();
      setRoute("workspace");
    });
  }

  // Professor assign UI-only
  document.querySelectorAll("[data-prof-assign-btn]").forEach(btn => {
    btn.addEventListener("click", () => {
      const role = btn.getAttribute("data-prof-assign-btn");
      const input = document.querySelector(`[data-prof-assign-input="${CSS.escape(role)}"]`);
      const name = (input?.value || "").trim();
      if (!name) return;

      const scen = getSelectedScenario();
      if (!scen) return;

      const roles = state.roles[scen.id] || [];
      const entry = roles.find(r => r.name === role);
      if (!entry) return;

      entry.status = "assigned";
      entry.person = name;

      saveState();
      render();
    });
  });

  const saveBtn = document.getElementById("btnSaveDistribution");
  if (saveBtn) {
    saveBtn.addEventListener("click", () => {
      // UI-only “save” feedback
      state.ui.dashboard.filterOpen = false;
      saveState();
      setRoute("hub");
    });
  }
}

function bindHub() {
  document.querySelectorAll("[data-go]").forEach(card => {
    card.addEventListener("click", () => {
      const r = card.getAttribute("data-go");
      setRoute(r);
    });
  });
}

function bindWorkspace() {
  document.querySelectorAll("[data-go]").forEach(card => {
    card.addEventListener("click", () => {
      const r = card.getAttribute("data-go");
      setRoute(r);
    });
  });

  document.querySelectorAll("[data-task]").forEach(cb => {
    cb.addEventListener("change", () => {
      const scen = getSelectedScenario();
      if (!scen) return;

      const [role, taskId] = cb.getAttribute("data-task").split(":");
      if (!state.workspace[scen.id]) state.workspace[scen.id] = {};
      if (!state.workspace[scen.id][role]) state.workspace[scen.id][role] = { tasksDone: {} };

      state.workspace[scen.id][role].tasksDone[taskId] = cb.checked;
      saveState();
      render();
    });
  });
}

function bindStakeholders() {
  document.querySelectorAll("[data-open-chat]").forEach(btn => {
    btn.addEventListener("click", () => {
      const id = btn.getAttribute("data-open-chat");
      const scen = getSelectedScenario();
      if (!scen) return;

      // mark unread as 0 when opening
      if (state.chats[scen.id]?.[id]) state.chats[scen.id][id].unread = 0;

      saveState();
      setRoute("chat", { stakeholderId: id });
    });
  });
}

function bindChat() {
  const scen = getSelectedScenario();
  if (!scen) return;

  const stakeholderId = state.nav.params.stakeholderId;
  const input = document.getElementById("chatInput");
  const send = document.getElementById("btnSend");
  const msgBox = document.getElementById("chatMessages");

  function scrollToBottom() {
    if (msgBox) msgBox.scrollTop = msgBox.scrollHeight;
  }
  scrollToBottom();

  function pushMessage(from, text) {
    const chatState = state.chats[scen.id][stakeholderId];
    chatState.messages.push({ from, text, ts: nowIso() });
  }

  function scriptedReply(userText) {
    const scripts = DATA.chatScripts[stakeholderId] || [];
    const t = userText.toLowerCase();
    for (const s of scripts) {
      if (!s.match || s.match.length === 0) continue;
      if (s.match.some(k => t.includes(k))) return s.reply;
    }
    // default reply is last entry with empty match or fallback
    const fallback = scripts.find(s => !s.match || s.match.length === 0);
    return fallback ? fallback.reply : "Thanks—could you clarify what you need?";
  }

  if (send) {
    send.addEventListener("click", () => {
      const text = (input?.value || "").trim();
      if (!text) return;

      if (!state.chats[scen.id]) state.chats[scen.id] = {};
      if (!state.chats[scen.id][stakeholderId]) state.chats[scen.id][stakeholderId] = { messages: [], unread: 0 };

      pushMessage("user", text);

      // “AI response” (scripted)
      const reply = scriptedReply(text);
      pushMessage("ai", reply);

      // activity tracking
      const act = state.activity[scen.id] || (state.activity[scen.id] = { backlogTouchedIds: [], chatCount: 0 });
      act.chatCount += 1;

      saveState();
      render();
    });
  }
}

function bindBacklog() {
  const scen = getSelectedScenario();
  if (!scen) return;

  const pri = document.getElementById("filterPriority");
  const st = document.getElementById("filterStatus");
  const rl = document.getElementById("filterRole");

  if (pri) {
    pri.addEventListener("change", () => {
      state.backlogUI[scen.id].filterPriority = pri.value.replace(" Priorities", "");
      saveState();
      render();
    });
  }

  if (st) {
    st.addEventListener("change", () => {
      state.backlogUI[scen.id].filterStatus = st.value;
      saveState();
      render();
    });
  }

  if (rl) {
    rl.addEventListener("change", () => {
      state.backlogUI[scen.id].filterRole = rl.value;
      saveState();
      render();
    });
  }

  document.querySelectorAll("[data-open-item]").forEach(row => {
    row.addEventListener("click", () => {
      const id = Number(row.getAttribute("data-open-item"));
      setRoute("backlog_detail", { itemId: id });
    });
  });
}

function bindBacklogDetail() {
  const scen = getSelectedScenario();
  if (!scen) return;

  const items = DATA.backlog[scen.id] || [];
  const itemId = Number(state.nav.params.itemId);
  const idx = items.findIndex(i => i.id === itemId);

  const prev = document.getElementById("btnPrevItem");
  const next = document.getElementById("btnNextItem");

  if (prev && idx > 0) {
    prev.addEventListener("click", () => setRoute("backlog_detail", { itemId: items[idx - 1].id }));
  }
  if (next && idx < items.length - 1) {
    next.addEventListener("click", () => setRoute("backlog_detail", { itemId: items[idx + 1].id }));
  }
}

function bindOutcomeStudent() {
  const scen = getSelectedScenario();
  if (!scen) return;

  const input = document.getElementById("reflectionInput");
  const saveBtn = document.getElementById("btnSaveReflection");
  const exitBtn = document.getElementById("btnExitToDashboard");

  if (saveBtn) {
    saveBtn.addEventListener("click", () => {
      const text = (input?.value || "");
      state.reflections[scen.id] = text;
      saveState();
      render();
    });
  }

  if (exitBtn) {
    exitBtn.addEventListener("click", () => {
      state.user.selectedScenarioId = null;
      saveState();
      setRoute("home");
    });
  }
}

function bindOutcomeProfessor() {
  const exitBtn = document.getElementById("btnExitToDashboard");
  if (exitBtn) {
    exitBtn.addEventListener("click", () => {
      state.user.selectedScenarioId = null;
      saveState();
      setRoute("home");
    });
  }
}

/* -----------------------------
   8) Header Back Routing Hook
   We store desired back target in nav params via helper.
-------------------------------- */
const _origHeader = header;
header = function (opts = {}) {
  // Inject back route into params so the generic back button knows where to go
  if (opts.showBack && opts.backRoute) {
    state.nav.params.__backRoute = opts.backRoute;
    state.nav.params.__backParams = opts.backParams || {};
  } else {
    // do not clear automatically; harmless if present
  }
  return _origHeader(opts);
};

/* -----------------------------
   9) Initial Route
-------------------------------- */
(function init() {
  // If logged in but no route, go home
  if (state.auth.isLoggedIn) {
    if (!state.nav.route || state.nav.route === "login") state.nav.route = "home";
  } else {
    state.nav.route = "login";
  }
  saveState();
  render();
})();
