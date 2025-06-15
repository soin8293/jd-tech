import { onCall, HttpsError } from "firebase-functions/v2/https";
import * as admin from "firebase-admin";
import { asyncHandler } from "../utils/asyncHandler";
import { logger } from "../utils/logger";

const seedDatabaseHandler = async (request: any) => {
  logger.info("Starting database seeding operation");

  const db = admin.firestore();
  
  try {
    // Check if rooms collection already has data
    const existingRooms = await db.collection('rooms').get();
    if (!existingRooms.empty) {
      logger.info(`Found ${existingRooms.size} existing rooms, skipping seed`);
      return {
        success: false,
        message: `Database already contains ${existingRooms.size} rooms. Seeding skipped to prevent data loss.`,
        roomCount: existingRooms.size
      };
    }

    const batch = db.batch();
    const roomsCollection = db.collection("rooms");
    
    // The same room data from the populate script
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

    rooms.forEach(room => {
      const { id, ...roomData } = room;
      const docRef = roomsCollection.doc(id);
      batch.set(docRef, roomData);
    });

    await batch.commit();
    
    logger.info(`Successfully seeded ${rooms.length} rooms to database`);
    
    return { 
      success: true, 
      message: `Successfully seeded ${rooms.length} rooms to the database.`,
      roomCount: rooms.length
    };
  } catch (error: any) {
    logger.error("Error seeding database", error);
    throw new HttpsError("internal", "Failed to seed database.");
  }
};

export const seedDatabase = onCall(
  asyncHandler(seedDatabaseHandler, 'seedDatabase')
);