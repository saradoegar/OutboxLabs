# ReachInbox / Outbox Labs - Email Scheduler Service & Dashboard

## 📌 Project Overview
A production-grade email scheduler service and frontend dashboard built to reliably schedule and send emails at scale.
- **Backend**: Node.js/TypeScript, BullMQ + Redis for persistent job scheduling (no cron jobs), Ethereal Email (fake SMTP) for sending, persistent storage for job status surviving restarts.
- **Frontend**: React.js / Next.js, Tailwind CSS, TypeScript matching the provided Figma design specs.
- **Authentication**: Real Google OAuth login (no mock) with user profile (name, email, avatar) and logout.

---

## 🎨 UI & Design Breakdown (from Figma Mockups)

### 1. Login Screen (`media_1789105908378.png`)
- Centered clean auth card on subtle background.
- "Login" title.
- Primary **"Login with Google"** button with Google 'G' icon.
- Divider: `── or sign up through email ──`.
- Inputs: "Email ID", "Password".
- Primary solid green "Login" submit button (`#059669` / `#00A35C` style).

### 2. Main Dashboard & Navigation (`media_1789105911114.png`, `media_1789105913004.png`)
- **Left Sidebar**:
  - Top: **0N8** / **ON8** branding logo.
  - User profile badge card: Avatar image, User Name (`Oliver Brown`), User Email (`oliver.brown@domain.io`), dropdown chevron with Logout option.
  - **"Compose"** primary button: Green outline rounded button.
  - Section label: `CORE`
  - Navigation items:
    - **Scheduled** (Clock icon, item count badge e.g. `12`, active state with mint/light-green pill background).
    - **Sent** (Paper airplane icon, item count badge e.g. `785`).
- **Main Content Header**:
  - Search input box with magnifying glass icon (`Search`).
  - Filter icon.
  - Refresh / reload button.
- **Email List Rows**:
  - **Scheduled Emails View**:
    - Recipient label (e.g. `To: John Smith`).
    - Schedule badge: Orange/amber rounded badge with clock icon (e.g. `🕒 Tue 9:15:12 AM`).
    - Subject in bold + body snippet (e.g. `Meeting follow-up - Scheduled - Hi John, just wanted to follow up...`).
    - Right side: Star icon (favorite/flag).
  - **Sent Emails View**:
    - Recipient label (e.g. `To: Sarah Wilson`).
    - Status badge: Subtle gray/green rounded badge (`Sent`).
    - Subject in bold + body snippet (e.g. `Re: Project Update - Thanks for the update...`).
    - Right side: Star icon.
  - **States**: Loading skeletons/spinners, empty state illustrations when no records exist, error toasts.

### 3. Compose New Email (`media_1789105916765.png`, `media_1789106354575.png`, `media_1789106356261.png`)
- Back button arrow `← Compose New Email`.
- Top right actions:
  - Attachment icon (paperclip) with count badge (e.g., `📎 1` in green pill).
  - Schedule timer icon (clock).
  - Action button: Displays **"Send Later"** or **"Send"** (green outline pill button).
- Fields:
  - **From**: User's email dropdown pill (e.g. `oliver.brown@domain.io ⌄`).
  - **To**:
    - Supports single recipient or list of uploaded leads.
    - Right-aligned **"↑ Upload List"** green upload action button.
    - Tag pills for parsed emails: Rounded green pills (e.g. `tame@jmail.com`, `lame@jmail.com`, `dame@jmail.com`) plus overflow counter pill (e.g. `+4`).
  - **Subject**: Email subject input field.
  - **Throttling / Rate Limits**:
    - **Delay between 2 emails**: Input field `[ 00 ]` (in seconds).
    - **Hourly Limit**: Input field `[ 00 ]`.
  - **Rich Text Editor**:
    - Toolbar: Undo, Redo, Font styling, Bold, Italic, Underline, Alignment, Ordered/Unordered list, Indents, Quote, Link/Flag, Strikethrough.
    - Message body area with placeholder `Type Your Reply...`.
    - Inline image / attachment previews rendered below the text editor.
- **Send Later Popover**:
  - Date & Time picker: `Pick date & time` input with calendar icon.
  - Quick presets: "Tomorrow", "Tomorrow, 10:00 AM", "Tomorrow, 11:00 AM", "Tomorrow, 3:00 PM".
  - Actions: "Cancel" text button, "Done" green outline button.

### 4. Email Detail View (`media_1789105914987.png`)
- Top bar with back arrow, Subject title, MJWY reference/tracking ID, star icon, archive icon, delete icon, profile avatar.
- Sender metadata: Avatar, Sender Name & email (`Amanda Clark <sender@example.com>`), `to me ⌄`, date/time timestamp.
- Full rendered HTML/text message body.
- Attachment preview cards with filename, size, and thumbnails.

---

## ⚙️ Backend & Architecture Requirements
1. **BullMQ + Redis Job Queue**:
   - Jobs are scheduled for specific execution times (`delay` / timestamp calculation).
   - Rate limiting and throttling respect "delay between 2 emails" and "hourly limit".
   - Persistence: Redis queue preserves jobs across server crashes and restarts without re-sending or dropping jobs.
2. **Ethereal Email (SMTP)**:
   - Uses Nodemailer with Ethereal test accounts to simulate real SMTP delivery.
   - Provides preview URLs for generated emails.
3. **APIs**:
   - `POST /api/emails/schedule`: Submit email, lead list (or CSV), delay, hourly limit, scheduled time.
   - `GET /api/emails/scheduled`: Fetch pending/delayed jobs with status.
   - `GET /api/emails/sent`: Fetch completed/failed sent emails.
   - `GET /api/emails/:id`: Fetch specific email detail.
   - `GET /api/auth/google`, `/api/auth/callback`: Google OAuth flow & session/JWT.
   - `GET /api/auth/me`: Current user info.

---

## 📋 Submission Guidelines & Checklist

1. **Repository Setup**:
   - Private GitHub repository (monorepo with `backend/` and `frontend/` directories).
   - Collaborator access granted to: `Mitrajit` and `Yadav036`.

2. **README Documentation**:
   - Step-by-step instructions to run backend (Express, Redis, DB, BullMQ worker).
   - Step-by-step instructions to run frontend.
   - Guide to set up Ethereal Email and `.env` variables.
   - Architecture overview:
     - Scheduling mechanism (BullMQ + Redis).
     - Persistence on restart (jobs survive server restarts).
     - Rate limiting & concurrency implementation (handling delays between emails and hourly limits).
   - Feature mapping checklist:
     - Backend: scheduler, persistence, rate limiting, concurrency.
     - Frontend: Google login, dashboard, compose, tables, loading/empty states, toasts.
   - Assumptions, shortcuts, and trade-offs made during development.

3. **Demo Video (Max 5 minutes)**:
   - Creating scheduled emails (from UI and/or API).
   - Dashboard walkthrough: Scheduled Emails and Sent Emails views.
   - Server restart test scenario:
     - Stop backend server -> restart -> verify future scheduled emails still execute and send.
   - (Bonus) Rate limiting / delay behavior demonstration under load.

