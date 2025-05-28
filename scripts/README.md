
# JD Suites Room Data Setup

This script populates the Firestore `rooms` collection with the initial 11 room documents for JD Suites.

## Setup Instructions

1. **Download Service Account Key**
   - Go to Firebase Console → Project Settings → Service Accounts
   - Click "Generate new private key"
   - Save the file as `serviceAccountKey.json` in this scripts directory

2. **Install Dependencies**
   ```bash
   cd scripts
   npm install
   ```

3. **Run the Population Script**
   ```bash
   npm run populate
   ```

## What This Script Does

- Creates 11 room documents in the Firestore `rooms` collection
- Each document uses the specified room ID as the document ID
- All fields match the Room TypeScript interface:
  - `name`: Room display name
  - `description`: Room description text
  - `price`: Nightly rate in USD
  - `capacity`: Maximum number of guests
  - `size`: Room size in square feet
  - `bed`: Bed type (King/Queen)
  - `amenities`: Array of room amenities
  - `images`: Array of image paths (placeholders)
  - `availability`: Boolean (all set to true initially)
  - `bookings`: Empty array for future booking periods

## Room Data Overview

The script creates these 11 rooms:
- Denver King Suite ($220/night, 4 guests, King bed)
- Colorado Springs Peak View Room ($200/night, 4 guests, King bed)
- Boulder Flatirons Retreat ($160/night, 2 guests, Queen bed)
- Fort Collins Craft Corner ($150/night, 2 guests, Queen bed)
- Aurora Gateway Room ($145/night, 2 guests, Queen bed)
- Pueblo Historic Charm ($130/night, 2 guests, Queen bed)
- Vail Alpine Escape ($190/night, 2 guests, Queen bed)
- Aspen Luxury Haven ($210/night, 2 guests, Queen bed)
- Glenwood Springs Sojourn ($165/night, 2 guests, Queen bed)
- Loveland Art Nook ($140/night, 2 guests, Queen bed)
- Durango Railway Rest ($155/night, 2 guests, Queen bed)

## Notes

- Image paths are placeholders pointing to `/images/rooms/` directory
- All rooms are set as available initially
- Bookings arrays are empty and ready for future reservations
- The script includes verification to confirm all data was added correctly
