---
Task ID: 1
Agent: Main Agent
Task: Implement admin/crew role-based access control system

Work Log:
- Read full project state: page.tsx (~1350 lines), api.ts, db.ts, schema.prisma, layout.tsx, globals.css
- Created .env with ADMIN_PASSWORD=strawhats2024 and CREW_PASSWORD=crew2024
- Created src/middleware.ts: intercepts all routes, redirects unauthenticated users to /login, passes role in x-crew-role header
- Created src/app/api/auth/route.ts: POST validates password (SHA-256+salt) against both ADMIN_PASSWORD and CREW_PASSWORD, sets httpOnly cookie with role; DELETE clears cookie
- Created src/app/api/auth/me/route.ts: GET returns current role from cookie
- Created src/app/login/page.tsx: claymorphism-styled login page with password field, show/hide toggle, error display, loading state
- Updated src/app/page.tsx: added role state + fetchRole on mount, isAdmin boolean, Crown/Shield role badges in hero + footer
  - Passed isAdmin prop to TripsView, MembersView, ExpensesView, TripDetailDialog
  - Wrapped all admin dialogs (CreateTrip, AddMember, AddExpense, AddItinerary) in {isAdmin && ...}
  - Hidden admin buttons: New Voyage, Add Member, Add Expense, Delete Trip, Delete Member, Delete Expense, Delete Itinerary, Reset Data
  - Kept RSVP "Change" buttons visible for all roles
  - Added Logout button in footer for all roles
- E2E verified with agent-browser:
  - Admin login (strawhats2024) → sees all buttons (New Voyage, Add Member, delete buttons, Reset Data, Captain badge)
  - Crew login (crew2024) → NO admin buttons visible, can still view all data and change RSVP
  - Both roles can logout via Lock button

Stage Summary:
- Dual-password auth system: admin password → full access, crew password → read-only + RSVP
- All CRUD operations hidden from crew members
- Role indicator (Captain/Crew) shown in hero section and footer
- Login page with error handling and loading state
- Middleware protects all routes except /login and /api/auth