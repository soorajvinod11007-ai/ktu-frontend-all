# College Result Pro — Frontend

A modern, glassmorphism-styled React dashboard for the College Result Analysis backend.

## Tech Stack

| Layer | Choice |
|---|---|
| Framework | React 18 + Vite |
| Styling | Tailwind CSS v3 (light/dark theme) |
| Routing | React Router v6 |
| HTTP | Axios (with auto-refresh interceptor) |
| Charts | Recharts |
| Icons | Lucide React |
| Fonts | Fira Sans + Fira Code (Google Fonts) |

## Design System

- **Default theme**: Light, with a persistent light/dark toggle
- **Cards**: Translucent surfaces with `backdrop-blur(12px)` and theme-aware borders
- **Accent**: Green for pass rates, CTAs, active states
- **Typography**: Fira Sans (UI) / Fira Code (data/mono values)
- **Destructive**: `#EF4444` for failures, errors, deletions
- **Amber**: `#F59E0B` for warnings, supplementary flags

## Quick Start

```bash
# 1. Install frontend dependencies
npm install

# 2. Start the frontend (proxies /api to the backend at localhost:8000)
npm run dev

# 3. Open http://localhost:5173
```

The frontend calls the API under `/api/v1`. Vite proxies those requests to `http://localhost:8000` by default. You can override the proxy target with `VITE_API_PROXY_TARGET` in a local `.env` file (copy `.env.example` to `.env` first), then restart Vite.

### Run the extracted backend locally on Windows

In a separate terminal, start the extracted `results-analyser-main` folder (or replace that folder name with your extraction path):

```powershell
cd ..\results-analyser-main
.\.venv\Scripts\Activate.ps1
```

The backend's `.venv` and `.env` are already present in the extracted folder. Keep `.env` private and do not commit it. It is configured to use SQLite locally. If the virtual environment is missing or does not work on this computer, recreate it and install the requirements from the backend folder before continuing.

```powershell
uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

Verify the backend at `http://localhost:8000/api/v1/health` and its API docs at `http://localhost:8000/docs`. With both servers running, use the usernames and passwords set in the backend `.env` to sign in at `http://localhost:5173/login`.

## Screens

### Admin App
| Screen | Path | Description |
|---|---|---|
| Login | `/login` | Shared login; redirects by role |
| Dashboard | `/admin` | Stats, chart, recent uploads, flagged alert |
| Students | `/admin/students` | Full CRUD with search, sort, pagination |
| Faculty | `/admin/faculty` | Full CRUD |
| Programs | `/admin/programs` | Full CRUD |
| Batches | `/admin/batches` | Full CRUD |
| Divisions | `/admin/divisions` | Full CRUD |
| Subjects | `/admin/subjects` | Full CRUD |
| Course Offerings | `/admin/course-offerings` | Full CRUD |
| Exam Sessions | `/admin/exam-sessions` | Full CRUD |
| Results | `/admin/results` | Full CRUD |
| Grade Cards | `/admin/grade-cards` | Full CRUD |
| Result History | `/admin/result-history` | Read-only |
| Upload Logs | `/admin/upload-logs` | Read-only |
| Upload Files | `/admin/upload` | 2-step: preview → confirm |
| Flagged Students | `/admin/flagged` | Filtered list |
| Users | `/admin/users` | Full CRUD |

### Principal App
| Screen | Path | Description |
|---|---|---|
| Report Home | `/principal` | 5 report cards |
| Course Performance | `/principal/report/course-faculty-performance` | Filter + table + chart |
| Faculty History | `/principal/report/faculty-history` | Faculty teaching record |
| Supplementary Status | `/principal/report/supplementary-status` | Per-student supply count |
| Program & Semester | `/principal/report/program-semester` | Summary table |
| Graduation Stats | `/principal/report/graduation` | Graduation rate trends |

## Key Features

- **Role-based routing** — Admin sees CRUD; Principal sees reports only (no edit controls shown)
- **Auto token refresh** — 401 responses trigger one `/auth/refresh` attempt before redirecting to login
- **Two-step upload** — Preview parsed rows and errors before committing data
- **Toast notifications** — Every API action gives immediate success/error feedback
- **Error display** — API `error.message` shown to user; `error.request_id` logged for backend team
- **Soft delete + restore** — Delete button on table rows; restore icon on deleted records
- **Excel export** — Per-resource export from the table header
- **PDF + Excel report download** — On every report page
- **Accessible** — `focus-ring` on all interactive elements, ARIA labels, keyboard navigation

## Project Structure

```
src/
├── main.jsx              # Root: AuthProvider + ToastProvider + App
├── App.jsx               # Router + auth guards
├── index.css             # Global styles, CSS variables, glassmorphism utils
├── services/
│   └── api.js            # Axios instance + all API functions (authApi, adminApi, uploadApi, reportApi)
├── contexts/
│   ├── AuthContext.jsx   # user, login(), logout(), isAdmin
│   └── ToastContext.jsx  # toast(message, type) global toasts
├── components/
│   ├── Layout/
│   │   ├── AdminLayout.jsx      # Collapsible sidebar + top bar
│   │   └── PrincipalLayout.jsx  # Report-focused sidebar
│   └── UI/
│       ├── index.jsx     # Button, Card, Badge, Input, Select, Modal, ConfirmDialog, StatCard, Pagination, EmptyState, Spinner
│       └── DataTable.jsx # Sortable, paginated data table
├── pages/
│   ├── Login.jsx
│   ├── admin/
│   │   ├── Dashboard.jsx      # Stats + chart + recent uploads
│   │   ├── ResourceTable.jsx  # Generic CRUD table (all 13 resources)
│   │   ├── ResourceForm.jsx   # Dynamic create/edit form per resource
│   │   ├── UploadScreen.jsx   # 2-step file upload
│   │   ├── UploadHistory.jsx
│   │   └── FlaggedStudents.jsx
│   └── principal/
│       ├── ReportHome.jsx     # 5 report cards
│       └── ReportView.jsx     # Filter bar + report data + download
└── utils/
    └── formatters.js     # fmtPct, fmtDate, statusBadge, downloadBlob, REPORT_CONFIGS
```

## Production Build

```bash
npm run build
# Output in dist/
```

For production, update the base URL in `src/services/api.js` or set the proxy target in `vite.config.js`.
