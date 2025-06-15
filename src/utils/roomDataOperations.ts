import { Room } from "@/types/hotel.types";
import { getRooms as fetchRoomsDirectly } from "@/services/room/roomQueries";
import { getRooms as fetchRoomsFromService } from "@/services/room/roomService";
import { notifyError } from "./roomNotifications";
import { getFunctions, httpsCallable } from "firebase/functions";

const functions = getFunctions();

// Fallback room data matching the 11 Colorado-themed rooms
const fallbackRooms: Room[] = [
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

export const fetchRoomData = async (
  setRooms: (rooms: Room[]) => void,
  setError: (error: string | null) => void,
  setUsingLocalData: (value: boolean) => void,
  hasShownLocalDataToast: boolean,
  setHasShownLocalDataToast: (value: boolean) => void
) => {
  console.log("🏨 ROOM DATA DEBUG: Starting fetchRoomData operation");
  console.log("🏨 ROOM DATA DEBUG: Function parameters received");
  console.log("🏨 ROOM DATA DEBUG: hasShownLocalDataToast:", hasShownLocalDataToast);
  
  try {
    console.log("🏨 ROOM DATA DEBUG: Attempting to fetch rooms...");
    
    // First try direct query
    console.log("🏨 ROOM DATA DEBUG: Step 1 - Trying direct Firestore query...");
    const roomsData = await fetchRoomsDirectly();
    console.log("🏨 ROOM DATA DEBUG: Direct query completed");
    console.log("🏨 ROOM DATA DEBUG: Direct query results:", roomsData);
    console.log("🏨 ROOM DATA DEBUG: Direct query results count:", roomsData?.length || 0);
    
    if (roomsData && roomsData.length > 0) {
      console.log("✅ ROOM DATA DEBUG: Direct query successful - setting rooms from direct query");
      console.log("✅ ROOM DATA DEBUG: Rooms being set:", roomsData);
      setRooms(roomsData);
      setError(null);
      setUsingLocalData(false);
      console.log("✅ ROOM DATA DEBUG: State updated successfully with direct query results");
      return roomsData;
    }
    
    // Try through service if direct query returns empty
    console.log("🏨 ROOM DATA DEBUG: Step 2 - Direct query returned empty, trying through service...");
    const serviceFetchedRooms = await fetchRoomsFromService();
    console.log("🏨 ROOM DATA DEBUG: Service query completed");
    console.log("🏨 ROOM DATA DEBUG: Service fetched rooms:", serviceFetchedRooms);
    console.log("🏨 ROOM DATA DEBUG: Service fetched rooms count:", serviceFetchedRooms?.length || 0);
    
    if (serviceFetchedRooms && serviceFetchedRooms.length > 0) {
      console.log("✅ ROOM DATA DEBUG: Service query successful - setting rooms from service");
      setRooms(serviceFetchedRooms);
      setError(null);
      setUsingLocalData(false);
      console.log("✅ ROOM DATA DEBUG: State updated successfully with service results");
      return serviceFetchedRooms;
    }
    
    // Database is empty - automatically seed it
    console.log("🏨 ROOM DATA DEBUG: Step 3 - Database is empty, auto-seeding with initial room data...");
    try {
      const seedFunction = httpsCallable(functions, 'seedDatabase');
      console.log("🏨 ROOM DATA DEBUG: Calling seedDatabase function...");
      
      // Set a timeout for the function call
      const result = await Promise.race([
        seedFunction(),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Function call timeout')), 10000)
        )
      ]);
      
      console.log("🏨 ROOM DATA DEBUG: SeedDatabase result:", (result as any)?.data);
      
      // After seeding, try to fetch again
      console.log("🏨 ROOM DATA DEBUG: Attempting to fetch rooms after seeding...");
      const freshRooms = await fetchRoomsDirectly();
      
      if (freshRooms && freshRooms.length > 0) {
        console.log("✅ ROOM DATA DEBUG: Successfully fetched seeded rooms");
        setRooms(freshRooms);
        setError(null);
        setUsingLocalData(false);
        return freshRooms;
      }
    } catch (seedError) {
      console.error("❌ ROOM DATA ERROR: Auto-seeding failed:", seedError);
      console.error("❌ ROOM DATA ERROR: This could be due to:");
      console.error("  - Cloud Function not deployed");
      console.error("  - CORS issues");
      console.error("  - Network connectivity");
      console.error("  - Function timeout");
      console.log("🏨 ROOM DATA DEBUG: Continuing with fallback data...");
    }
    
    // Fallback to the 11 themed rooms if Firestore is empty
    console.log("🏨 ROOM DATA DEBUG: Step 3 - Both queries returned empty, using fallback data");
    console.log("🏨 ROOM DATA DEBUG: Using fallback room data - the 11 Colorado-themed rooms");
    console.log("🏨 ROOM DATA DEBUG: Fallback rooms count:", fallbackRooms.length);
    setRooms(fallbackRooms);
    setUsingLocalData(true);
    setError(null);
    console.log("✅ ROOM DATA DEBUG: State updated with fallback rooms (local data)");
    return fallbackRooms;
  } catch (err) {
    console.error("❌ ROOM DATA ERROR: Error loading rooms from any source");
    console.error("❌ ROOM DATA ERROR: Error type:", typeof err);
    console.error("❌ ROOM DATA ERROR: Error constructor:", err?.constructor?.name);
    console.error("❌ ROOM DATA ERROR: Error message:", (err as any)?.message);
    console.error("❌ ROOM DATA ERROR: Error code:", (err as any)?.code);
    console.error("❌ ROOM DATA ERROR: Error details:", (err as any)?.details);
    console.error("❌ ROOM DATA ERROR: Full error object:", err);
    console.error("❌ ROOM DATA ERROR: Error stack:", (err as any)?.stack);
    
    // Even on error, show the fallback rooms so users can see the interface
    console.log("🏨 ROOM DATA DEBUG: Error occurred, using fallback room data as safety net");
    console.log("🏨 ROOM DATA DEBUG: Fallback rooms being set:", fallbackRooms.length);
    setRooms(fallbackRooms);
    setUsingLocalData(true);
    setError("Using demo room data. Connect to Firestore to see live data.");
    console.log("✅ ROOM DATA DEBUG: State updated with fallback rooms after error");
    return fallbackRooms;
  }
};
