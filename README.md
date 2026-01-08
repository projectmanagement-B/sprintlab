# SprintLab - MVP PM Simulator

SprintLab is a browser-based Product Management simulation for classroom exercises. It is a UI-only single-page app built with vanilla HTML/CSS/JS and uses localStorage for all data.

## Highlights
- Mobile-first UI rendered in a fixed iPhone 13 frame with auto-scale.
- Scenario dashboard with search and filters.
- Role-based flow for students (PO, BA, Dev, Tester) and professors.
- Scripted stakeholder chats, backlog management, and outcome reflections.

## Features
- Landing page, login, and registration with validation and duplicate email checks.
- Scenario templates and an overview page with goals, constraints, personas, and success criteria.
- Professor tools to create or edit active class exercises, set cohort/dates/notes, and activate scenarios.
- Custom scenarios: professors can create, edit, and delete scenarios from the dashboard.
- Role distribution with student self-selection and professor assignment or unassignment.
- Scenario hub navigation to workspace, stakeholders, backlog, and outcomes.
- Role workspaces with task checklists and notes.
- Stakeholder list and chat with scripted responses and unread counts (no real AI).
- Backlog list with filters (priority, status, role) and story detail pages with acceptance criteria.
- Student outcome reflection and professor aggregated outcomes plus a read-only workspace summary.
- Profile menu with reset to clear all local data.

## Tech Stack
- HTML5, CSS3, and vanilla JavaScript (ES6).
- Google Fonts (Inter) loaded from the web.
- Lucide icons loaded from the web.

## Getting Started
No build step is required.

1. Open `index.html` in a modern browser.
2. Optional: run a local server (e.g. VS Code Live Server) to avoid browser restrictions.

Note: Fonts and icons load from CDNs, so an internet connection is required for those assets.

## Demo Accounts
| Role | Email | Password |
| --- | --- | --- |
| Student | demo@sprintlab.edu | demo123 |
| Professor | prof@sprintlab.edu | prof123 |
| Student (Alt) | emma@uni.edu | emma123 |

## Project Structure
```text
/
  index.html   - App shell, fonts, and icons
  styles.css   - Layout, iPhone frame, and UI styles
  app.js       - State, routes, screens, and data
```

## Data and Persistence
- All data is stored in localStorage.
- Clearing browser storage or using the profile reset will restore the default demo state.

## Limitations
- UI-only prototype with no backend or real authentication.
- Stakeholder chats are scripted keyword responses, not an LLM.
- Scenario 01 is the only fully populated scenario; others are placeholders.

## License
Open-source and intended for educational use.
