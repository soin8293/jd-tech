const admin = require('firebase-admin');

// Initialize Firebase Admin SDK using default credentials or environment variables
// This works with Firebase CLI authentication
admin.initializeApp({
  projectId: 'jd-suites-backend'
});

const db = admin.firestore();

// Room data with Unsplash images (same as your fallback data)
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
    images: ["https://images.unsplash.com/photo-1466442929976-97f336a657be?w=800&h=600&fit=crop"],
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
    images: ["https://images.unsplash.com/photo-1426604966848-d7adac402bff?w=800&h=600&fit=crop"],
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
    images: ["https://images.unsplash.com/photo-1482938289607-e9573fc25ebb?w=800&h=600&fit=crop"],
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
    images: ["https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?w=800&h=600&fit=crop"],
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
    images: ["https://images.unsplash.com/photo-1485833077593-4278bba3f11f?w=800&h=600&fit=crop"],
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
    images: ["https://images.unsplash.com/photo-1426604966848-d7adac402bff?w=800&h=600&fit=crop"],
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
    images: ["https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?w=800&h=600&fit=crop"],
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
    images: ["https://images.unsplash.com/photo-1482938289607-e9573fc25ebb?w=800&h=600&fit=crop"],
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
    images: ["https://images.unsplash.com/photo-1426604966848-d7adac402bff?w=800&h=600&fit=crop"],
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
    images: ["https://images.unsplash.com/photo-1485833077593-4278bba3f11f?w=800&h=600&fit=crop"],
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
    images: ["https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?w=800&h=600&fit=crop"],
    availability: true,
    bookings: []
  }
];

async function populateRooms() {
  console.log('🏨 Starting to populate rooms collection...');
  console.log(`📊 Project ID: jd-suites-backend`);
  console.log(`📊 Total rooms to add: ${rooms.length}`);
  
  try {
    // Check if collection already exists
    const existingRooms = await db.collection('rooms').get();
    if (!existingRooms.empty) {
      console.log(`⚠️  Found ${existingRooms.size} existing rooms in the database.`);
      console.log(`🛑 STOPPING: Database already has room data. This script is for initial setup only.`);
      console.log(`💡 To avoid data loss, this script will not overwrite existing rooms.`);
      console.log(`💡 If you need to update rooms, use the admin interface or create a separate update script.`);
      return;
    }

    const batch = db.batch();
    
    rooms.forEach((room, index) => {
      const roomRef = db.collection('rooms').doc(room.id);
      // Remove the id field from the document data since it's used as the document ID
      const { id, ...roomData } = room;
      batch.set(roomRef, roomData);
      console.log(`📝 Queued: ${index + 1}/${rooms.length} - ${room.name}`);
    });
    
    console.log('💾 Committing batch write to Firestore...');
    await batch.commit();
    console.log(`✅ Successfully added ${rooms.length} rooms to Firestore!`);
    
    // Verify the data was added correctly
    console.log('\n🔍 Verifying room data...');
    const roomsSnapshot = await db.collection('rooms').get();
    console.log(`✅ Found ${roomsSnapshot.size} rooms in the collection.`);
    
    console.log('\n📋 Room Summary:');
    roomsSnapshot.forEach(doc => {
      const data = doc.data();
      console.log(`  • ${doc.id}: ${data.name} ($${data.price}/night, ${data.capacity} guests)`);
    });
    
    console.log('\n🎉 Room population completed successfully!');
    console.log('🔄 Your app should now show live data instead of demo data.');
    
  } catch (error) {
    console.error('❌ Error populating rooms:', error);
    console.error('💡 Make sure you are authenticated with Firebase CLI');
    console.error('💡 Run: firebase login');
  } finally {
    console.log('\n🔌 Disconnecting from Firebase...');
    admin.app().delete();
  }
}

// Run the script
populateRooms();