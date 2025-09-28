# StudyConnect File Categorization

This document categorizes all files in the StudyConnect project into three main groups:
1. **Important Connected Files**: Core files that are essential for the application to function. These are interconnected and form the backbone of the app (e.g., routing, authentication, database operations, UI components). Removing or breaking these would cause the app to fail.
2. **Helper/Support Files**: Files that assist in development, configuration, deployment, or maintenance but are not directly part of the runtime execution. They include configs, schemas, documentation, and utilities that can be modified or removed without breaking core functionality (though it might affect development/deploy).
3. **Namespace/Placeholder Files**: Files used for organization, Git management, or to maintain directory structure (e.g., empty folders). These are non-functional and primarily for project hygiene.

The categorization is based on the project's structure, dependencies, and usage patterns. Files are listed with brief explanations of their role and connections.

## 1. Important Connected Files
These files are runtime-critical and interconnected. They handle user interactions, data flow, authentication, and rendering. Most are in `src/` and directly imported/used by other core files.

### Core Layout and Routing (Next.js App Router)
- `src/app/layout.tsx`: Root layout wrapping all pages with SupabaseProvider, globals.css, and metadata. Connected to: All pages in `src/app/`, `src/components/providers/SupabaseProvider.tsx`.
- `src/app/page.tsx`: Home page component. Connected to: `src/components/HeaderWithPoints.tsx`, UI components like `button.tsx`, `card.tsx`.
- `src/app/page-with-points.tsx`: Alternative home page with points integration. Connected to: Similar to `page.tsx`, plus `src/lib/points.ts`.
- `src/app/globals.css`: Global Tailwind styles. Connected to: All components and pages via layout.tsx.

### Authentication Pages and Logic
- `src/app/auth/layout.tsx`: Auth-specific layout. Connected to: Auth pages below.
- `src/app/auth/signin/page.tsx`: Sign-in form. Connected to: `src/lib/auth.ts` (signIn function).
- `src/app/auth/signup/page.tsx`: Sign-up form. Connected to: `src/lib/auth.ts` (signUp function).
- `src/app/auth/callback/page.tsx`: OAuth callback handler. Connected to: Supabase auth redirects.
- `src/lib/auth.ts`: Authentication utilities (signUp, signIn, signOut, etc.). Connected to: All auth pages, Supabase client (`src/lib/supabase.ts`), profiles table in DB.

### Q&A System Pages and APIs
- `src/app/questions/layout.tsx`: Questions layout. Connected to: Questions pages.
- `src/app/questions/page.tsx`: Questions list. Connected to: API `/api/questions` (not shown, but implied), `src/lib/supabase.ts`.
- `src/app/questions/page-with-points.tsx`: Points-enabled questions page. Connected to: `src/lib/points.ts`.
- `src/app/questions/[id]/page.tsx`: Single question view. Connected to: Question/answer DB queries.
- `src/app/ask/layout.tsx`: Ask question layout.
- `src/app/ask/page.tsx`: Ask question form. Connected to: Question creation API.
- `src/app/ask/page-with-points.tsx`: Points-enabled ask page.

### Groups System Pages and APIs
- `src/app/groups/page.tsx`: Groups list. Connected to: `/api/groups/route.ts`.
- `src/app/groups/[id]/page.tsx`: Single group view. Connected to: `/api/groups/[id]/route.ts`, `src/lib/groupsDatabase.ts`.
- `src/app/api/groups/route.ts`: Groups CRUD API. Connected to: `src/lib/groupsDatabase.ts`, Supabase.
- `src/app/api/groups/[id]/route.ts`: Single group operations. Connected to: `src/lib/groupsDatabase.ts`.
- `src/app/api/groups/[id]/join/route.ts`: Join group API. Connected to: `src/lib/groupsDatabase.ts` (joinGroup).
- `src/app/api/groups/[id]/leave/route.ts`: Leave group API.
- `src/app/api/groups/[id]/members/route.ts`: Members list API.
- `src/app/api/groups/[id]/messages/route.ts`: Messages API. Connected to: Real-time Supabase subscriptions.
- `src/lib/groupsDatabase.ts`: Groups DB utilities (createGroup, getGroups, etc.). Connected to: All groups APIs, Supabase client.

### Gamification and Points
- `src/app/api/points/route.ts`: Points management API (GET/POST). Connected to: `src/lib/supabase.ts`, profiles table.
- `src/app/api/leaderboard/route.ts`: Leaderboard API. Connected to: Profiles query ordered by points.
- `src/lib/points.ts`: Points utilities (awardPoints, getUserPoints). Connected to: Points APIs, components.
- `src/components/PointsDisplay.tsx`: UI for displaying points/rank. Connected to: `src/lib/supabase.ts` (fetch profile), used in Header.
- `src/components/Leaderboard.tsx`: Leaderboard component. Connected to: Leaderboard API.
- `src/components/HeaderWithPoints.tsx`: Header with navigation and points. Connected to: `src/components/PointsDisplay.tsx`, all pages via layout.

### AI and Community APIs
- `src/app/api/ai-answer/route.ts`: AI answer generation (mocked). Connected to: OpenAI package (future), question pages.
- `src/app/api/community-moderation/route.ts`: Moderation API. Connected to: Community DB (`src/lib/communityDatabase.ts`).

### Components and Providers
- `src/components/Header.tsx`: Basic header (alternative to HeaderWithPoints).
- `src/components/providers/SupabaseProvider.tsx`: Supabase context provider. Connected to: `src/lib/supabase.ts`, wraps all pages.
- `src/components/ui/button.tsx`: Reusable button UI. Connected to: Forms and actions across app.
- `src/components/ui/card.tsx`: Reusable card UI. Connected to: Pages like home, questions.
- `src/app/profile/page.tsx`: Profile page. Connected to: `src/lib/auth.ts` (getCurrentUserWithProfile).
- `src/app/profile/SignOutButton.tsx`: Sign-out component. Connected to: `src/lib/auth.ts` (signOut).
- `src/lib/supabase.ts`: Supabase client initialization. Connected to: All DB/auth operations (auth.ts, points.ts, groupsDatabase.ts, etc.).

### Types and Database Types
- `src/types/index.ts`: TypeScript type definitions. Connected to: Components and utilities.
- `src/lib/database.types.ts`: Supabase-generated DB types. Connected to: All Supabase queries.

## 2. Helper/Support Files
These files support development, configuration, testing, or documentation. They are not executed at runtime but are crucial for setup, styling, linting, or deployment.

### Configuration Files
- `next.config.js`: Next.js config (images, env vars). Connected to: Build process.
- `next.config.ts`: TypeScript version of Next.js config (duplicate/alternative).
- `tailwind.config.js`: Tailwind CSS config. Connected to: globals.css, all styled components.
- `postcss.config.js` / `postcss.config.mjs`: PostCSS config for Tailwind.
- `tsconfig.json`: TypeScript config.
- `eslint.config.mjs` / `.eslintrc.json`: ESLint configs (linting rules).
- `package.json`: Dependencies and scripts (dev, build, start). Connected to: npm ecosystem.
- `package-lock.json`: Dependency lock file.

### Database and Migration Files
- `groups_schema.sql`: Core groups schema (tables, RLS, triggers). Used for Supabase setup.
- `supabase_schema.sql`: General Supabase schema.
- `supabase-community-groups-schema.sql`: Community/groups schema variant.
- `database_schema.sql`: Legacy/general DB schema.
- `src/lib/migrations/*.sql`: Migration scripts (e.g., add_group_memberships.sql). Applied to Supabase.
- `setup-schema.js`: Script to set up schema (likely Node.js helper).
- `test-connection.js`: Supabase connection test script.

### Documentation and TODO Files
- `README.md`: Project overview, installation guide.
- `PROJECT_BLACKBOOK.md`: Comprehensive project blueprint (this analysis).
- `DEPLOYMENT_ANALYSIS.md`: Deployment challenges and steps.
- `TODO.md` / `TODO-updated.md` / `TODO-FIXES.md` / `TODO-STYLING.md`: Task lists for improvements.
- `APP-STATUS.md`: App status notes.
- `LICENSE`: MIT license.

### Deployment Configs
- `vercel.json`: Vercel build config (npm install with legacy deps).
- `netlify.toml`: Netlify build/publish config with Next.js plugin.

### Utilities and Libs (Non-Core)
- `src/lib/bookmarks.ts`: Bookmarks functionality (if implemented).
- `src/lib/communityDatabase.ts`: Community DB ops (supporting moderation).
- `src/lib/joinGroup.ts`: Join group utility (wrapper for groupsDatabase.ts).
- `public/*.svg`: Static icons (file.svg, globe.svg, etc.). Used in UI components.

## 3. Namespace/Placeholder Files
These files exist to maintain structure, prevent Git from ignoring empty directories, or serve as placeholders. They have no functional code and can be safely removed or ignored.

- `src/pages/.gitkeep`: Placeholder to keep `src/pages/` in Git (legacy Pages Router dir).
- `src/server/websocket-server.js` / `src/server/websocket-server.ts`: Likely experimental/abandoned WebSocket files (not connected to main app).
- `src/pages/api/ai-answer.ts` / `src/pages/api/community-moderation.ts`: Legacy API files (duplicates of App Router versions; namespace for old structure).
- Empty directories like `src/app/api/groups/[id]/` subdirs (if no code, but here they have routes).

## Summary and Recommendations
- **Total Files**: ~100+ (core ~40, helpers ~30, placeholders ~10).
- **Interconnections**: Core files form a tight graph (e.g., supabase.ts → 20+ files). Helpers are loosely coupled (configs affect build).
- **Cleanup Suggestions**: Remove legacy `src/pages/` if not needed to avoid conflicts. Archive unused migrations. Ensure all schemas are consolidated into one for easier DB setup.
- **Impact of Removal**:
  - Core: App breaks (e.g., remove layout.tsx → no pages render).
  - Helpers: Dev/deploy issues (e.g., no tailwind.config.js → styles fail).
  - Placeholders: No impact, but may affect Git structure.

This categorization helps in understanding project maintenance, refactoring, or onboarding new developers.

## Core Files Summary: Important Connected Files Only

Below is a concise list of all **important connected files** (runtime-critical core files) with their primary connections. These are the files that form the backbone of the application and are interconnected. Removing any would likely break functionality.

### Layout & Routing
- `src/app/layout.tsx` → Wraps all pages with SupabaseProvider, globals.css, metadata
- `src/app/page.tsx` → Home page → HeaderWithPoints, UI components (button, card)
- `src/app/globals.css` → Global Tailwind styles → All components/pages

### Authentication System
- `src/app/auth/signin/page.tsx` → Sign-in form → `src/lib/auth.ts` (signIn)
- `src/app/auth/signup/page.tsx` → Sign-up form → `src/lib/auth.ts` (signUp)
- `src/app/auth/callback/page.tsx` → OAuth callback → Supabase auth redirects
- `src/lib/auth.ts` → Auth utilities (signUp, signIn, signOut) → Supabase client, profiles table, all auth pages

### Q&A System
- `src/app/questions/page.tsx` → Questions list → Supabase queries, API routes
- `src/app/questions/[id]/page.tsx` → Single question view → Question/answer DB queries
- `src/app/ask/page.tsx` → Ask question form → Question creation API

### Groups System
- `src/app/groups/page.tsx` → Groups list → `/api/groups/route.ts`
- `src/app/groups/[id]/page.tsx` → Single group view → `/api/groups/[id]/route.ts`, `src/lib/groupsDatabase.ts`
- `src/app/api/groups/route.ts` → Groups CRUD API → `src/lib/groupsDatabase.ts`, Supabase
- `src/app/api/groups/[id]/route.ts` → Single group ops → `src/lib/groupsDatabase.ts`
- `src/app/api/groups/[id]/join/route.ts` → Join group → `src/lib/groupsDatabase.ts` (joinGroup)
- `src/app/api/groups/[id]/leave/route.ts` → Leave group → `src/lib/groupsDatabase.ts`
- `src/app/api/groups/[id]/members/route.ts` → Members list → `src/lib/groupsDatabase.ts`
- `src/app/api/groups/[id]/messages/route.ts` → Messages API → Real-time Supabase
- `src/lib/groupsDatabase.ts` → Groups DB utils (createGroup, getGroups) → All groups APIs, Supabase client

### Gamification & Points
- `src/app/api/points/route.ts` → Points management (GET/POST) → Supabase, profiles table
- `src/app/api/leaderboard/route.ts` → Leaderboard API → Profiles query by points
- `src/lib/points.ts` → Points utils (awardPoints, getUserPoints) → Points APIs, components
- `src/components/PointsDisplay.tsx` → Points/rank UI → Supabase (fetch profile)
- `src/components/Leaderboard.tsx` → Leaderboard component → Leaderboard API
- `src/components/HeaderWithPoints.tsx` → Header with nav + points → PointsDisplay, all pages

### AI & Community
- `src/app/api/ai-answer/route.ts` → AI answer generation → OpenAI (future), question pages
- `src/app/api/community-moderation/route.ts` → Moderation API → `src/lib/communityDatabase.ts`

### Components & Providers
- `src/components/providers/SupabaseProvider.tsx` → Supabase context → `src/lib/supabase.ts`, wraps all pages
- `src/components/ui/button.tsx` → Reusable button → Forms/actions across app
- `src/components/ui/card.tsx` → Reusable card → Home, questions pages
- `src/app/profile/page.tsx` → Profile page → `src/lib/auth.ts` (getCurrentUserWithProfile)
- `src/app/profile/SignOutButton.tsx` → Sign-out component → `src/lib/auth.ts` (signOut)
- `src/lib/supabase.ts` → Supabase client init → All DB/auth ops (auth.ts, points.ts, groupsDatabase.ts, etc.)
- `src/types/index.ts` → TypeScript types → Components and utilities
- `src/lib/database.types.ts` → Supabase DB types → All Supabase queries

### Connection Graph Overview
- **Central Hub**: `src/lib/supabase.ts` connects to 20+ files for DB/auth operations
- **Auth Flow**: Auth pages → `src/lib/auth.ts` → Supabase → Profiles table
- **Data Flow**: Pages → API routes → Lib utilities → Supabase → Database
- **UI Flow**: Components → Lib functions → API calls → Data rendering
- **Gamification**: PointsDisplay/Header → Points API → Profiles table → Leaderboard

**Total Core Files**: ~40 files that are runtime-critical and interconnected.
