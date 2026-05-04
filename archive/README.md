# Archive

Code that is no longer wired into the app but preserved for reference or potential resurrection. Archived files are not built, linted, or tested.

## Contents

- `projects-[projectId]-dojo-page.tsx` — original `/projects/:projectId/dojo` route. Live-interview UX duplicated by the newer `/projects/:projectId/sub/:subProjectId/simulate` flow. Archived 2026-04-22 during the UI refresh (PR 2).
- `projects-[projectId]-guide-page.tsx` — 25-line redirect shim from `/projects/:projectId/guide` to `/projects/new/guide?projectId=…`. Archived 2026-04-22. The canonical route is `/projects/new/guide`.
