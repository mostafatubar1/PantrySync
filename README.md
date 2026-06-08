# PantrySync

PantrySync is an Express, EJS, MongoDB, and session-based MVC web app for pantry tracking, recipe recommendations, shopping-list planning, and a protected admin dashboard.

## Team Responsibilities

- Mostafa: recipe recommendation system, final integration.
- Aly: pantry dashboard and pantry item CRUD.
- Lynne: authentication, sessions, registration/login, profile image upload.
- Theodore: shopping list and recipe-to-shopping integration.
- Ziyad: admin dashboard and safe error handling.

## Setup

1. Install dependencies:

   ```bash
   npm install
   ```

2. Create `.env` from `.env.example`:

   ```text
   PORT=3000
   MONGODB_URI=mongodb://127.0.0.1:27017/pantrysync
   SESSION_SECRET=replace_me
   ADMIN_CODE=replace_me
   SPOONACULAR_API_KEY=
   ```

3. Seed demo data:

   ```bash
   npm run seed
   ```

4. Start the app:

   ```bash
   npm start
   ```

## Demo Accounts

- Admin: `admin@example.com` / `Admin123`
- User: `user@example.com` / `User123`

## Routes

- `GET /` landing page
- `GET /register`, `POST /register`
- `GET /login`, `POST /login`
- `POST /logout`
- `GET /dashboard`
- `GET /api/items`, `POST /api/items`, `PUT/PATCH/DELETE /api/items/:id`
- `GET /api/foods`
- `GET /recipes`
- `GET /recipes/api/recommendations`
- `POST /recipes/api/recommendations`
- `GET /shopping-list`
- `POST /shopping-list/add`
- `POST /shopping-list/:id/update`
- `POST/PATCH /shopping-list/:id/toggle`
- `POST/DELETE /shopping-list/:id/delete`
- `POST /shopping-list/from-recipe`
- `GET /admin`

## Features

- Session authentication with password hashing through `bcryptjs`.
- Owner-scoped pantry item CRUD with category, zone, expiry, price, and notes.
- Profile image upload under ignored `public/uploads/`.
- Pantry-based recipe scoring using matched ingredients, missing ingredients, substitutions, and near-expiry boost.
- Fetch/AJAX recipe recommendation loading without a full page reload.
- Shopping list CRUD with `bought` status and recipe missing-ingredient import.
- Admin dashboard with user, pantry, recipe, shopping, and unbought shopping counts.
- Safe 404/error pages without browser stack traces.

