# TrackWise – what changed

## Run it
1. `cd backend && npm install` (new packages: helmet, express-rate-limit)
2. Make sure `backend/.env` has MONGO_URI, JWT_SECRET (long + random), ADMIN_USERNAME, ADMIN_PASSWORD
3. `npm run seed:admin` (first time) or `node seedAdmin.js --reset` to reset the admin password
4. `node server.js`, then in the project root `npm install && npm run dev`

## Flow
Admin: Courses & Subjects -> Mentors & Mentees -> Student Assignment.
Mentor: opens a student, picks a subject, enters marks / attendance.
Mentee: sees everything for their own record.
CGPA, overall attendance and risk status are calculated automatically (10-point scale:
O=10, A+=9, A=8, B+=7, B=6, C=5, F=0, weighted by subject credits; at risk = CGPA < 6.5,
attendance < 75% overall or in any subject, or any backlog). Change scale in backend/utils/metrics.js.

## Security fixes
- NoSQL-injection protection on all input; ObjectId validation on every :id route
- Login: case-insensitive username, one generic error (no user/role enumeration), constant-time
  check, 20 failed attempts / 15 min / IP rate limit; JWT pinned to HS256
- Every request re-checks the user in the database (deleted users lose access immediately; role
  is never trusted from the token)
- helmet headers, CORS limited to FRONTEND_URL (+ localhost in dev), 100kb body limit,
  global rate limit, no stack/error details leaked, /api/protected test route removed
- Server refuses to start without a strong JWT_SECRET
- Public registration closed (ALLOW_PUBLIC_REGISTER=true to reopen); password min 8 chars
- Mentors can only touch their own students; marks/attendance only for catalog subjects;
  mentor notes are never sent to mentees; mentees only see their own alerts/meetings;
  batch comparison is anonymous (needs 3+ students)
- Mentee logout now really clears the session; CSV exports are protected against formula injection

## Now working (was static/fake before)
Student profile tabs, notes, export, credits, backlogs, risk flags, meeting history;
mentor dashboard numbers/tasks/alerts; all mentee pages (attendance, CGPA tracker, targets,
batch comparison, alerts + meetings, profile); meetings export; At-Risk list (risk was never calculated before).
