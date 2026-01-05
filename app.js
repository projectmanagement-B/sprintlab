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

function setRoute(route, params = {}, options = {}) {
  const { skipHistory = false, replaceHistory = false } = options;
  state.nav.route = route;
  state.nav.params = params;
  if (state.ui) state.ui.profileMenuOpen = false;
  syncAssignedRole();
  saveState();
  if (!skipHistory) {
    const historyState = { route, params };
    if (replaceHistory) {
      window.history.replaceState(historyState, "");
    } else {
      window.history.pushState(historyState, "");
    }
  }
  render();
}

function getSelectedScenario() {
  const id = state.user.selectedScenarioId;
  const scen = getScenarioById(id);
  if (!scen) return null;
  ensureScenarioState(scen.id);
  const displayTitle = getScenarioDisplayTitle(scen);
  if (displayTitle === scen.title) return scen;
  return { ...scen, title: displayTitle };
}

function requireAuthOrRedirect() {
  if (!state.auth.isLoggedIn) {
    setRoute("login");
    return false;
  }
  return true;
}

function currentRoleLabel() {
  if (isProfessor()) return "Professor";
  return state.user.role || "Student";
}

function isProfessor() {
  return state.user.type === "professor";
}

function normalizeKey(value) {
  return String(value || "").trim().toLowerCase();
}

function getAssignedRoleForScenario(scenId) {
  if (!scenId || isProfessor()) return null;
  const roles = state.roles?.[scenId] || [];
  const nameKey = normalizeKey(state.user.name);
  const emailKey = normalizeKey(state.user.email);
  const entry = roles.find(r => {
    const personKey = normalizeKey(r.person);
    if (!personKey) return false;
    return personKey === nameKey || (emailKey && personKey === emailKey);
  });
  return entry ? entry.name : null;
}

function syncAssignedRole() {
  const scenId = state.user.selectedScenarioId;
  if (!scenId) return;
  const assigned = getAssignedRoleForScenario(scenId);
  if (assigned) state.user.role = assigned;
}

function getScenarioDisplayTitle(scen, options = {}) {
  if (!scen) return "";
  const { preferInstance = true } = options;
  if (!preferInstance) return scen.title;
  const instance = state.activeScenario?.[scen.id];
  if (instance && instance.name) return instance.name;
  return scen.title;
}

function applyScenarioOverrides(scen) {
  if (!scen) return scen;
  const instance = state.activeScenario?.[scen.id];
  if (!instance) return scen;
  const merged = { ...scen };
  if (instance.name) merged.title = instance.name;
  if (typeof instance.short === "string") merged.short = instance.short;
  if (typeof instance.overview === "string") merged.overview = instance.overview;
  if (Array.isArray(instance.goals)) merged.goals = instance.goals;
  if (Array.isArray(instance.constraints)) merged.constraints = instance.constraints;
  if (Array.isArray(instance.successCriteria)) merged.successCriteria = instance.successCriteria;
  if (Array.isArray(instance.personas)) merged.personas = instance.personas;
  return merged;
}

function getCustomScenarios() {
  if (!Array.isArray(state.customScenarios)) state.customScenarios = [];
  return state.customScenarios;
}

function getAllScenarios() {
  return DATA.scenarios.concat(getCustomScenarios());
}

function getScenarioById(id) {
  return getAllScenarios().find(s => s.id === id) || null;
}

function isCustomScenario(id) {
  return getCustomScenarios().some(s => s.id === id);
}

function nextScenarioId() {
  if (!state.meta) state.meta = {};
  if (!Number.isFinite(state.meta.scenarioSeq)) state.meta.scenarioSeq = 1;
  const id = `custom-${state.meta.scenarioSeq}`;
  state.meta.scenarioSeq += 1;
  return id;
}

function defaultRoles() {
  return [
    { name: "PO", label: "Product Owner", status: "available", person: null },
    { name: "BA", label: "Business Analyst", status: "available", person: null },
    { name: "Dev", label: "Developer", status: "available", person: null },
    { name: "Tester", label: "Tester", status: "available", person: null }
  ];
}

function ensureScenarioState(scenId) {
  if (!scenId) return;
  if (!state.roles) state.roles = {};
  if (!state.workspace) state.workspace = {};
  if (!state.chats) state.chats = {};
  if (!state.backlogUI) state.backlogUI = {};
  if (!state.activity) state.activity = {};
  if (!state.reflections) state.reflections = {};
  if (!state.classView) state.classView = {};

  if (!state.roles[scenId]) state.roles[scenId] = defaultRoles();
  if (!state.workspace[scenId]) state.workspace[scenId] = {};
  if (!state.chats[scenId]) {
    state.chats[scenId] = {
      customer: { messages: [], unread: 0 },
      warehouse: { messages: [], unread: 0 },
      manager: { messages: [], unread: 0 }
    };
  }
  if (!state.backlogUI[scenId]) {
    state.backlogUI[scenId] = { filterPriority: "All", filterStatus: "All", filterRole: "All" };
  }
  if (!state.activity[scenId]) {
    state.activity[scenId] = { backlogTouchedIds: [], chatCount: 0 };
  }
  if (typeof state.reflections[scenId] !== "string") state.reflections[scenId] = "";
  if (!state.classView[scenId]) state.classView[scenId] = { groups: [] };
}

function deleteScenario(id) {
  if (!id) return false;
  const custom = getCustomScenarios();
  const idx = custom.findIndex(s => s.id === id);
  if (idx === -1) return false;

  custom.splice(idx, 1);
  if (state.activeScenario) delete state.activeScenario[id];
  if (state.roles) delete state.roles[id];
  if (state.workspace) delete state.workspace[id];
  if (state.chats) delete state.chats[id];
  if (state.backlogUI) delete state.backlogUI[id];
  if (state.activity) delete state.activity[id];
  if (state.reflections) delete state.reflections[id];
  if (state.classView) delete state.classView[id];
  if (state.user.selectedScenarioId === id) state.user.selectedScenarioId = null;
  if (state.ui?.createScenario?.form?.scenarioId === id) state.ui.createScenario.form = {};

  return true;
}

function defaultPersonas() {
  return [
    {
      id: "customer",
      name: "Customer",
      subtitle: "Primary user",
      bio: "Shares needs, constraints, and success criteria.",
      goals: [],
      painPoints: [],
      needs: []
    },
    {
      id: "warehouse",
      name: "Operations",
      subtitle: "Process owner",
      bio: "Explains workflow steps and operational pain points.",
      goals: [],
      painPoints: [],
      needs: []
    },
    {
      id: "manager",
      name: "Manager",
      subtitle: "Decision maker",
      bio: "Sets priorities, risks, and outcomes.",
      goals: [],
      painPoints: [],
      needs: []
    }
  ];
}

function createCustomScenarioDraft() {
  const id = nextScenarioId();
  const scenario = {
    id,
    title: "New Scenario",
    short: "Custom scenario created by professor.",
    status: "Not active",
    active: false,
    overview: "",
    goals: [],
    constraints: [],
    personas: defaultPersonas(),
    successCriteria: []
  };
  getCustomScenarios().push(scenario);
  ensureScenarioState(id);
  return scenario;
}

function listToMultiline(items) {
  return Array.isArray(items) ? items.join("\n") : "";
}

function parseLines(text) {
  return String(text || "")
    .split("\n")
    .map(line => line.trim())
    .filter(Boolean);
}

function personasToText(personas) {
  if (!Array.isArray(personas)) return "";
  return personas
    .map(p => `${p.name || ""} | ${p.subtitle || ""} | ${p.bio || ""}`.trim())
    .join("\n");
}

function parsePersonas(text) {
  const lines = parseLines(text);
  if (!lines.length) return null;
  return lines.map((line, idx) => {
    const parts = line.split("|").map(part => part.trim()).filter(Boolean);
    const name = parts[0] || `Persona ${idx + 1}`;
    const subtitle = parts[1] || "Stakeholder";
    const bio = parts.slice(2).join(" | ") || "Provides context and feedback.";
    return {
      id: `persona-${idx + 1}`,
      name,
      subtitle,
      bio
    };
  });
}

function migrateScenarioNames() {
  const from = "Test Scenario A";
  const fromLegacy = "Returns Management App";
  const to = "Scenario 01 – Returns Management App";
  let changed = false;

  if (state.activeScenario) {
    Object.keys(state.activeScenario).forEach((id) => {
      const entry = state.activeScenario[id];
      if (entry && (entry.name === from || entry.name === fromLegacy)) {
        entry.name = to;
        changed = true;
      }
    });
  }

  getCustomScenarios().forEach((scen) => {
    if (scen.title === from || scen.title === fromLegacy) {
      scen.title = to;
      changed = true;
    }
  });

  return changed;
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
          id: "alex",
          name: "Alex",
          subtitle: "Business stakeholder / customer",
          bio: "Outcome-focused and slightly impatient; cares about value, priority, and delivery confidence.",
          goals: [
            "Maximize business value with minimal risk",
            "Prioritize MVP trade-offs for fast delivery",
            "Ensure the feature feels like a real learning simulation"
          ],
          painPoints: [
            "Overengineering before validation",
            "Unclear trade-offs or scope creep",
            "Slow delivery with low confidence"
          ],
          needs: [
            "Clear MVP scope and priorities",
            "Simple, realistic scripted dialogue",
            "Confidence the feature delivers learning value"
          ]
        },
        {
          id: "customer",
          name: "Customer",
          subtitle: "End-user requesting returns.",
          bio: "Wants a simple, fast return experience with clear updates.",
          goals: [
            "Start a return in under 2 minutes",
            "Get a label immediately after submission",
            "See clear status updates without contacting support"
          ],
          painPoints: [
            "Unclear eligibility rules",
            "Delayed or missing refund updates",
            "Too many steps or forms"
          ],
          needs: [
            "Eligibility rules visible upfront",
            "Simple reason selection and optional comments",
            "Transparent refund timing"
          ]
        },
        {
          id: "warehouse",
          name: "Warehouse Operator",
          subtitle: "Physical inspection & processing.",
          bio: "Inspects returns and processes approvals or rejections.",
          goals: [
            "Scan and find return requests quickly",
            "Record inspection outcomes with minimal clicks",
            "Keep workflow consistent across shifts"
          ],
          painPoints: [
            "Missing or invalid barcodes",
            "Unclear inspection criteria",
            "Manual status updates"
          ],
          needs: [
            "Fast lookup by barcode",
            "Simple approve/reject reasons",
            "Clear status transitions"
          ]
        },
        {
          id: "manager",
          name: "Returns Manager",
          subtitle: "Process oversight & exceptions.",
          bio: "Oversees return workflows and resolves exceptions.",
          goals: [
            "Reduce cycle time and manual effort",
            "Improve status visibility for customers",
            "Keep policies consistent across teams"
          ],
          painPoints: [
            "Inconsistent status updates",
            "Ambiguous policy interpretation",
            "High support volume from returns"
          ],
          needs: [
            "Clear policy messaging in UI",
            "Basic reporting on return reasons",
            "Simple exception handling"
          ]
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
        id: "US-01",
        title: "Customer submits return request with photo",
        roles: ["PO", "BA", "Dev", "Tester"],
        priority: "High",
        status: "To Do",
        story:
          "As a Customer, I want to upload a photo of the damaged item so that my return is approved faster.",
        ac: [
          "Photo upload is available in the return request form",
          "Accepted formats are JPG and PNG",
          "Photo is optional but recommended",
          "User sees a confirmation after upload"
        ]
      },
      {
        id: "US-02",
        title: "Warehouse operator scans package barcode",
        roles: ["BA", "Dev", "Tester"],
        priority: "Medium",
        status: "In Progress",
        story:
          "As a Warehouse Op, I want to scan a barcode on the package so I can look up the order instantly.",
        ac: [
          "Scanner input captures barcode value",
          "System finds the matching return request",
          "If barcode is invalid, show a clear error",
          "Lookup results show order summary"
        ]
      },
      {
        id: "US-03",
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
        id: "US-04",
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
        id: "US-05",
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
        id: "US-06",
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
        id: "US-07",
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
        id: "US-08",
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
    alex: {
      PO: {
        sequence: [
          "Sure. I just want to understand how this actually helps the user. What value does this deliver?",
          "Okay, but what problem are we really solving here?",
          "How does this align with your sprint goal?",
          "What is the MVP version of this? I do not want overengineering.",
          "What trade-offs are you making?",
          "Why should this be prioritized now?",
          "Fair enough. What outcome should the learner achieve?"
        ],
        fallback: "Keep it focused on value, scope, and outcomes."
      },
      Dev: {
        sequence: [
          "Sure. Are the requirements clear enough for you?",
          "Yes. Start with simple scripted responses. No automation yet.",
          "We need this fast and stable. No backend dependencies for now.",
          "Absolutely. Static scripts per persona are enough.",
          "That learners will engage meaningfully even with limited responses.",
          "Then we learn and improve it later. This is not production AI.",
          "Only on finalized persona content from BA."
        ],
        fallback: "Keep it simple, stable, and shippable."
      },
      Tester: {
        sequence: [
          "Sure. What are the acceptance criteria for this?",
          "Have you considered edge cases?",
          "How will this be tested?",
          "Are error states defined?",
          "Is behavior consistent across screens?",
          "What is expected for invalid input?",
          "Do you have test coverage for this flow?"
        ],
        fallback: "Focus on stability, edge cases, and clear criteria."
      }
    },
    customer: [
      {
        match: ["hi", "hello", "hey", "good morning", "good afternoon", "good evening"],
        topic: "greeting",
        reply:
          "Hi! I can share how I want returns to work. Ask me about deadlines, labels, status updates, or photos."
      },
      {
        match: ["return window", "eligible", "eligibility", "30", "deadline", "timeframe", "policy", "days"],
        topic: "eligibility",
        reply:
          "I expect to return items within 30 days of purchase. If it's outside that, the app should clearly tell me I can't return it."
      },
      {
        match: ["label", "shipping", "print", "printer", "qr", "drop off", "dropoff", "carrier"],
        topic: "label",
        reply:
          "I want a shipping label right after I submit the return—ideally downloadable. If something fails, I need clear instructions."
      },
      {
        match: ["status", "track", "tracking", "where", "update", "progress"],
        topic: "status",
        reply:
          "I want to see the status in my account: Requested → Shipped → Received → Approved → Refunded. I also want to know what to do next."
      },
      {
        match: ["refund", "money", "reimburse", "payment", "credit", "timeline", "how long"],
        topic: "refund",
        reply:
          "Refund time should be transparent. If it takes 5–7 days, the app should show that and confirm when the refund is initiated."
      },
      {
        match: ["reason", "dropdown", "defective", "wrong size", "changed mind", "comment", "notes"],
        topic: "reasons",
        reply:
          "Give me simple reasons like 'Defective', 'Wrong size', 'Changed mind', and a comments box. Keep it fast."
      },
      {
        match: ["photo", "image", "picture", "damage", "damaged"],
        topic: "photo",
        reply:
          "If I can upload a photo of the damage, that should speed up approval. It should be optional but easy to add."
      },
      {
        match: ["account", "history", "order"],
        topic: "order",
        reply:
          "I want to start the return from my order history so I don't have to re-enter details."
      },
      {
        match: [],
        reply:
          "My main priorities are: simple flow, clear eligibility, easy label download, and transparent status/refund updates."
      }
    ],

    warehouse: [
      {
        match: ["hi", "hello", "hey", "good morning", "good afternoon", "good evening"],
        topic: "greeting",
        reply:
          "Hello. I can explain our receiving and inspection flow. Ask about scanning, inspection, or exceptions."
      },
      {
        match: ["received", "receive", "arrival", "dock", "check in"],
        topic: "receive",
        reply:
          "We need an easy way to mark a return as Received, and we should scan/enter a tracking code to link it to the request."
      },
      {
        match: ["inspection", "verify", "damage", "condition", "approve", "reject"],
        topic: "inspection",
        reply:
          "After receiving, we must inspect: approved vs rejected, plus reason. That decision should update the customer status."
      },
      {
        match: ["inventory", "stock", "restock", "resell"],
        topic: "inventory",
        reply:
          "If the item is approved and resellable, inventory should be updated. For MVP, a placeholder note is fine."
      },
      {
        match: ["exceptions", "damaged", "missing", "wrong item"],
        topic: "exceptions",
        reply:
          "Rejected returns should include a reason and optionally photos (future). For MVP, reason text is enough."
      },
      {
        match: ["barcode", "scan", "scanner", "label"],
        topic: "barcode",
        reply:
          "Barcode scanning should pull up the exact return request immediately, otherwise processing slows down."
      },
      {
        match: [],
        reply:
          "Our workflow is: Receive → Inspect → Mark outcome → Update status. It must be quick and consistent."
      }
    ],

    manager: [
      {
        match: ["hi", "hello", "hey", "good morning", "good afternoon", "good evening"],
        topic: "greeting",
        reply:
          "Hi. I can outline priorities, risks, and success metrics. Ask about scope or policy."
      },
      {
        match: ["success", "criteria", "kpi", "metric"],
        topic: "metrics",
        reply:
          "Success means fewer manual steps, faster cycle time, and fewer customer complaints. Status visibility is key."
      },
      {
        match: ["scope", "mvp", "capacity", "trade-off", "tradeoff", "prioritize"],
        topic: "scope",
        reply:
          "Keep MVP focused on the happy path: submit return, label, tracking statuses, warehouse verify, refund placeholder."
      },
      {
        match: ["risk", "failure", "edge case", "exceptions"],
        topic: "risks",
        reply:
          "Risks include unclear eligibility rules and inconsistent status updates. Ensure the UI explains rules at each step."
      },
      {
        match: ["analytics", "dashboard", "report", "insights"],
        topic: "analytics",
        reply:
          "Analytics is nice-to-have. Prioritize core flow first, then add a basic view of reasons/volume as a placeholder."
      },
      {
        match: ["refund", "policy", "timeline"],
        topic: "refund",
        reply:
          "Refund policy should be explicit so support and customers are aligned on timing and expectations."
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
      profileMenuOpen: false,
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
      },
      createScenario: {
        form: {
          name: "",
          cohort: "",
          startDate: "",
          endDate: "",
          notes: "",
          short: "",
          overview: "",
          goals: "",
          constraints: "",
          successCriteria: "",
          personas: "",
          status: "In progress"
        },
        errors: {}
      },
      roleAssign: {
        assignErrors: {},
        selfAssignError: ""
      },
      outcomeFilters: {
        role: "All",
        status: "All"
      }
    },
    meta: {
      scenarioSeq: 1
    },
    customScenarios: [],
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
        alex: { messages: [], unread: 0 },
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

const RESET_STATE_ON_LOAD = false;

function applyAppScale() {
  const w = window.innerWidth;
  const h = window.innerHeight;
  const scale = Math.min((w * 0.96) / 390, (h * 0.96) / 844, 1);
  document.documentElement.style.setProperty("--scale", scale.toFixed(4));
}

/* -----------------------------
   3) Header Builder 
-------------------------------- */
function header({ title = "SprintLab", subtitle = "", showBack = false, backRoute = null, backParams = {} } = {}) {
  const role = currentRoleLabel();
  const selected = getSelectedScenario();
  const showRolePill = state.auth.isLoggedIn && state.user.selectedScenarioId && selected && selected.active;

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
    ? `<button class="btn btn-ghost" id="btnBack" style="padding:8px;border-radius:10px;display:flex;align-items:center;gap:6px;">
         ${icon("arrow-left")}
       </button>`
    : "";

  const profileBtn = state.auth.isLoggedIn
    ? `<button class="btn btn-secondary" id="btnProfile" style="padding:8px 10px;border-radius:999px;display:flex;align-items:center;gap:6px;">
         ${icon("user")}
       </button>`
    : "";

  const profileMenu = state.auth.isLoggedIn && state.ui.profileMenuOpen
    ? `
      <div id="profileMenu" class="card" style="position:absolute;top:44px;right:0;z-index:20;padding:8px;min-width:170px;">
        <button class="btn btn-ghost btn-full" id="btnProfileDashboard" style="text-align:left;padding:10px 12px;">
          ${icon("layout-dashboard")} <span style="margin-left:8px;">ScenarioHub</span>
        </button>
        <button class="btn btn-ghost btn-full" id="btnProfileScenarios" style="text-align:left;padding:10px 12px;">
          ${icon("list")} <span style="margin-left:8px;">Available Scenarios</span>
        </button>
        <button class="btn btn-ghost btn-full" id="btnProfileReset" style="text-align:left;padding:10px 12px;">
          ${icon("refresh-ccw")} <span style="margin-left:8px;">Reset App</span>
        </button>
        <button class="btn btn-ghost btn-full" id="btnProfileLogout" style="text-align:left;padding:10px 12px;">
          ${icon("log-out")} <span style="margin-left:8px;">Log out</span>
        </button>
      </div>
    `
    : "";

  const profileWrap = state.auth.isLoggedIn
    ? `<div style="position:relative;">${profileBtn}${profileMenu}</div>`
    : "";

  const logoutBtn = "";

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
        ${profileWrap}
        ${logoutBtn}
      </div>
    </div>
  `;
}

/* -----------------------------
   4) Screens – Render Functions
-------------------------------- */
function screenLanding() {
  return `
    <div class="landing">
      <div class="landing-topbar">
        <div class="landing-brand">
          <div class="landing-mark">SL</div>
          <div class="landing-name">SprintLab</div>
        </div>
      </div>

      <div class="landing-hero">
        <div class="landing-pill">AI-Powered Product Team Simulator</div>
        <h1>SprintLab – AI-Powered Product Team Simulator</h1>
        <p class="landing-subhead">
          Bridge the gap between theory and practice. Experience role-based, scenario-driven project management with AI simulated stakeholders.
        </p>
        <button class="btn btn-primary landing-cta" id="btnStartLearning">
          Start Learning <span aria-hidden="true">→</span>
        </button>
      </div>

      <div class="landing-feature-row">
        <div class="landing-feature">
          <div class="landing-feature-title">Simulated Stakeholders</div>
          <div class="landing-feature-desc">Practice requirements gathering with AI customers who push back and change their minds.</div>
        </div>
        <div class="landing-feature">
          <div class="landing-feature-title">Role-Based Learning</div>
          <div class="landing-feature-desc">Distinct workspaces for PO, BA, Dev, and Tester.</div>
        </div>
        <div class="landing-feature">
          <div class="landing-feature-title">Safe Failure</div>
          <div class="landing-feature-desc">Experiment with trade-offs in a risk-free environment.</div>
        </div>
      </div>
    </div>
  `;
}

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

  let list = getAllScenarios().map((s, idx) => {
    const activeConfig = state.activeScenario ? state.activeScenario[s.id] : null;
    const isCustom = isCustomScenario(s.id);
    const baseStatus = s.status || "Not active";
    const status = activeConfig && activeConfig.status ? activeConfig.status : baseStatus;
    const isActive = activeConfig ? !!activeConfig.isActive : status === "In progress";
    const displayTitle = getScenarioDisplayTitle(s);
    const assignedRole = isActive ? getAssignedRoleForScenario(s.id) : null;
    const userRoleTag = isActive
      ? (assignedRole || (state.user.selectedScenarioId === s.id ? currentRoleLabel() : "Unassigned"))
      : "Unassigned";

    return {
      ...s,
      title: displayTitle,
      userRoleTag,
      active: isActive,
      status,
      __index: idx,
      __isCustom: isCustom,
      __isActive: isActive
    };
  });

  list.sort((a, b) => {
    const group = (item) => {
      if (item.status === "In progress") return 0;
      if (item.status === "Coming soon") return 1;
      return 2;
    };
    const ga = group(a);
    const gb = group(b);
    if (ga !== gb) return ga - gb;
    return a.__index - b.__index;
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
            ${["All", "In progress", "Not active", "Coming soon"].map(st => `
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
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px;gap:10px;">
        <h1 style="margin:0;">Available Scenarios</h1>
        <button class="btn btn-secondary" id="btnTemplates" style="padding:10px 12px;border-radius:12px;">
          Templates
        </button>
      </div>

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

      ${isProfessor() ? `
        <button class="btn btn-secondary btn-full" id="btnCreateScenario" style="margin-top:14px;">
          Create new scenario
        </button>
      ` : ""}

      <div class="safe-area"></div>
    </div>
  `;
}

function scenarioCard(s) {
  const isInactive = s.status !== "In progress";
  const isLocked = isInactive && !isProfessor();
  const disabled = isLocked;
  const roleTag = s.userRoleTag;
  const openBtnClass = isInactive ? "btn-secondary" : "btn-primary";
  const canDelete = isProfessor() && isCustomScenario(s.id);

  const statusBadge =
    s.status === "In progress"
      ? badge("In progress", "warning")
      : s.status === "Not active"
      ? badge("Not active", "gray")
      : badge("Coming soon", "gray");

  const openBtn = disabled
    ? `<button class="btn btn-secondary" disabled style="opacity:0.55;">Locked</button>`
    : `<button class="btn ${openBtnClass}" data-open-scenario="${escapeHtml(s.id)}" style="padding:10px 12px;border-radius:12px;">Open</button>`;

  const editBtn = isProfessor()
    ? `<button class="btn btn-secondary" data-edit-scenario="${escapeHtml(s.id)}" style="padding:10px 12px;border-radius:12px;">Edit</button>`
    : "";

  const deleteBtn = canDelete
    ? `<button class="btn btn-danger" data-delete-scenario="${escapeHtml(s.id)}" style="padding:10px 12px;border-radius:12px;">Delete</button>`
    : "";

  const actions = isProfessor()
    ? `<div style="display:flex;gap:8px;align-items:center;">${openBtn}${editBtn}${deleteBtn}</div>`
    : openBtn;

  const lockIcon = isLocked ? `<div style="color:#94a3b8;">${icon("lock")}</div>` : "";

  return `
    <div class="card" style="${isInactive ? "opacity:0.5;" : ""}">
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

      <div style="display:flex;justify-content:space-between;align-items:center;margin-top:14px;gap:10px;">
        <div class="small">Role: ${escapeHtml(roleTag)}</div>
        ${actions}
      </div>
    </div>
  `;
}

function screenTemplates() {
  if (!requireAuthOrRedirect()) return "";

  const list = DATA.scenarios.map(s => s);

  return `
    ${header({ title: "SprintLab", subtitle: "Scenario templates", showBack: true, backRoute: "home" })}
    <div class="screen">
      <h1 style="margin-bottom:6px;">Scenario Templates</h1>
      <p style="margin-bottom:14px;">Browse predefined scenarios for class exercises.</p>

      <div class="card" style="padding:12px;margin-bottom:12px;">
        <div class="small" style="margin-bottom:8px;">Filters (static in MVP)</div>
        <div style="display:flex;gap:10px;flex-wrap:wrap;">
          ${["All", "Intro", "Intermediate", "Advanced"].map(level => `
            <button class="btn btn-secondary"
                    style="padding:8px 10px;border-radius:999px;font-size:12px;">
              ${escapeHtml(level)}
            </button>
          `).join("")}
        </div>
      </div>

      <div style="display:grid;gap:12px;">
        ${list.map(s => templateCard(s)).join("")}
      </div>

      <div class="safe-area"></div>
    </div>
  `;
}

function templateCard(s) {
  const statusBadge =
    s.status === "In progress"
      ? badge("Active", "success")
      : badge("Template", "gray");

  const difficulty = s.id === "scenario01" ? "Intro" : "TBD";

  return `
    <div class="card">
      <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:10px;">
        <div>
          <h2 style="font-size:16px;margin-bottom:6px;">${escapeHtml(s.title)}</h2>
          <p>${escapeHtml(s.short || "A ready-to-use project scenario.")}</p>
          <div class="small" style="margin-top:8px;">Difficulty: ${escapeHtml(difficulty)}</div>
        </div>
        <div>${statusBadge}</div>
      </div>

      <div style="display:flex;justify-content:flex-end;margin-top:12px;">
        <button class="btn btn-primary"
                data-view-template="${escapeHtml(s.id)}"
                style="padding:10px 12px;border-radius:12px;">
          View overview
        </button>
      </div>
    </div>
  `;
}

function screenScenarioOverview() {
  if (!requireAuthOrRedirect()) return "";

  const scenId = state.nav.params.templateId || state.user.selectedScenarioId;
  const scen = getScenarioById(scenId);
  if (!scen) return screenDashboard();

  const isTemplateView = !!state.nav.params.templateId;
  const resolvedScenario = isTemplateView ? scen : applyScenarioOverrides(scen);
  const displayTitle = getScenarioDisplayTitle(resolvedScenario, { preferInstance: !isTemplateView });
  const subtitle = displayTitle;
  const backRoute = state.nav.params.from === "templates" ? "templates" : "home";
  const isActiveInstance = !!state.activeScenario[scen.id]?.isActive;
  const canActivate = scen.active || isCustomScenario(scen.id);

  const personaCards = (resolvedScenario.personas || []).map(p => `
    <div class="card" style="padding:12px;">
      <div style="font-weight:600;margin-bottom:4px;">${escapeHtml(p.name)}</div>
      <div class="small" style="margin-bottom:8px;">${escapeHtml(p.subtitle)}</div>
      <p>${escapeHtml(p.bio)}</p>
    </div>
  `).join("");

  const createBtn = isProfessor() && canActivate
    ? `<button class="btn btn-primary" id="btnCreateActive" style="margin-top:12px;">
         ${isActiveInstance ? "Edit active scenario" : "Create active scenario"}
       </button>`
    : "";

  const continueBtn = canActivate && isActiveInstance
    ? `<button class="btn btn-primary" id="btnContinueRoles">Continue to role selection</button>`
    : "";

  return `
    ${header({ title: "SprintLab", subtitle, showBack: true, backRoute })}
    <div class="screen">
      <h1 style="margin-bottom:6px;">${escapeHtml(displayTitle)}</h1>
      <p style="margin-bottom:14px;">${escapeHtml(resolvedScenario.short || "Scenario overview")}</p>

      <h2 style="margin:14px 0 8px;">Overview</h2>
      ${resolvedScenario.overview
        ? `<p>${escapeHtml(resolvedScenario.overview)}</p>`
        : `<div class="info-box">Detailed overview coming soon for this scenario.</div>`
      }

      <h2 style="margin:18px 0 8px;">Goals</h2>
      <div class="card" style="padding:12px;">
        <ul style="margin:0;padding-left:18px;color:#475569;">
          ${(resolvedScenario.goals || []).map(g => `<li style="margin:8px 0;">${escapeHtml(g)}</li>`).join("")}
        </ul>
      </div>

      <h2 style="margin:18px 0 8px;">Constraints</h2>
      <div class="card" style="padding:12px;">
        <ul style="margin:0;padding-left:18px;color:#475569;">
          ${(resolvedScenario.constraints || []).map(c => `<li style="margin:8px 0;">${escapeHtml(c)}</li>`).join("")}
        </ul>
      </div>

      <h2 style="margin:18px 0 8px;">Personas</h2>
      <div style="display:grid;gap:12px;">${personaCards}</div>

      <h2 style="margin:18px 0 8px;">Success criteria</h2>
      <div class="card" style="padding:12px;">
        <ul style="margin:0;padding-left:18px;color:#475569;">
          ${(resolvedScenario.successCriteria || []).map(sc => `<li style="margin:8px 0;">${escapeHtml(sc)}</li>`).join("")}
        </ul>
      </div>

      <div style="display:flex;gap:10px;flex-wrap:wrap;margin-top:12px;">
        <button class="btn btn-secondary" id="btnBackToScenarios" data-back-route="${escapeHtml(backRoute)}">
          Back to scenarios
        </button>
        ${continueBtn}
      </div>

      ${createBtn}

      <div class="safe-area"></div>
    </div>
  `;
}

function screenCreateScenario() {
  if (!requireAuthOrRedirect()) return "";
  if (!isProfessor()) return screenScenarioOverview();

  const scen = getSelectedScenario();
  if (!scen) return screenDashboard();

  const baseScenario = getScenarioById(scen.id) || scen;
  const subtitle = getScenarioDisplayTitle(baseScenario);
  const form = state.ui.createScenario.form || {};
  const errs = state.ui.createScenario.errors || {};
  const existing = state.activeScenario?.[scen.id] || {};
  const nameValue = form.name ?? existing.name ?? baseScenario.title;
  const shortValue = form.short ?? existing.short ?? baseScenario.short ?? "";
  const overviewValue = form.overview ?? existing.overview ?? baseScenario.overview ?? "";
  const goalsValue = form.goals ?? listToMultiline(existing.goals ?? baseScenario.goals);
  const constraintsValue = form.constraints ?? listToMultiline(existing.constraints ?? baseScenario.constraints);
  const successValue = form.successCriteria ?? listToMultiline(existing.successCriteria ?? baseScenario.successCriteria);
  const personasValue = form.personas ?? personasToText(existing.personas ?? baseScenario.personas);
  const statusValue = form.status ?? existing.status ?? baseScenario.status ?? (existing.isActive ? "In progress" : "Not active");
  const statusOptions = ["In progress", "Not active", "Coming soon"];

  return `
    ${header({ title: "SprintLab", subtitle, showBack: true, backRoute: "overview" })}
    <div class="screen">
      <h1 style="margin-bottom:6px;">Create class exercise</h1>
      <p style="margin-bottom:14px;">Set up an active scenario before assigning roles.</p>

      <div class="input-group">
        <label>Exercise name</label>
        <input id="csName" type="text" placeholder="Scenario 01 – Returns Management App"
               value="${escapeHtml(nameValue)}" />
        ${errs.name ? `<div class="input-error">${escapeHtml(errs.name)}</div>` : ""}
      </div>

      <div class="input-group">
        <label>Short description (optional)</label>
        <input id="csShort" type="text" placeholder="Brief summary shown on the dashboard"
               value="${escapeHtml(shortValue)}" />
      </div>

      <div class="input-group">
        <label>Overview (optional)</label>
        <textarea id="csOverview" rows="4" style="width:100%;padding:12px;border:1px solid #cbd5f5;border-radius:10px;resize:none;"
          placeholder="High-level scenario context...">${escapeHtml(overviewValue)}</textarea>
      </div>

      <div class="input-group">
        <label>Goals (optional, one per line)</label>
        <textarea id="csGoals" rows="4" style="width:100%;padding:12px;border:1px solid #cbd5f5;border-radius:10px;resize:none;"
          placeholder="List the scenario goals...">${escapeHtml(goalsValue)}</textarea>
      </div>

      <div class="input-group">
        <label>Constraints (optional, one per line)</label>
        <textarea id="csConstraints" rows="4" style="width:100%;padding:12px;border:1px solid #cbd5f5;border-radius:10px;resize:none;"
          placeholder="List constraints or assumptions...">${escapeHtml(constraintsValue)}</textarea>
      </div>

      <div class="input-group">
        <label>Personas (optional, one per line)</label>
        <textarea id="csPersonas" rows="4" style="width:100%;padding:12px;border:1px solid #cbd5f5;border-radius:10px;resize:none;"
          placeholder="Name | Subtitle | Bio">${escapeHtml(personasValue)}</textarea>
      </div>

      <div class="input-group">
        <label>Success criteria (optional, one per line)</label>
        <textarea id="csSuccess" rows="4" style="width:100%;padding:12px;border:1px solid #cbd5f5;border-radius:10px;resize:none;"
          placeholder="List success criteria...">${escapeHtml(successValue)}</textarea>
      </div>

      <div class="input-group">
        <label>Cohort / class</label>
        <input id="csCohort" type="text" placeholder="PM Bootcamp – Group A"
               value="${escapeHtml(form.cohort ?? existing.cohort ?? "")}" />
      </div>

      <div class="input-group">
        <label>Start date</label>
        <input id="csStart" type="date" value="${escapeHtml(form.startDate ?? existing.startDate ?? "")}" />
        ${errs.startDate ? `<div class="input-error">${escapeHtml(errs.startDate)}</div>` : ""}
      </div>

      <div class="input-group">
        <label>End date (optional)</label>
        <input id="csEnd" type="date" value="${escapeHtml(form.endDate ?? existing.endDate ?? "")}" />
      </div>

      <div class="input-group">
        <label>Notes (optional)</label>
        <textarea id="csNotes" rows="3" style="width:100%;padding:12px;border:1px solid #cbd5f5;border-radius:10px;resize:none;"
          placeholder="Instructions for students...">${escapeHtml(form.notes ?? existing.notes ?? "")}</textarea>
      </div>

      <div class="card" style="padding:12px;margin-bottom:12px;">
        <div style="font-weight:600;margin-bottom:8px;">Scenario status</div>
        <div style="display:flex;gap:10px;flex-wrap:wrap;">
          ${statusOptions.map(status => `
            <button class="btn ${statusValue === status ? "btn-primary" : "btn-secondary"}" data-status-option="${escapeHtml(status)}" type="button"
                    style="padding:8px 12px;border-radius:999px;font-size:12px;">
              ${escapeHtml(status)}
            </button>
          `).join("")}
        </div>
      </div>

      <button class="btn btn-primary btn-full" id="btnSaveScenario">Save and assign roles</button>

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
  const ui = state.ui.roleAssign || { assignErrors: {}, selfAssignError: "" };

  const hint = `
    <div class="info-box" style="margin-top:12px;">
      Tip: Click on an available role to select it for yourself.
    </div>
  `;

  const rows = roles.map(r => {
    const assigned = r.status === "assigned";
    const statusChip = assigned ? badge("Assigned", "success") : badge("Available", "gray");
    const personLine = assigned ? escapeHtml(r.person || "Assigned") : "No student assigned";
    const roleDesc = roleDescription(r.name);
    const assignError = ui.assignErrors?.[r.name];

    // Student self-select: only if available and professor didn't lock it
    const clickable = !isProfessor() && r.status === "available";
    const cardAttrs = clickable ? `data-pick-role="${escapeHtml(r.name)}"` : "";
    const extraStyle = clickable ? "cursor:pointer;" : "opacity:1;";

    // Professor assign control (UI-only)
    const clearBtn = isProfessor() && assigned
      ? `
        <button class="btn btn-ghost renounce-btn"
                data-prof-unassign-btn="${escapeHtml(r.name)}"
                title="Unassign role"
                aria-label="Unassign role">
          ${icon("x")}
        </button>
      `
      : "";

    const profAssign = isProfessor()
      ? `
        <div style="margin-top:10px;display:flex;gap:10px;align-items:center;">
          <input type="text" placeholder="Student name"
                 data-prof-assign-input="${escapeHtml(r.name)}"
                 style="flex:1;padding:10px;border:1px solid #cbd5f5;border-radius:10px;" />
          <button class="btn btn-secondary" data-prof-assign-btn="${escapeHtml(r.name)}" style="padding:10px 12px;border-radius:12px;">
            Assign
          </button>
          ${clearBtn}
        </div>
        ${assignError ? `<div class="input-error" style="margin-top:6px;">${escapeHtml(assignError)}</div>` : ""}
      `
      : "";

    return `
      <div class="card" ${cardAttrs} style="${extraStyle}">
        <div class="role-row">
          <div>
            <div style="font-weight:600;font-size:15px;">${escapeHtml(r.label)}</div>
            <div class="small" style="margin-top:4px;">${escapeHtml(personLine)}</div>
            <div class="small" style="margin-top:6px;color:#94a3b8;">${escapeHtml(roleDesc)}</div>
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

  const selfError = ui.selfAssignError
    ? `<div class="input-error" style="margin-top:10px;">${escapeHtml(ui.selfAssignError)}</div>`
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
      ${selfError}
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

  // Progress bar is static in the hub: complete through Backlog.
  const hasReq = true;
  const hasBacklog = true;
  const hasTesting = false;
  const hasOutcome = false;

  const stepClass = (cond) => cond ? "step active" : "step";
  const doneCount = [hasReq, hasBacklog, hasTesting, hasOutcome].filter(Boolean).length || 1;
  const progressClass = `progress-${doneCount}`;

  return `
    ${header({ title: "SprintLab", subtitle })}
    <div class="screen">
      <h1 style="margin-bottom:4px;">Scenario Hub</h1>
      <p style="margin-bottom:14px;">Navigate to different areas of the scenario</p>

      <div class="progress-card">
        <div style="font-weight:600;margin-bottom:10px;">Progress</div>
        <div class="progress-steps ${progressClass}">
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
    <div class="card hub-card" data-go="${escapeHtml(route)}" style="cursor:pointer;">
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
  const notesValue = state.workspace?.[scen.id]?.[role]?.notes || "";

  const notesCard = `
    <div class="card" style="margin-top:12px;">
      <div style="font-weight:600;margin-bottom:8px;">My Notes</div>
      <textarea id="workspaceNotes" rows="4"
        style="width:100%;padding:12px;border:1px solid #cbd5f5;border-radius:12px;resize:none;"
        placeholder="Capture observations or decisions...">${escapeHtml(notesValue)}</textarea>
    </div>
  `;

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
    <div class="card" style="margin-top:12px;cursor:pointer;" data-go="${escapeHtml(isProfessor() ? "prof_outcome" : "outcome")}">
      <div class="card-icon">${icon("trending-up")}</div>
      <div class="card-title">Outcome & Summary</div>
      <div class="card-desc">Wrap up and reflect on results</div>
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

      ${notesCard}

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

  const detailSections = [];
  if (persona.goals?.length) {
    detailSections.push(`
      <div style="margin-top:8px;">
        <div class="small" style="font-weight:600;color:#475569;">Goals</div>
        <ul style="margin:6px 0 0 16px;color:#475569;">
          ${persona.goals.map(g => `<li style="margin:4px 0;">${escapeHtml(g)}</li>`).join("")}
        </ul>
      </div>
    `);
  }
  if (persona.painPoints?.length) {
    detailSections.push(`
      <div style="margin-top:8px;">
        <div class="small" style="font-weight:600;color:#475569;">Pain points</div>
        <ul style="margin:6px 0 0 16px;color:#475569;">
          ${persona.painPoints.map(p => `<li style="margin:4px 0;">${escapeHtml(p)}</li>`).join("")}
        </ul>
      </div>
    `);
  }
  if (persona.needs?.length) {
    detailSections.push(`
      <div style="margin-top:8px;">
        <div class="small" style="font-weight:600;color:#475569;">Needs</div>
        <ul style="margin:6px 0 0 16px;color:#475569;">
          ${persona.needs.map(n => `<li style="margin:4px 0;">${escapeHtml(n)}</li>`).join("")}
        </ul>
      </div>
    `);
  }

  const personaProfile = detailSections.length
    ? `
      <details class="card no-hover persona-profile" style="margin-top:10px;padding:12px;background:#f8fafc;">
        <summary>Persona Profile</summary>
        <div class="small" style="margin-top:6px;color:#64748b;">${escapeHtml(persona.bio || "")}</div>
        ${detailSections.join("")}
      </details>
    `
    : "";

  const chatState = state.chats[scen.id]?.[stakeholderId];
  const msgs = chatState?.messages || [];

  const msgHtml = msgs.map(m => `
    <div class="message ${m.from === "user" ? "user" : "ai"}">${escapeHtml(m.text)}</div>
  `).join("");

  const hints = {
    alex: "Hint: Ask about value, MVP scope, and trade-offs.",
    customer: "Hint: Ask about return deadlines or label requirements.",
    warehouse: "Hint: Ask about inspection steps or damage criteria.",
    manager: "Hint: Ask about exceptions and success criteria."
  };

  const guides = {
    alex: ["Value delivered", "MVP scope", "Trade-offs", "Learning outcome"],
    customer: ["Return deadline", "Shipping label", "Status tracking", "Upload photo"],
    warehouse: ["Receive & scan", "Inspection outcome", "Damage reasons", "Barcode lookup"],
    manager: ["MVP scope", "Refund policy", "Success metrics", "Risks"]
  };
  const hintText = isProfessor()
    ? "Professor view: review message history (UI-only)."
    : (hints[stakeholderId] || "Hint: Ask about return deadlines.");

  return `
    ${header({ title: "SprintLab", subtitle, showBack: true, backRoute: "stakeholders" })}
    <div class="screen" style="padding:0;">
      <div class="chat-container">
        <div style="padding:16px;border-bottom:1px solid #e5e7eb;background:#fff;">
          <div style="font-weight:600;font-size:15px;">${escapeHtml(persona.name)} <span class="small">(${escapeHtml(persona.subtitle)})</span></div>
          <div class="small" style="margin-top:6px;">${escapeHtml(hintText)}</div>
          <div style="margin-top:8px;display:flex;gap:6px;flex-wrap:wrap;">
            ${(guides[stakeholderId] || []).map(g => `
              <button class="btn btn-secondary" data-guide-text="${escapeHtml(g)}"
                      style="padding:4px 10px;border-radius:999px;font-size:11px;">
                ${escapeHtml(g)}
              </button>
            `).join("")}
          </div>
          ${personaProfile}
        </div>

        <div class="chat-messages" id="chatMessages">
          ${msgHtml || `<div class="small" style="padding:10px;color:#64748b;">No messages yet. Start by asking a question.</div>`}
        </div>

        <div class="chat-input">
          <textarea id="chatInput" rows="2" placeholder="Type your question..."></textarea>
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
        ${["All", "To Do", "In Progress", "Done"].map(s => `<option value="${escapeHtml(s)}" ${ui.filterStatus===s?"selected":""}>${s === "All" ? "All Status" : s}</option>`).join("")}
      </select>
    </div>
    <div style="display:flex;gap:12px;margin-bottom:10px;">
      <select id="filterRole" style="flex:1;padding:10px;border:1px solid #cbd5f5;border-radius:12px;">
        ${["All", "PO", "BA", "Dev", "Tester"].map(r => `<option value="${escapeHtml(r)}" ${ui.filterRole===r?"selected":""}>${r === "All" ? "All Roles" : r}</option>`).join("")}
      </select>
    </div>
  `;

  const list = filtered.map(i => backlogRow(i)).join("");

  return `
    ${header({ title: "SprintLab", subtitle, showBack: true, backRoute: "hub" })}
    <div class="screen">
      <h1 style="margin-bottom:6px;">Product Backlog</h1>
      <p>View and manage backlog items</p>

      <div style="display:flex;gap:10px;margin:12px 0;">
        <button class="btn btn-secondary" id="btnBackToHub" style="flex:1;">
          Back to Scenario Home
        </button>
        <button class="btn btn-secondary" id="btnBackToWorkspace" style="flex:1;">
          Back to Workspace
        </button>
      </div>

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
          <div class="small">${escapeHtml(item.id)}</div>
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

  const itemId = state.nav.params.itemId;
  const items = DATA.backlog[scen.id] || [];
  const idx = items.findIndex(i => i.id === itemId);
  const item = items[idx];
  if (!item) return screenBacklog();

  // Track “touched” items for highlights
  const act = state.activity[scen.id] || (state.activity[scen.id] = { backlogTouchedIds: [], chatCount: 0 });
  if (!act.backlogTouchedIds.includes(itemId)) act.backlogTouchedIds.push(itemId);

  const subtitle = `${scen.title} - Backlog ${itemId}`;

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
      <div class="small" style="margin-bottom:6px;">${escapeHtml(item.id)} ${roleTags}</div>
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

      <h2 style="margin:18px 0 10px;">Role Notes</h2>
      <div class="card">
        <div class="small" style="margin-bottom:8px;">${escapeHtml(currentRoleLabel())} Notes</div>
        <textarea rows="4" style="width:100%;padding:12px;border:1px solid #cbd5f5;border-radius:12px;resize:none;"
          placeholder="Add notes or decisions for this item (UI-only)."></textarea>
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

      <button class="btn btn-secondary btn-full" id="btnBackToBacklog" style="margin-top:12px;">
        Back to Backlog
      </button>

      <div class="safe-area"></div>
    </div>
  `;
}

function screenOutcomeStudent() {
  if (!requireAuthOrRedirect()) return "";
  const scen = getSelectedScenario();
  if (!scen) return screenDashboard();

  const displayTitle = getScenarioDisplayTitle(scen);
  const subtitle = `${displayTitle} - ${currentRoleLabel()}`;
  const stepActive = "step active";
  const stepInactive = "step";

  return `
    ${header({ title: "SprintLab", subtitle, showBack: true, backRoute: "hub" })}
    <div class="screen">
      <h1 style="margin-bottom:6px;">Simulation Outcome - ${escapeHtml(displayTitle)}</h1>
      <p style="margin-bottom:14px;">Review your progress and reflect on the experience</p>

      <h2 style="margin:12px 0 10px;">Step Timeline</h2>
      <div class="progress-card">
        <div class="progress-steps progress-3">
          <div class="${stepActive}">
            <div class="step-circle">1</div>
            <div class="step-label">Requirements</div>
          </div>
          <div class="${stepActive}">
            <div class="step-circle">2</div>
            <div class="step-label">Backlog</div>
          </div>
          <div class="${stepActive}">
            <div class="step-circle">3</div>
            <div class="step-label">Testing</div>
          </div>
          <div class="${stepInactive} muted">
            <div class="step-circle">4</div>
            <div class="step-label">Outcome</div>
          </div>
        </div>
      </div>

      <h2 style="margin:18px 0 10px;">Highlights</h2>
      <div class="card">
        <div class="small" style="margin-bottom:10px;">Decisions made: <b>5</b></div>
        <div class="small" style="margin-bottom:10px;">Stakeholder Chats: <b>3</b></div>
        <div class="small">Backlog Items Refined: <b>2</b></div>
      </div>

      <h2 style="margin:18px 0 10px;">Reflection</h2>
      <div class="card">
        <div class="small" style="margin-bottom:8px;color:#64748b;">
          Reflection: What went well in this sprint? What would you change?
        </div>
        <textarea id="reflectionInput" rows="5" style="width:100%;padding:12px;border:1px solid #cbd5f5;border-radius:12px;resize:none;"
          placeholder="Type your reflection..."></textarea>
        <button class="btn btn-secondary btn-full" id="btnBackToHub" style="margin-top:12px;">Back to Scenario Home</button>
        <button class="btn btn-secondary btn-full" id="btnExitToDashboard" style="margin-top:10px;">Exit to Dashboard</button>
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
  const filters = state.ui.outcomeFilters || { role: "All", status: "All" };
  const roles = ["All", "PO", "BA", "Dev", "Tester"];
  const statuses = ["All", "Active", "Idle", "Completed", "In Progress"];

  const filtered = (state.classView[scen.id]?.groups || []).filter(g => {
    const roleOk = filters.role === "All" || g.role === filters.role;
    const statusOk = filters.status === "All" || g.status === filters.status;
    return roleOk && statusOk;
  });

  const rows = filtered.map(g => `
    <tr data-group-row="${escapeHtml(g.name)}" style="cursor:pointer;">
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

      <div class="card" style="margin-top:12px;">
        <div style="font-weight:600;margin-bottom:8px;">Filters</div>
        <div style="display:flex;gap:12px;flex-wrap:wrap;">
          <select id="profFilterRole" style="flex:1;min-width:140px;padding:10px;border:1px solid #cbd5f5;border-radius:12px;">
            ${roles.map(r => `<option value="${escapeHtml(r)}" ${filters.role === r ? "selected" : ""}>${escapeHtml(r)}</option>`).join("")}
          </select>
          <select id="profFilterStatus" style="flex:1;min-width:140px;padding:10px;border:1px solid #cbd5f5;border-radius:12px;">
            ${statuses.map(s => `<option value="${escapeHtml(s)}" ${filters.status === s ? "selected" : ""}>${escapeHtml(s)}</option>`).join("")}
          </select>
        </div>
      </div>

      <h2 style="margin:18px 0 10px;">Teams / students</h2>
      <div class="card no-hover" style="padding:0;overflow:hidden;">
        <table class="table-hover" style="width:100%;border-collapse:collapse;font-size:13px;">
          <thead style="background:#f8fafc;">
            <tr>
              <th style="text-align:left;padding:10px;border-bottom:1px solid #e5e7eb;">Team</th>
              <th style="text-align:left;padding:10px;border-bottom:1px solid #e5e7eb;">Role</th>
              <th style="text-align:left;padding:10px;border-bottom:1px solid #e5e7eb;">Status</th>
              <th style="text-align:left;padding:10px;border-bottom:1px solid #e5e7eb;">Chats</th>
              <th style="text-align:left;padding:10px;border-bottom:1px solid #e5e7eb;">Backlog</th>
            </tr>
          </thead>
          <tbody>${rows || `<tr><td colspan="5" style="padding:12px;color:#94a3b8;">No teams match the selected filters.</td></tr>`}</tbody>
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

function screenReadOnlyWorkspace() {
  if (!requireAuthOrRedirect()) return "";
  if (!isProfessor()) return screenDashboard();
  const scen = getSelectedScenario();
  if (!scen) return screenDashboard();

  const groupName = state.nav.params.groupName;
  const group = (state.classView[scen.id]?.groups || []).find(g => g.name === groupName);
  if (!group) return screenOutcomeProfessor();

  const subtitle = `${scen.title} • ${group.name}`;

  return `
    ${header({ title: "SprintLab", subtitle, showBack: true, backRoute: "prof_outcome" })}
    <div class="screen">
      <h1 style="margin-bottom:6px;">Read-Only Workspace</h1>
      <p style="margin-bottom:14px;">Quick summary of student activity for ${escapeHtml(group.name)}</p>

      <div class="card" style="margin-bottom:12px;">
        <div style="display:flex;gap:10px;flex-wrap:wrap;">
          ${badge(`Role: ${group.role}`, "info")}
          ${badge(`Status: ${group.status}`, group.status === "Completed" ? "success" : "gray")}
          ${badge(`Chats: ${group.chats}`, "gray")}
          ${badge(`Backlog touched: ${group.backlogTouched}`, "gray")}
        </div>
      </div>

      <div class="card">
        <div style="font-weight:600;margin-bottom:8px;">Notes</div>
        <p class="small">Notes are available in the full workspace view (UI-only in this MVP).</p>
      </div>

      <div class="card" style="margin-top:12px;">
        <div style="font-weight:600;margin-bottom:8px;">Backlog Activity</div>
        <p class="small">This summary shows how many items were touched.</p>
      </div>

      <div class="card" style="margin-top:12px;">
        <div style="font-weight:600;margin-bottom:8px;">Chat Activity</div>
        <p class="small">This summary shows total chats with stakeholders.</p>
      </div>

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
    case "landing": html = screenLanding(); break;
    case "login": html = screenLogin(); break;
    case "register": html = screenRegister(); break;
    case "home": html = screenDashboard(); break;
    case "templates": html = screenTemplates(); break;
    case "overview": html = screenScenarioOverview(); break;
    case "create_scenario": html = screenCreateScenario(); break;
    case "roles": html = screenRoleDistribution(); break;
    case "hub": html = screenHub(); break;
    case "workspace": html = screenWorkspace(); break;
    case "stakeholders": html = screenStakeholders(); break;
    case "chat": html = screenChat(); break;
    case "backlog": html = screenBacklog(); break;
    case "backlog_detail": html = screenBacklogDetail(); break;
    case "outcome": html = screenOutcomeStudent(); break;
    case "prof_outcome": html = screenOutcomeProfessor(); break;
    case "prof_readonly": html = screenReadOnlyWorkspace(); break;
    default: html = screenLanding(); break;
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
  const profile = document.getElementById("btnProfile");
  if (profile) {
    profile.addEventListener("click", () => {
      state.ui.profileMenuOpen = !state.ui.profileMenuOpen;
      saveState();
      render();
    });
  }

  const dash = document.getElementById("btnProfileDashboard");
  if (dash) {
    dash.addEventListener("click", () => {
      state.ui.profileMenuOpen = false;
      saveState();
      if (!state.user.selectedScenarioId) {
        state.user.selectedScenarioId = "scenario01";
        saveState();
      }
      setRoute("hub");
    });
  }

  const scenarios = document.getElementById("btnProfileScenarios");
  if (scenarios) {
    scenarios.addEventListener("click", () => {
      state.ui.profileMenuOpen = false;
      state.user.selectedScenarioId = null;
      saveState();
      setRoute("home");
    });
  }

  const reset = document.getElementById("btnProfileReset");
  if (reset) {
    reset.addEventListener("click", () => {
      if (!window.confirm("Reset all app data and return to the landing page?")) return;
      localStorage.removeItem(LS_KEY);
      state = defaultState();
      state.nav.route = "landing";
      saveState();
      render();
    });
  }

  const logout = document.getElementById("btnProfileLogout");
  if (logout) {
    logout.addEventListener("click", () => {
      state.ui.profileMenuOpen = false;
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
  if (route === "landing") bindLanding();
  if (route === "login") bindLogin();
  if (route === "register") bindRegister();
  if (route === "home") bindDashboard();
  if (route === "templates") bindTemplates();
  if (route === "overview") bindOverview();
  if (route === "create_scenario") bindCreateScenario();
  if (route === "roles") bindRoles();
  if (route === "hub") bindHub();
  if (route === "workspace") bindWorkspace();
  if (route === "stakeholders") bindStakeholders();
  if (route === "chat") bindChat();
  if (route === "backlog") bindBacklog();
  if (route === "backlog_detail") bindBacklogDetail();
  if (route === "outcome") bindOutcomeStudent();
  if (route === "prof_outcome") bindOutcomeProfessor();
  if (route === "prof_readonly") bindReadOnlyWorkspace();
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
      else if (!isValidEmail(e)) errs.email = "Please enter a valid email address.";
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

function bindLanding() {
  const start = document.getElementById("btnStartLearning");
  if (start) {
    start.addEventListener("click", () => {
      setRoute("login");
    });
  }
  const login = document.getElementById("btnLandingLogin");
  if (login) login.addEventListener("click", () => setRoute("login"));
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
      const isKnownDuplicate = e.toLowerCase() === "existing@test.com";
      if (!errs.email && (exists || isKnownDuplicate)) errs.email = "Email already registered.";

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
  const templates = document.getElementById("btnTemplates");
  if (templates) {
    templates.addEventListener("click", () => setRoute("templates"));
  }

  const createScenario = document.getElementById("btnCreateScenario");
  if (createScenario) {
    createScenario.addEventListener("click", () => {
      const scenario = createCustomScenarioDraft();
      state.user.selectedScenarioId = scenario.id;
      state.ui.createScenario.form = {
        name: "",
        cohort: "",
        startDate: "",
        endDate: "",
        notes: "",
        short: "",
        overview: "",
        goals: "",
        constraints: "",
        successCriteria: "",
        personas: "",
        status: "In progress"
      };
      state.ui.createScenario.errors = {};
      saveState();
      setRoute("create_scenario");
    });
  }

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
      ensureScenarioState(id);
      saveState();
      setRoute("overview", { from: "home" });
    });
  });

  document.querySelectorAll("[data-edit-scenario]").forEach(btn => {
    btn.addEventListener("click", () => {
      const id = btn.getAttribute("data-edit-scenario");
      state.user.selectedScenarioId = id;
      ensureScenarioState(id);
      state.ui.createScenario.form = { scenarioId: id };
      state.ui.createScenario.errors = {};
      saveState();
      setRoute("create_scenario");
    });
  });

  document.querySelectorAll("[data-delete-scenario]").forEach(btn => {
    btn.addEventListener("click", () => {
      const id = btn.getAttribute("data-delete-scenario");
      if (!id) return;
      if (!window.confirm("Delete this scenario? This cannot be undone.")) return;
      if (!deleteScenario(id)) return;
      saveState();
      render();
    });
  });
}

function bindTemplates() {
  document.querySelectorAll("[data-view-template]").forEach(btn => {
    btn.addEventListener("click", () => {
      const id = btn.getAttribute("data-view-template");
      setRoute("overview", { from: "templates", templateId: id });
    });
  });
}

function bindOverview() {
  const backBtn = document.getElementById("btnBackToScenarios");
  if (backBtn) {
    backBtn.addEventListener("click", () => {
      const r = backBtn.getAttribute("data-back-route") || "home";
      setRoute(r);
    });
  }

  const contBtn = document.getElementById("btnContinueRoles");
  if (contBtn) {
    contBtn.addEventListener("click", () => setRoute("roles"));
  }

  // Create Active Scenario (professor)
  const btn = document.getElementById("btnCreateActive");
  if (btn) {
    btn.addEventListener("click", () => {
      const scen = getSelectedScenario();
      if (!scen) return;
      state.ui.createScenario.form = { scenarioId: scen.id };
      state.ui.createScenario.errors = {};
      saveState();
      setRoute("create_scenario");
    });
  }
}

function bindCreateScenario() {
  const scen = getSelectedScenario();
  if (!scen) return;
  const existing = state.activeScenario?.[scen.id] || {};

  const name = document.getElementById("csName");
  const short = document.getElementById("csShort");
  const overview = document.getElementById("csOverview");
  const goals = document.getElementById("csGoals");
  const constraints = document.getElementById("csConstraints");
  const personas = document.getElementById("csPersonas");
  const success = document.getElementById("csSuccess");
  const cohort = document.getElementById("csCohort");
  const start = document.getElementById("csStart");
  const end = document.getElementById("csEnd");
  const notes = document.getElementById("csNotes");
  const saveBtn = document.getElementById("btnSaveScenario");

  if (name) name.addEventListener("input", (e) => { state.ui.createScenario.form.name = e.target.value; saveState(); });
  if (short) short.addEventListener("input", (e) => { state.ui.createScenario.form.short = e.target.value; saveState(); });
  if (overview) overview.addEventListener("input", (e) => { state.ui.createScenario.form.overview = e.target.value; saveState(); });
  if (goals) goals.addEventListener("input", (e) => { state.ui.createScenario.form.goals = e.target.value; saveState(); });
  if (constraints) constraints.addEventListener("input", (e) => { state.ui.createScenario.form.constraints = e.target.value; saveState(); });
  if (personas) personas.addEventListener("input", (e) => { state.ui.createScenario.form.personas = e.target.value; saveState(); });
  if (success) success.addEventListener("input", (e) => { state.ui.createScenario.form.successCriteria = e.target.value; saveState(); });
  if (cohort) cohort.addEventListener("input", (e) => { state.ui.createScenario.form.cohort = e.target.value; saveState(); });
  if (start) start.addEventListener("input", (e) => { state.ui.createScenario.form.startDate = e.target.value; saveState(); });
  if (end) end.addEventListener("input", (e) => { state.ui.createScenario.form.endDate = e.target.value; saveState(); });
  if (notes) notes.addEventListener("input", (e) => { state.ui.createScenario.form.notes = e.target.value; saveState(); });
  document.querySelectorAll("[data-status-option]").forEach(btn => {
    btn.addEventListener("click", () => {
      state.ui.createScenario.form.status = btn.getAttribute("data-status-option");
      saveState();
      render();
    });
  });

  if (saveBtn) {
    saveBtn.addEventListener("click", () => {
      const f = state.ui.createScenario.form || {};
      const baseScenario = getScenarioById(scen.id) || scen;
      const errs = {};
      if (!String(f.name ?? existing.name ?? baseScenario.title ?? "").trim()) errs.name = "Exercise name is required.";
      if (!String(f.startDate ?? existing.startDate ?? "").trim()) errs.startDate = "Start date is required.";

      if (Object.keys(errs).length) {
        state.ui.createScenario.errors = errs;
        saveState();
        render();
        return;
      }

      const name = (f.name ?? existing.name ?? baseScenario.title).trim();
      const shortText = (f.short ?? existing.short ?? baseScenario.short ?? "").trim();
      const overviewText = (f.overview ?? existing.overview ?? baseScenario.overview ?? "").trim();
      const goals = f.goals === undefined
        ? ((existing.goals ?? baseScenario.goals) || [])
        : parseLines(f.goals);
      const constraints = f.constraints === undefined
        ? ((existing.constraints ?? baseScenario.constraints) || [])
        : parseLines(f.constraints);
      const successCriteria = f.successCriteria === undefined
        ? ((existing.successCriteria ?? baseScenario.successCriteria) || [])
        : parseLines(f.successCriteria);
      let personasList = null;
      if (f.personas === undefined) {
        personasList = existing.personas ?? baseScenario.personas ?? defaultPersonas();
      } else if (!String(f.personas || "").trim()) {
        personasList = [];
      } else {
        personasList = parsePersonas(f.personas) || [];
      }

      const status = f.status ?? existing.status ?? baseScenario.status ?? "Not active";
      const isActive = status === "In progress";

      ensureScenarioState(scen.id);
      if (!state.activeScenario) state.activeScenario = {};
      state.activeScenario[scen.id] = {
        isActive,
        status,
        name,
        short: shortText,
        overview: overviewText,
        goals,
        constraints,
        successCriteria,
        personas: personasList,
        cohort: (f.cohort ?? existing.cohort ?? "").trim(),
        startDate: f.startDate ?? existing.startDate ?? "",
        endDate: f.endDate || "",
        notes: (f.notes ?? existing.notes ?? "").trim(),
        createdAt: nowIso()
      };
      if (isCustomScenario(scen.id)) {
        const entry = getCustomScenarios().find(s => s.id === scen.id);
        if (entry) {
          entry.title = name;
          entry.short = shortText;
          entry.overview = overviewText;
          entry.goals = goals;
          entry.constraints = constraints;
          entry.successCriteria = successCriteria;
          entry.personas = personasList;
          entry.status = status;
          entry.active = isActive;
        }
      }
      state.ui.createScenario.errors = {};
      saveState();
      setRoute("roles");
    });
  }
}

function bindRoles() {
  if (!state.ui.roleAssign) {
    state.ui.roleAssign = { assignErrors: {}, selfAssignError: "" };
  }

  // Student: click available role
  document.querySelectorAll("[data-pick-role]").forEach(card => {
    card.addEventListener("click", () => {
      const role = card.getAttribute("data-pick-role");
      state.ui.roleAssign.selfAssignError = "";
      saveState();
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

      const existingRole = getAssignedRoleForScenario(scen.id);
      if (existingRole && existingRole !== selected) {
        state.ui.roleAssign.selfAssignError = `You are already assigned to ${existingRole}. Unassign it first.`;
        saveState();
        render();
        return;
      }

      entry.status = "assigned";
      entry.person = state.user.name;

      state.user.role = selected;
      state.ui.roleAssign.selfAssignError = "";
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

      const nameKey = normalizeKey(name);
      const existing = roles.find(r => r.status === "assigned" && normalizeKey(r.person) === nameKey);
      if (existing && existing.name !== role) {
        state.ui.roleAssign.assignErrors[role] = `Student is already assigned to ${existing.name}.`;
        saveState();
        render();
        return;
      }

      entry.status = "assigned";
      entry.person = name;

      state.ui.roleAssign.assignErrors[role] = "";
      saveState();
      render();
    });
  });

  // Professor unassign role
  document.querySelectorAll("[data-prof-unassign-btn]").forEach(btn => {
    btn.addEventListener("click", () => {
      const role = btn.getAttribute("data-prof-unassign-btn");
      const scen = getSelectedScenario();
      if (!scen) return;

      const roles = state.roles[scen.id] || [];
      const entry = roles.find(r => r.name === role);
      if (!entry) return;

      entry.status = "available";
      entry.person = null;

      state.ui.roleAssign.assignErrors[role] = "";
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

  const scen = getSelectedScenario();
  if (!scen) return;
  const role = currentRoleLabel();
  const notes = document.getElementById("workspaceNotes");
  if (notes) {
    notes.addEventListener("input", (e) => {
      if (!state.workspace[scen.id]) state.workspace[scen.id] = {};
      if (!state.workspace[scen.id][role]) state.workspace[scen.id][role] = { tasksDone: {} };
      state.workspace[scen.id][role].notes = e.target.value;
      saveState();
    });
  }
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
  const guideBtns = document.querySelectorAll("[data-guide-text]");

  function scrollToBottom() {
    if (msgBox) msgBox.scrollTop = msgBox.scrollHeight;
  }
  scrollToBottom();

  function pushMessage(from, text) {
    const chatState = state.chats[scen.id][stakeholderId];
    chatState.messages.push({ from, text, ts: nowIso() });
  }

  function scriptedReply(userText) {
    const scriptsEntry = DATA.chatScripts[stakeholderId];
    let scripts = [];
    let roleScoped = false;
    let sequence = null;
    let sequenceFallback = null;
    let roleKey = null;
    if (Array.isArray(scriptsEntry)) {
      scripts = scriptsEntry;
    } else if (scriptsEntry && typeof scriptsEntry === "object") {
      const role = currentRoleLabel();
      roleKey =
        role === "BA" || role === "Professor" || role === "Student"
          ? "PO"
          : (role === "QA" ? "Tester" : role);
      const roleScripts =
        scriptsEntry[roleKey] ||
        (roleKey === "Tester" && scriptsEntry.QA) ||
        scriptsEntry.PO ||
        scriptsEntry.default ||
        [];
      if (Array.isArray(roleScripts)) {
        scripts = roleScripts;
      } else if (roleScripts && typeof roleScripts === "object") {
        if (Array.isArray(roleScripts.sequence)) sequence = roleScripts.sequence;
        if (roleScripts.fallback) sequenceFallback = roleScripts.fallback;
        if (Array.isArray(roleScripts.scripts)) scripts = roleScripts.scripts;
      }
      roleScoped = true;
    }
    if (sequence && sequence.length) {
      const chatState = state.chats?.[scen.id]?.[stakeholderId];
      if (!chatState) return sequenceFallback || sequence[sequence.length - 1];
      if (!chatState.context) chatState.context = {};
      const seqKey = `sequence_${roleKey || "default"}`;
      const idx = Number(chatState.context[seqKey] || 0);
      if (idx < sequence.length) {
        chatState.context[seqKey] = idx + 1;
        return sequence[idx];
      }
      return sequenceFallback || sequence[sequence.length - 1];
    }
    const t = String(userText || "").toLowerCase();
    for (const s of scripts) {
      if (!s.match || s.match.length === 0) continue;
      if (s.match.some(k => t.includes(k))) {
        if (!state.chats[scen.id][stakeholderId].context) {
          state.chats[scen.id][stakeholderId].context = {};
        }
        if (s.topic) state.chats[scen.id][stakeholderId].context.lastTopic = s.topic;
        return roleScoped ? s.reply : roleAwareReply(s.reply, s.topic);
      }
    }
    // default reply is last entry with empty match or fallback
    const fallback = scripts.find(s => !s.match || s.match.length === 0);
    const lastTopic = state.chats[scen.id][stakeholderId].context?.lastTopic;
    if (lastTopic) {
      const followUp = followUpReply(lastTopic);
      return roleScoped ? followUp : roleAwareReply(followUp, lastTopic);
    }
    if (fallback) return roleScoped ? fallback.reply : roleAwareReply(fallback.reply, fallback.topic);
    return "Thanks-could you clarify what you need?";
  }

  function roleAwareReply(baseReply, topic) {
    const role = currentRoleLabel();
    if (isProfessor()) return baseReply;
    const roleHints = {
      PO: {
        eligibility: "As PO, make sure the 30-day rule is explicit in the scope.",
        label: "As PO, include label delivery as a high-priority story.",
        status: "As PO, keep status labels consistent across screens.",
        refund: "As PO, align refund timing with policy and support."
      },
      BA: {
        eligibility: "As BA, clarify eligibility edge cases and error messaging.",
        label: "As BA, capture label failure states and acceptance criteria.",
        status: "As BA, define status transitions and timestamps.",
        refund: "As BA, document refund timeline and triggers."
      },
      Dev: {
        eligibility: "As Dev, validate rules and surface eligibility errors.",
        label: "As Dev, plan label generation and PDF download flow.",
        status: "As Dev, implement status updates and notifications.",
        refund: "As Dev, handle refund state and retry logic."
      },
      Tester: {
        eligibility: "As Tester, add cases for out-of-window returns.",
        label: "As Tester, validate label download and failure messages.",
        status: "As Tester, verify each status change path.",
        refund: "As Tester, test refund timing and error messaging."
      }
    };
    const hint = roleHints[role]?.[topic];
    return hint ? `${baseReply} ${hint}` : baseReply;
  }

  function followUpReply(topic) {
    const followUps = {
      alex: {
        value: "Be specific about the learner value, not just the feature.",
        problem: "Name the user pain point this solves.",
        alignment: "Tie it directly to Sprint 3's interaction goal.",
        mvp: "Keep it scripted and simple for now.",
        tradeoff: "Call out what we are not doing yet.",
        outcome: "Focus on the learning outcome, not just the interface."
      },
      customer: {
        eligibility: "Also, the app should show the exact last eligible return date.",
        label: "If I can't print, a QR code for drop-off would be ideal.",
        status: "Show me what action I should take at each status.",
        refund: "A confirmation message when refund is initiated would help.",
        photo: "Let me upload from my phone camera, not just files."
      },
      warehouse: {
        receive: "We should log the receiving time for audit purposes.",
        inspection: "We need a quick reject reason list to speed up processing.",
        barcode: "If scanning fails, manual lookup should still be possible.",
        exceptions: "Flag exceptions so the manager can review quickly."
      },
      manager: {
        scope: "Keep MVP tight; we can add analytics later.",
        metrics: "Cycle time and approval rate are the key indicators.",
        risks: "Inconsistent status updates create support tickets.",
        refund: "Policy clarity reduces escalations."
      }
    };
    const reply = followUps[stakeholderId]?.[topic];
    return reply || "Could you share more specifics so I can respond clearly?";
  }

  guideBtns.forEach(btn => {
    btn.addEventListener("click", () => {
      const text = btn.getAttribute("data-guide-text") || "";
      if (input) {
        input.value = text;
        input.focus();
        input.setSelectionRange(input.value.length, input.value.length);
      }
    });
  });

  if (send) {
    send.addEventListener("click", () => {
      const text = (input?.value || "").trim();
      if (!text) return;

      if (!state.chats[scen.id]) state.chats[scen.id] = {};
      if (!state.chats[scen.id][stakeholderId]) state.chats[scen.id][stakeholderId] = { messages: [], unread: 0 };

      pushMessage("user", text);

      // Simulated typing delay
      const chatState = state.chats[scen.id][stakeholderId];
      const typingIdx = chatState.messages.length;
      pushMessage("ai", "Typing...");

      // activity tracking
      const act = state.activity[scen.id] || (state.activity[scen.id] = { backlogTouchedIds: [], chatCount: 0 });
      act.chatCount += 1;

      saveState();
      render();

      setTimeout(() => {
        if (!state.chats[scen.id]?.[stakeholderId]?.messages?.[typingIdx]) return;
        state.chats[scen.id][stakeholderId].messages[typingIdx].text = scriptedReply(text);
        saveState();
        render();
      }, 1000);
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

  const back = document.getElementById("btnBackToHub");
  if (back) {
    back.addEventListener("click", () => setRoute("hub"));
  }

  const backWs = document.getElementById("btnBackToWorkspace");
  if (backWs) {
    backWs.addEventListener("click", () => setRoute("workspace"));
  }

  document.querySelectorAll("[data-open-item]").forEach(row => {
    row.addEventListener("click", () => {
      const id = row.getAttribute("data-open-item");
      setRoute("backlog_detail", { itemId: id });
    });
  });
}

function bindBacklogDetail() {
  const scen = getSelectedScenario();
  if (!scen) return;

  const items = DATA.backlog[scen.id] || [];
  const itemId = state.nav.params.itemId;
  const idx = items.findIndex(i => i.id === itemId);

  const prev = document.getElementById("btnPrevItem");
  const next = document.getElementById("btnNextItem");

  if (prev && idx > 0) {
    prev.addEventListener("click", () => setRoute("backlog_detail", { itemId: items[idx - 1].id }));
  }
  if (next && idx < items.length - 1) {
    next.addEventListener("click", () => setRoute("backlog_detail", { itemId: items[idx + 1].id }));
  }

  const back = document.getElementById("btnBackToBacklog");
  if (back) back.addEventListener("click", () => setRoute("backlog"));
}

function bindOutcomeStudent() {
  const scen = getSelectedScenario();
  if (!scen) return;

  const backBtn = document.getElementById("btnBackToHub");
  const exitBtn = document.getElementById("btnExitToDashboard");

  if (backBtn) backBtn.addEventListener("click", () => setRoute("hub"));

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

  const role = document.getElementById("profFilterRole");
  if (role) {
    role.addEventListener("change", () => {
      state.ui.outcomeFilters.role = role.value;
      saveState();
      render();
    });
  }

  const status = document.getElementById("profFilterStatus");
  if (status) {
    status.addEventListener("change", () => {
      state.ui.outcomeFilters.status = status.value;
      saveState();
      render();
    });
  }

  document.querySelectorAll("[data-group-row]").forEach(row => {
    row.addEventListener("click", () => {
      const name = row.getAttribute("data-group-row");
      if (!name) return;
      setRoute("prof_readonly", { groupName: name });
    });
  });
}

function bindReadOnlyWorkspace() {}

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
  applyAppScale();
  window.addEventListener("resize", applyAppScale);
  window.addEventListener("popstate", (event) => {
    if (!event.state || !event.state.route) return;
    setRoute(event.state.route, event.state.params || {}, { skipHistory: true });
  });
  if (RESET_STATE_ON_LOAD) {
    state = defaultState();
    saveState();
  }
  // If logged in but no route, go home
  if (state.auth.isLoggedIn) {
    if (!state.nav.route || state.nav.route === "login") state.nav.route = "home";
  } else {
    state.nav.route = "landing";
  }
  migrateScenarioNames();
  syncAssignedRole();
  window.history.replaceState({ route: state.nav.route, params: state.nav.params || {} }, "");
  saveState();
  render();
})();
