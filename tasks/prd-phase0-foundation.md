# PRD: Phase 0 - Application Foundation

## Introduction

Phase 0 establishes the complete foundational infrastructure for the CVMBS Research Day platform. This includes authentication via magic links, user profile management with role-based access, the application shell/layout, and scaffolded routes for all future features. This phase creates the skeleton that all subsequent features will build upon.

**Note:** This phase does NOT include event creation, submission workflows, or scoring functionality - those are separate phases.

## Goals

- Implement secure magic link authentication via Supabase Auth
- Create a profile completion flow capturing all required user information
- Establish role-based access control for 5 user types
- Build a responsive navigation shell with role-appropriate menus
- Scaffold all application routes (pages can be placeholder/stubbed)
- Create admin scaffolding for future data management features

## User Roles

| Role | Description | Access Level |
|------|-------------|--------------|
| **Admin** | Full system access, manages all data and users | Highest |
| **Coordinator** | Event coordination, can manage submissions and judges | High |
| **Judge** | Reviews and scores assigned submissions | Medium |
| **Presenter** | Submits abstracts and views own submissions | Medium |
| **Viewer** | Read-only access to public content | Lowest |

## Profile Field Definitions

### Departments (Required)
Predefined dropdown with "Other" option:
| Value | Notes |
|-------|-------|
| Biomedical Sciences | BMS |
| Clinical Sciences | CS |
| Environmental & Radiological Health Sciences | ERHS |
| Microbiology, Immunology & Pathology | MIP |
| Other | Shows free-text input field |

### Status (Required)
The user's employment or enrollment category:
| Value | Shows Program Field? |
|-------|---------------------|
| Faculty | No |
| Administrative Staff | No |
| Research Staff | No |
| Postdoc | Yes |
| Graduate Student | Yes |
| Post-Baccalaureate | Yes (limited options) |
| Undergraduate Student | Yes (limited options) |

### Program (Conditional - based on Status)
Only shown when Status is Graduate Student, Post-Baccalaureate, or Undergraduate Student:

| Status | Available Programs |
|--------|-------------------|
| Graduate Student | PhD Trainee, Masters Trainee, DVM Trainee, Combined DVM Trainee |
| Post-Baccalaureate | Post-baccalaureate Trainee |
| Undergraduate Student | Undergraduate Trainee |
| Postdoc | Postdoctoral Fellow (Traditional), Resident, Intern, Post-DVM PhD, Post-DVM MS |

### Specific Program (Conditional - based on Program)
Third-level dropdown shown for certain programs:

**If Program = "PhD Trainee":**
| Specific Program |
|-----------------|
| Biomedical Sciences |
| Clinical Sciences |
| Environmental Health - Epidemiology |
| Environmental Health - Occupational Health |
| Environmental Health - Industrial Hygiene |
| Radiological Health |
| Toxicology |
| Microbiology |
| Pathology |
| Psychology |
| Animal Sciences |
| Other |

**If Program = "Combined DVM Trainee":**
| Specific Program |
|-----------------|
| DVM/PhD |
| DVM/MBA |
| DVM/MPH |
| DVM/MS |
| DVM/Toxicology |

**If Program = "Masters Trainee":**
| Specific Program |
|-----------------|
| Biomedical Sciences (Thesis) |
| Biomedical Sciences - Anatomy & Physiology (1 Year) |
| Biomedical Sciences - ART |
| Clinical Sciences |
| Environmental Health - Epidemiology |
| Environmental Health - Occupational Ergonomics & Safety |
| Environmental Health - Industrial Hygiene |
| Radiological Health - Health Physics |
| Radiological Health |
| Toxicology (Thesis) |
| Toxicology (1 Year) |
| Microbiology (Thesis) |
| Microbiology (Online) |
| Masters of Public Health |
| Other |

**If Program = "DVM Trainee":** No specific program dropdown

**If Program = "Undergraduate Trainee" or "Post-baccalaureate Trainee":** No specific program dropdown

**If Status = "Postdoc" (Program field serves as the selection):**
| Program |
|---------|
| Postdoctoral Fellow (Traditional) |
| Resident |
| Intern |
| Post-DVM PhD |
| Post-DVM MS |

### Profile Field Summary

| Field | Type | Required | Conditional On |
|-------|------|----------|----------------|
| First Name | text | Yes | - |
| Last Name | text | Yes | - |
| Preferred Email | email | Yes | - |
| Department | select | Yes | - |
| Department (Other) | text | Yes | Department = "Other" |
| Status | select | Yes | - |
| Program | select | Yes | Status is trainee type |
| Specific Program | select | Yes | Program requires it |
| Bio | textarea (500 chars) | No | - |
| Profile Photo | image upload | No | - |

## User Stories

### US-001: Magic Link Login Page
**Description:** As a visitor, I want to log in using my email address so that I don't need to remember a password.

**Acceptance Criteria:**
- [ ] Login page at `/login` with email input field
- [ ] "Send Magic Link" button triggers Supabase auth email
- [ ] Loading state shown while email is sending
- [ ] Success message: "Check your email for a login link"
- [ ] Error handling for invalid emails or rate limits
- [ ] Link to return to home page
- [ ] Typecheck/lint passes
- [ ] Verify in browser using dev tools

---

### US-002: Auth Callback Handler
**Description:** As a user clicking a magic link, I want to be authenticated and redirected appropriately so that I can access the application.

**Acceptance Criteria:**
- [ ] Callback route at `/auth/callback` handles Supabase auth redirect
- [ ] Extracts and verifies token from URL
- [ ] New users redirected to `/profile/complete`
- [ ] Returning users redirected to `/dashboard`
- [ ] Error handling for expired/invalid links with user-friendly message
- [ ] Typecheck/lint passes

---

### US-003: Profile Completion Flow
**Description:** As a first-time user, I want to complete my profile so that I can participate in Research Day.

**Acceptance Criteria:**
- [ ] Profile completion page at `/profile/complete`
- [ ] Required fields: First Name, Last Name, Preferred Email, Department, Status
- [ ] Department dropdown: Biomedical Sciences, Clinical Sciences, ERHS, MIP, Other
- [ ] Selecting "Other" department reveals a free-text input
- [ ] Status dropdown: Faculty, Administrative Staff, Research Staff, Postdoc, Graduate Student, Post-Baccalaureate, Undergraduate Student
- [ ] **Cascading dropdown:** Selecting a trainee Status (Graduate Student, Post-Baccalaureate, Undergraduate Student) reveals Program dropdown with appropriate options
- [ ] **Cascading dropdown:** Selecting PhD Trainee or Combined DVM Trainee reveals Specific Program dropdown
- [ ] Role dropdown with options: Presenter, Judge, Viewer (Admin/Coordinator assigned by admins only)
- [ ] Optional fields: Bio (textarea, max 500 chars), Profile Photo (image upload)
- [ ] Profile photo: max 2MB, JPEG/PNG only, recommended 400x400px
- [ ] Photo upload to Supabase Storage bucket `avatars` with preview before submit
- [ ] Form validation with inline error messages
- [ ] Submit saves to `profiles` table and redirects to `/dashboard`
- [ ] Typecheck/lint passes
- [ ] Verify in browser using dev tools

---

### US-004: Profile Edit Page
**Description:** As a logged-in user, I want to edit my profile information so that I can keep it up to date.

**Acceptance Criteria:**
- [ ] Profile edit page at `/profile`
- [ ] Pre-populated with current profile data
- [ ] Same fields as profile completion (except role changes require admin)
- [ ] Save button updates `profiles` table
- [ ] Success toast notification on save
- [ ] Cancel button returns to previous page
- [ ] Typecheck/lint passes
- [ ] Verify in browser using dev tools

---

### US-005: Application Layout Shell
**Description:** As a user, I want a consistent navigation layout so that I can easily move between sections of the app.

**Acceptance Criteria:**
- [ ] Root layout with header, main content area, and footer
- [ ] Header contains: Logo/title, navigation links, user menu (when logged in)
- [ ] User menu shows: Profile link, role badge, Logout button
- [ ] Navigation links vary by role (see role-based navigation below)
- [ ] Responsive design: hamburger menu on mobile
- [ ] Footer with copyright and relevant links
- [ ] Typecheck/lint passes
- [ ] Verify in browser using dev tools

---

### US-006: Role-Based Navigation
**Description:** As a user, I want to see only the navigation options relevant to my role so that the interface isn't cluttered.

**Acceptance Criteria:**
- [ ] Navigation renders different links based on user role
- [ ] **Viewer:** Home, Schedule, Abstracts
- [ ] **Presenter:** Home, My Submissions, Schedule, Abstracts
- [ ] **Judge:** Home, My Assignments, Schedule, Abstracts
- [ ] **Coordinator:** Home, Submissions, Judges, Schedule, Abstracts, Reports
- [ ] **Admin:** All Coordinator links + Users, Settings, Events
- [ ] Unauthorized route access shows 403 page or redirects
- [ ] Typecheck/lint passes

---

### US-007: Dashboard Page
**Description:** As a logged-in user, I want a dashboard that shows me relevant information for my role.

**Acceptance Criteria:**
- [ ] Dashboard page at `/dashboard`
- [ ] Shows personalized greeting with user's name
- [ ] Displays role-specific quick actions/cards (stubbed content OK)
- [ ] Presenter: "Submit Abstract" card, "My Submissions" summary
- [ ] Judge: "My Assignments" card, scoring summary
- [ ] Coordinator/Admin: Overview stats cards (stubbed)
- [ ] Typecheck/lint passes
- [ ] Verify in browser using dev tools

---

### US-008: Logout Functionality
**Description:** As a logged-in user, I want to log out so that I can secure my session.

**Acceptance Criteria:**
- [ ] Logout button in user menu
- [ ] Clicking logout calls Supabase signOut
- [ ] Clears local session/cookies
- [ ] Redirects to home page
- [ ] Shows success message or toast
- [ ] Typecheck/lint passes

---

### US-009: Protected Route Middleware
**Description:** As a developer, I need middleware that protects routes based on authentication and role so that unauthorized access is prevented.

**Acceptance Criteria:**
- [ ] Middleware checks auth status on protected routes
- [ ] Unauthenticated users redirected to `/login`
- [ ] Role-based route protection (e.g., `/admin/*` requires Admin role)
- [ ] Middleware runs on edge for performance
- [ ] Configuration allows specifying public vs protected routes
- [ ] Typecheck/lint passes

---

### US-010: Stub All Application Routes
**Description:** As a developer, I want all future routes scaffolded so that the application structure is clear and navigation works.

**Acceptance Criteria:**
- [ ] Create route files for all pages (content can be placeholder)
- [ ] Each stub page shows: Page title, "Coming Soon" or similar message, breadcrumb
- [ ] Routes to scaffold:
  - `/` - Home (public)
  - `/login` - Login page (public)
  - `/auth/callback` - Auth handler
  - `/dashboard` - User dashboard
  - `/profile` - Edit profile
  - `/profile/complete` - First-time profile setup
  - `/submit` - Abstract submission (Presenter)
  - `/submissions` - View all submissions (Coordinator/Admin)
  - `/submissions/[id]` - Single submission detail
  - `/my-submissions` - User's own submissions (Presenter)
  - `/judges` - Judge management (Coordinator/Admin)
  - `/my-assignments` - Judge's assigned submissions (Judge)
  - `/scoring/[id]` - Score a submission (Judge)
  - `/schedule` - Event schedule (public)
  - `/abstracts` - Published abstracts (public)
  - `/abstracts/[id]` - Single abstract detail (public)
  - `/admin` - Admin dashboard
  - `/admin/users` - User management
  - `/admin/events` - Event management
  - `/admin/settings` - System settings
  - `/reports` - Reports (Coordinator/Admin)
- [ ] Typecheck/lint passes

---

### US-011: Admin Layout and Navigation
**Description:** As an admin, I want a dedicated admin section with its own layout so that administrative tasks are clearly separated.

**Acceptance Criteria:**
- [ ] Admin routes under `/admin/*` use admin layout
- [ ] Admin layout has sidebar navigation
- [ ] Sidebar links: Dashboard, Users, Events, Settings
- [ ] Breadcrumb showing current location
- [ ] Only accessible to Admin role
- [ ] Typecheck/lint passes
- [ ] Verify in browser using dev tools

---

### US-012: User Management Scaffold (Admin)
**Description:** As an admin, I want a user management page so that I can view and manage platform users.

**Acceptance Criteria:**
- [ ] User list page at `/admin/users`
- [ ] Table displaying: Name, Email, Role, Status, Department, Program, Created Date
- [ ] Placeholder for future features: Edit role, Deactivate user
- [ ] Search/filter UI (can be non-functional stub)
- [ ] Typecheck/lint passes
- [ ] Verify in browser using dev tools

---

### US-013: Error Pages
**Description:** As a user, I want clear error pages so that I understand when something goes wrong.

**Acceptance Criteria:**
- [ ] Custom 404 page (not found)
- [ ] Custom 403 page (forbidden/unauthorized)
- [ ] Custom 500 page (server error)
- [ ] Each error page has: Error message, suggestion, link to home
- [ ] Consistent styling with app theme
- [ ] Typecheck/lint passes

---

### US-014: Loading States
**Description:** As a user, I want loading indicators so that I know when the app is working.

**Acceptance Criteria:**
- [ ] Create reusable loading spinner component
- [ ] Create skeleton loaders for common UI patterns (cards, tables, forms)
- [ ] Implement Suspense boundaries for route transitions
- [ ] Loading state on auth actions (login, logout)
- [ ] Typecheck/lint passes

---

### US-015: Toast/Notification System
**Description:** As a user, I want toast notifications so that I receive feedback on my actions.

**Acceptance Criteria:**
- [ ] Toast notification component (use shadcn/ui toast)
- [ ] Support for success, error, warning, info variants
- [ ] Auto-dismiss after configurable duration
- [ ] Can be triggered from anywhere in app via hook or context
- [ ] Typecheck/lint passes
- [ ] Verify in browser using dev tools

## Functional Requirements

- **FR-1:** The system must authenticate users via Supabase magic link (email-based, passwordless)
- **FR-2:** The system must require profile completion before accessing protected features
- **FR-3:** The system must store user profiles with: first_name, last_name, preferred_email, department, department_other, status, program, specific_program, role, bio, photo_url
- **FR-4:** The system must support 5 user roles: Admin, Coordinator, Judge, Presenter, Viewer
- **FR-5:** The system must support 7 statuses: Faculty, Administrative Staff, Research Staff, Postdoc, Graduate Student, Post-Baccalaureate, Undergraduate Student
- **FR-5a:** The system must conditionally show Program field based on Status (Graduate Student, Post-Baccalaureate, Undergraduate Student, and Postdoc)
- **FR-5b:** The system must conditionally show Specific Program field for PhD Trainee (12 options), Masters Trainee (15 options), and Combined DVM Trainee (5 options)
- **FR-6:** The system must restrict route access based on user role
- **FR-7:** The system must display role-appropriate navigation to each user
- **FR-8:** The system must allow users to upload profile photos to Supabase Storage (max 2MB, JPEG/PNG, recommended 400x400px)
- **FR-9:** The system must provide a consistent layout shell across all pages
- **FR-10:** The system must handle auth errors gracefully with user-friendly messages
- **FR-11:** The system must redirect unauthenticated users to login when accessing protected routes
- **FR-12:** Admin and Coordinator roles must only be assignable by existing Admins
- **FR-13:** Public pages (Home, Schedule, Abstracts) must be accessible without login (Viewer role does not require auth)
- **FR-14:** Profile photo moderation is performed by Coordinators via the admin/coordinator UI

## Non-Goals (Out of Scope)

- Event creation or management functionality (Phase 1)
- Abstract submission workflow (Phase 2)
- Judge assignment logic (Phase 3)
- Scoring/rubric functionality (Phase 4)
- Email notifications beyond magic link auth
- Social login providers (Google, Microsoft, etc.)
- Password-based authentication
- Two-factor authentication
- User self-deletion
- Dark mode (can be added later)

## Design Considerations

- Use existing shadcn/ui components wherever possible
- Follow CSU brand colors if available, otherwise use professional neutral palette
- Mobile-first responsive design
- Accessible (WCAG 2.1 AA compliance)
- Forms should have clear labels, validation messages, and tab navigation

### Suggested Component Usage
- `Button` - all actions
- `Input` - text fields
- `Select` - dropdowns (role, level)
- `Textarea` - bio field
- `Card` - dashboard widgets
- `Table` - user list
- `Avatar` - profile photos
- `Toast` - notifications
- `DropdownMenu` - user menu
- `Sheet` - mobile navigation

## Technical Considerations

- **Auth:** Use Supabase Auth with `@supabase/ssr` for Next.js App Router
- **Middleware:** Use Next.js middleware for route protection
- **Storage:** Profile photos stored in Supabase Storage bucket `avatars`
- **Database:** Profile data in existing `profiles` table (may need schema updates for new fields)
- **State:** Use React Context for auth state, consider Zustand if complexity grows
- **Types:** Generate TypeScript types from Supabase schema

### Potential Schema Updates Needed
```sql
-- Check if profiles table needs these columns:
-- department (text) - predefined values enforced at app level
-- department_other (text) - free text when department = 'Other'
-- status (text) - Faculty, Administrative Staff, Research Staff, Postdoc, Graduate Student, Post-Baccalaureate, Undergraduate Student
-- program (text, nullable) - PhD Trainee, DVM Trainee, Combined DVM Trainee, Undergraduate Trainee, Post-baccalaureate Trainee
-- specific_program (text, nullable) - e.g., Biomedical Sciences, DVM/PhD, etc.
-- preferred_email (text)
-- bio (text, max 500 chars)
-- photo_url (text)
-- photo_approved (boolean, default false) - moderation flag for coordinators
```

### CSU SSO
No integration planned. Supabase magic link auth is the sole authentication method.

## Success Metrics

- User can complete login flow in under 60 seconds (excluding email delivery time)
- Profile completion form submits successfully with all required fields
- All stubbed routes are accessible and display appropriate placeholder content
- Role-based navigation shows correct links for each role type
- No TypeScript errors or ESLint warnings
- Mobile navigation functions correctly on viewport < 768px

## Resolved Questions

1. **Departments:** Predefined list (BMS, CS, ERHS, MIP) with "Other" free-text option
2. **Photo max size:** 2MB, JPEG/PNG only, recommended 400x400px
3. **Viewer auth:** No login required - public content (Home, Schedule, Abstracts) is open to all
4. **CSU SSO:** Not planned - magic link only
5. **Photo moderation:** Event Coordinators review/approve profile photos

## Open Questions

None at this time - all questions resolved.
