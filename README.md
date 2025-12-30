
# SprintLab – MVP PM Simulator

**SprintLab** is a lightweight, browser-based simulation tool designed to teach Product Management concepts. It creates a realistic environment where students can assume Agile roles (Product Owner, Business Analyst, Developer, Tester), interact with simulated stakeholders, manage product backlogs, and track project outcomes.

This project is a **UI-only MVP (Minimum Viable Product)** built with vanilla web technologies. It uses `localStorage` to simulate a database, meaning no backend server is required to run it.

---

## 📱 Features

- **Mobile-First Design:** Styled specifically within an iPhone 13 frame (`390x844`) to simulate a mobile app experience.
- **New Landing Page:** A welcoming entry point outlining the tool's value proposition before login.
- **Scenario Templates:** A browser interface to view and select different project scenarios (e.g., Intro, Advanced).
- **Role-Based Access:**
  - **Student View:** Join scenarios, select roles (PO, BA, Dev, Tester), and complete role-specific tasks.
  - **Professor View:** Create active scenarios, assign roles to students, and view class-level aggregated outcomes.
- **Simulated Stakeholder Chat:** An interactive chat interface where users talk to "AI" stakeholders (Customer, Warehouse Operator, Manager) to gather requirements.
- **Backlog Management:** A fully functional backlog UI with filtering (Priority, Status, Role) and detailed user story views (supporting new `US-XX` ID formats).
- **Role Workspaces:** Specific checklists and tasks tailored to the user's selected role.
- **Local State Management:** Accounts, progress, chat history, and role assignments are persisted in the browser's `localStorage`.

---

## 🛠 Tech Stack

- **HTML5:** Semantic markup.
- **CSS3:** Custom styling with a clean, "Inter" font-based SaaS aesthetic. No external CSS frameworks (Bootstrap/Tailwind) were used.
- **JavaScript (ES6+):** Pure Vanilla JS. Handles routing, state management, DOM manipulation, and event listeners.
- **Lucide Icons:** Used for UI iconography.

---

## 🚀 Getting Started

Since this is a static web application, you do not need to install Node.js or run a build process.

### Prerequisites

- A modern web browser (Chrome, Firefox, Safari, Edge).

### Installation & Running

1. **Create the files:** Create a folder and add `index.html`, `styles.css`, and `app.js`.
2. **Paste the code:** Copy the respective code into each file.
3. **Open the app:** Double-click `index.html` to open it in your browser.
4. **Recommended:** For the best experience, use a local server (like the "Live Server" extension in VS Code) to prevent strict browser security warnings.

---

## 🔐 Demo Credentials

The application comes pre-loaded with simulated accounts. You can also register a new account (data stays local).

| Role              | Email                | Password |
|-------------------|----------------------|----------|
| **Student** | demo@sprintlab.edu   | demo123 |
| **Professor** | prof@sprintlab.edu   | prof123 |
| **Student (Alt)** | emma@uni.edu         | emma123 |

---

## 📖 User Guide

### 1. The Workflow

1. **Landing & Login:** Click **Start Learning** on the landing page and use the demo credentials above.
2. **Templates & Dashboard:** Browse templates or click **Open** on the active **Scenario 01**.
3. **Role Selection:**
   - Go to **Role Distribution**.
   - Click on an **Available** role (e.g., Business Analyst) to assign it to yourself.
4. **Hub Navigation:** Use the Hub to access different tools:
   - **Stakeholders:** Chat with personas to uncover requirements.
   - **Backlog:** Filter and review the 8 core user stories (including new photo upload & barcode scanning tasks).
   - **My Workspace:** Check off tasks specific to your role.
5. **Outcome:** Submit a reflection on your learning experience.

### 2. Professor Capabilities

- Log in as the Professor.
- Enter **Role Distribution** to manually assign specific students to roles.
- View the **Outcome & Summary** to see a table of team progress and engagement metrics.

---

## 📂 Project Structure

```text
/
├── index.html      # Entry point, loads CSS/JS and contains the root #app div
├── styles.css      # All styling (Reset, iPhone frame, Landing Page, Components)
└── app.js          # Logic (State management, Routing, Data, Event Handling)
```

---

## ⚠️ Limitations (MVP)

- **Data Persistence:** Data is stored in `localStorage`. Clearing your browser cache will reset the app.
- **Single Scenario:** Only *Scenario 01* is fully interactive. Others are placeholders.
- **AI Logic:** The stakeholders use static keyword matching (regex), not a real LLM.
- **Security:** Authentication is simulated. Do not use real passwords.

---

## 📄 License

This project is open-source and intended for educational purposes.
