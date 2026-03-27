# Live
https://tracking-application-ui.vercel.app/

# Bag Tracking App

A responsive front-end web application to register users, add and track bags, and manage account data with realistic loading and status progress behavior.

## Project Files

- `code.html` - Main HTML shell
- `style.css` - Custom styles and animations
- `app.js` - Full app logic, rendering, state, and localStorage persistence
- `icons8-bag-48.png` - App icon

## Tech Stack

- HTML5
- Tailwind CSS (CDN)
- Vanilla JavaScript
- Custom CSS animations
- Ant Design icons (via Iconify CDN)
- Browser localStorage (no backend required)

## Key Features

### 1. Authentication

- Register with required fields:
  - Full Name
  - Mobile Number
  - Gender
  - Email
  - Password
- Login with email and password
- Loading states for Login/Register with spinner
- Session persistence across refresh

### 2. Add New Bag

- All fields required:
  - Bag Name
  - Brand
  - Color
  - Destination
  - Tracking ID
  - Bag Image
- Image preview before submit
- Duplicate tracking ID prevention
- Add action includes loading state
- Newly added bag appears immediately in "Your Bags"
- New bag card entry animation

### 3. Track Bag

- Search by Tracking ID
- Shows details if found:
  - Bag info
  - Current location
  - Destination
  - Status badge
  - Timeline events
- "Not found" state for invalid IDs
- Tracking action includes loading state

### 4. Step-by-Step Status Flow (Strict)

Status transitions are enforced in one direction only:

`Processing -> In Transit -> Delivered`

Rules:
- Cannot jump directly to Delivered
- Cannot move backward
- Transition buttons disable automatically when not allowed
- Status updates show loading feedback

### 5. Animated Progress UI

- Marketplace-style tracking progress section
- Animated current-step pulse
- Live update indicator with loading icon
- Shimmer progress effect

### 6. Bag Management

- Delete individual bag (with confirmation)
- Clear all current user's bags (with confirmation)
- Clear tracking search result

### 7. Profile and Account Deletion

- Profile section displays:
  - Name
  - Email
  - Mobile
  - Gender
- Delete Account button in profile
- Confirmation prompt before deletion
- On confirm:
  - User removed from localStorage users
  - User bags removed from localStorage bags
  - Session removed
  - Redirect to login screen

## localStorage Keys

The app stores data using these keys:

- `trackingApp.session`
- `trackingApp.bags`
- `trackingApp.users`
- `trackingApp.authMode`

## How the App Works

1. App loads from localStorage.
2. If first run, default demo data is seeded.
3. UI renders based on session state:
   - No session -> Auth screen
   - Logged in -> Dashboard
4. User actions update in-memory state.
5. Changes are persisted to localStorage.
6. UI re-renders after each state change.

## Run Locally

Because this is a static app, no build step is required.

### Option 1: Open directly

- Open `code.html` in your browser.

### Option 2: Use VS Code Live Server (recommended)

1. Install Live Server extension in VS Code.
2. Right-click `code.html`.
3. Click **Open with Live Server**.

## Default Demo Account

If localStorage is clean, a demo account is seeded:

- Email: `demo@tracking.local`
- Password: `demo1234`

## Validation and UX Notes

- Required field checks are enforced in UI and JavaScript.
- Important actions include loading states to prevent double clicks.
- Confirmation modal is used for destructive actions.
- App is fully client-side and intended for learning/demo purposes.

## Future Improvements

- Add backend/API for real shipment data
- Add admin panel for multi-user management
- Add OTP/email verification
- Add role-based access control
- Add export/import for user bag history

## License

This project is for educational/demo use.
