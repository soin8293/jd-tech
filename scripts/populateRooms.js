
const admin = require('firebase-admin');

// Initialize Firebase Admin SDK
// You'll need to set GOOGLE_APPLICATION_CREDENTIALS environment variable
// or provide the path to your service account key file
const serviceAccount = require('../serviceAccountKey.json'); // Download this from Firebase Console

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  projectId: 'jd-suites-backend'
});

const db = admin.firestore();

// Room data matching the Room type interface
const rooms = [
  {
    id: "denver_king_suite",
    name: "Denver King Suite",
    description: "Spacious and modern suite offering stunning city views and a luxurious king-size bed.",
    price: 220,
    capacity: 4,
    size: 550,
    bed: "King",
    amenities: ["WiFi", "Smart TV", "Nespresso Machine", "Mini Bar", "Work Desk", "Rain Shower", "City View"],
    images: ["/images/rooms/denver_king_suite_01.jpg", "/images/rooms/denver_king_suite_02.jpg"],
    availability: true,
    bookings: []
  },
  {
    id: "colorado_springs_peak_view",
    name: "Colorado Springs Peak View Room",
    description: "Elegant room with a king-size bed and breathtaking views of the nearby mountain peaks.",
    price: 200,
    capacity: 4,
    size: 520,
    bed: "King",
    amenities: ["WiFi", "Smart TV", "Coffee Maker", "Mini Fridge", "Seating Area", "Mountain View"],
    images: ["/images/rooms/colorado_springs_peak_view_01.jpg"],
    availability: true,
    bookings: []
  },
  {
    id: "boulder_flatirons_retreat",
    name: "Boulder Flatirons Retreat",
    description: "A comfortable queen-bed room inspired by the natural beauty of Boulder.",
    price: 160,
    capacity: 2,
    size: 380,
    bed: "Queen",
    amenities: ["WiFi", "HDTV", "Coffee Maker", "Eco-Friendly Toiletries"],
    images: ["/images/rooms/boulder_flatirons_retreat_01.jpg"],
    availability: true,
    bookings: []
  },
  {
    id: "fort_collins_craft_corner",
    name: "Fort Collins Craft Corner",
    description: "Cozy queen-bed room with a nod to Fort Collins' vibrant craft culture.",
    price: 150,
    capacity: 2,
    size: 360,
    bed: "Queen",
    amenities: ["WiFi", "HDTV", "Local Coffee Selection", "Mini Fridge"],
    images: ["/images/rooms/fort_collins_craft_corner_01.jpg"],
    availability: true,
    bookings: []
  },
  {
    id: "aurora_gateway_room",
    name: "Aurora Gateway Room",
    description: "A well-appointed room with a comfortable queen bed, perfect for relaxation.",
    price: 145,
    capacity: 2,
    size: 350,
    bed: "Queen",
    amenities: ["WiFi", "HDTV", "Work Desk", "Tea Kettle"],
    images: ["/images/rooms/aurora_gateway_room_01.jpg"],
    availability: true,
    bookings: []
  },
  {
    id: "pueblo_historic_charm",
    name: "Pueblo Historic Charm",
    description: "Experience comfort in this queen-bed room reflecting Pueblo's rich history.",
    price: 130,
    capacity: 2,
    size: 340,
    bed: "Queen",
    amenities: ["WiFi", "HDTV", "Iron & Board", "Hair Dryer"],
    images: ["/images/rooms/pueblo_historic_charm_01.jpg"],
    availability: true,
    bookings: []
  },
  {
    id: "vail_alpine_escape",
    name: "Vail Alpine Escape",
    description: "Chic queen-bed room with alpine-inspired decor, reminiscent of Vail's slopes.",
    price: 190,
    capacity: 2,
    size: 400,
    bed: "Queen",
    amenities: ["WiFi", "Smart TV", "Plush Robes", "Fireplace (Electric)"],
    images: ["/images/rooms/vail_alpine_escape_01.jpg"],
    availability: true,
    bookings: []
  },
  {
    id: "aspen_luxury_haven",
    name: "Aspen Luxury Haven",
    description: "An upscale queen-bed room offering a taste of Aspen's luxurious lifestyle.",
    price: 210,
    capacity: 2,
    size: 420,
    bed: "Queen",
    amenities: ["WiFi", "Smart TV", "Premium Linens", "Mini Bar", "Designer Toiletries"],
    images: ["/images/rooms/aspen_luxury_haven_01.jpg"],
    availability: true,
    bookings: []
  },
  {
    id: "glenwood_springs_sojourn",
    name: "Glenwood Springs Sojourn",
    description: "Relaxing queen-bed room inspired by the soothing hot springs of Glenwood.",
    price: 165,
    capacity: 2,
    size: 370,
    bed: "Queen",
    amenities: ["WiFi", "HDTV", "Spa-Inspired Bath Products", "Yoga Mat"],
    images: ["/images/rooms/glenwood_springs_sojourn_01.jpg"],
    availability: true,
    bookings: []
  },
  {
    id: "loveland_art_nook",
    name: "Loveland Art Nook",
    description: "A charming queen-bed room celebrating Loveland's artistic spirit.",
    price: 140,
    capacity: 2,
    size: 355,
    bed: "Queen",
    amenities: ["WiFi", "HDTV", "Art Supplies (Sketchpad & Pencils)", "Reading Lamp"],
    images: ["/images/rooms/loveland_art_nook_01.jpg"],
    availability: true,
    bookings: []
  },
  {
    id: "durango_railway_rest",
    name: "Durango Railway Rest",
    description: "A cozy queen-bed room with decor inspired by Durango's historic railway.",
    price: 155,
    capacity: 2,
    size: 365,
    bed: "Queen",
    amenities: ["WiFi", "HDTV", "Vintage Alarm Clock", "Local Guidebooks"],
    images: ["/images/rooms/durango_railway_rest_01.jpg"],
    availability: true,
    bookings: []
  }
];

async function populateRooms() {
  console.log('Starting to populate rooms collection...');
  
  try {
    const batch = db.batch();
    
    rooms.forEach(room => {
      const roomRef = db.collection('rooms').doc(room.id);
      // Remove the id field from the document data since it's used as the document ID
      const { id, ...roomData } = room;
      batch.set(roomRef, roomData);
    });
    
    await batch.commit();
    console.log(`Successfully added ${rooms.length} rooms to Firestore!`);
    
    // Verify the data was added correctly
    console.log('\nVerifying room data...');
    const roomsSnapshot = await db.collection('rooms').get();
    console.log(`Found ${roomsSnapshot.size} rooms in the collection.`);
    
    roomsSnapshot.forEach(doc => {
      const data = doc.data();
      console.log(`- ${doc.id}: ${data.name} ($${data.price}/night, ${data.capacity} guests)`);
    });
    
  } catch (error) {
    console.error('Error populating rooms:', error);
  } finally {
    console.log('Disconnecting from Firebase...');
    admin.app().delete();
  }
}

// Run the script
populateRooms();
