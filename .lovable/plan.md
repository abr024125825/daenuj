
# Comprehensive Fix & Feature Implementation Plan

## Current State Analysis

After thorough inspection, here's what IS and ISN'T working:

### What EXISTS (in code):
- `psychologist` role in DB enum and AuthContext
- `PsychologistDashboard.tsx` component (with `require()` bug)
- `PsychSessionTemplates.tsx` and `psychSessionTemplates.ts` (templates/snippets/export)
- `create-coordinator` edge function (supports all roles)
- All psych DB tables exist (profiles, sessions, assessments, treatment_plans, etc.)
- 20 faculties and 82 majors already seeded
- Demo accounts still showing in LoginForm

### What's MISSING:
- **No psych profile pages** (`src/pages/psych/` directory is empty)
- **No `usePsychologicalProfiles.ts` hook** (file not found)
- **No psych routes in App.tsx** (no `/dashboard/psych-profiles` route)
- **No PsychAccessGate** (password protection for clinical module)
- **Demo accounts still visible** in LoginForm
- **`require()` bug** in PsychologistDashboard line 161 (won't work in Vite/ESM)
- **No psych admin statistics** panel
- **No psychologist account creator** in Settings

---

## Implementation Plan (7 Steps)

### Step 1: Remove Demo Accounts from Login Page
- Remove the entire Demo Accounts collapsible section from `LoginForm.tsx` (lines 145-201)
- Remove unused state variables (`isCreatingDemo`, `showDemoInfo`) and functions (`handleCreateDemoAccounts`, `fillDemoCredentials`)
- Remove the `supabase` and `Collapsible` imports that become unused

### Step 2: Create Psych Access Gate (Password Protection)
- Create `src/pages/psych/PsychAccessGate.tsx`
- Renders a password input screen before accessing clinical data
- Uses `system_settings` table to store/verify the clinical access password
- Password is set once and can only be changed from admin Settings page
- Once authenticated in a session, stores access in sessionStorage

### Step 3: Create `usePsychologicalProfiles` Hook
- Create `src/hooks/usePsychologicalProfiles.ts`
- CRUD operations for: psychological_profiles, psychological_sessions, psychological_assessments, treatment_plans, intervention_logs, psychological_attachments
- Search by university_id, student_name, phone
- Audit logging for all modifications

### Step 4: Create Psychological Profile Pages
- Create `src/pages/psych/PsychologicalProfilePage.tsx` -- Full tabbed profile view with 6 tabs:
  1. **Basic Info** -- student details, referral source
  2. **Initial Assessment** -- PHQ-9/GAD-7, risk level, symptoms
  3. **Session Timeline** -- visual timeline of all sessions with add/edit
  4. **Treatment Plan** -- diagnosis, goals, therapeutic approach
  5. **Interventions Log** -- integrated table of all interventions
  6. **Attachments** -- file upload/download with privacy controls
- Integrates session templates and smart snippets from PsychSessionTemplates
- Local export button on each profile

### Step 5: Fix PsychologistDashboard
- Fix the `require()` call on line 161 -- replace with proper ESM import
- Add search bar at the top for finding students
- Show search results and allow navigating to profile pages
- Add anonymous stats overview (total active cases, sessions this month, etc.)

### Step 6: Add Psychologist Account Creator to Admin Settings
- Add a new tab "Psychologists" in `SettingsPage.tsx`
- Reuse the `create-coordinator` edge function with role `psychologist`
- Show list of existing psychologist accounts
- Add psych access password management (set/reset)

### Step 7: Wire Routes in App.tsx
- Add route: `/dashboard/psych-profiles` pointing to PsychAccessGate wrapping a search/list page
- Add route: `/dashboard/psych-profiles/:profileId` pointing to PsychAccessGate wrapping PsychologicalProfilePage

---

## Technical Details

### Files to CREATE:
- `src/pages/psych/PsychAccessGate.tsx` -- Clinical password gate
- `src/pages/psych/PsychologicalProfilePage.tsx` -- Full 6-tab profile
- `src/pages/psych/PsychProfilesPage.tsx` -- Search/list page
- `src/hooks/usePsychologicalProfiles.ts` -- Data hook

### Files to EDIT:
- `src/components/auth/LoginForm.tsx` -- Remove demo accounts
- `src/components/dashboard/PsychologistDashboard.tsx` -- Fix require() bug, add search
- `src/pages/admin/SettingsPage.tsx` -- Add Psychologists tab
- `src/App.tsx` -- Add psych routes

### Database:
- No new tables needed (all psych tables already exist)
- May need to add `system_settings` table for psych access password if not already present

### Security:
- PsychAccessGate blocks all clinical pages behind a password
- All psych tables already have RLS policies restricting to psychologist role
- Audit logging on every profile modification
- Private notes visible only to the creating psychologist
- Local export feature for offline data handling
