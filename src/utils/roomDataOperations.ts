
import { Room } from "@/types/hotel.types";
import { getRooms as fetchRoomsDirectly } from "@/services/room/roomQueries";
import { getRooms as fetchRoomsFromService } from "@/services/room/roomService";
import { notifyError } from "./roomNotifications";

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

export const fetchRoomData = async (
  setRooms: (rooms: Room[]) => void,
  setError: (error: string | null) => void,
  setUsingLocalData: (value: boolean) => void,
  hasShownLocalDataToast: boolean,
  setHasShownLocalDataToast: (value: boolean) => void
) => {
  try {
    console.log("Fetching rooms in useRoomManagement...");
    
    // First try direct query
    const roomsData = await fetchRoomsDirectly();
    console.log("Direct query results:", roomsData);
    
    if (roomsData && roomsData.length > 0) {
      console.log("Setting rooms from direct query:", roomsData);
      setRooms(roomsData);
      setError(null);
      setUsingLocalData(false);
      return roomsData;
    }
    
    // Try through service if direct query returns empty
    console.log("Direct query returned empty, trying through service...");
    const serviceFetchedRooms = await fetchRoomsFromService();
    console.log("Service fetched rooms:", serviceFetchedRooms);
    
    if (serviceFetchedRooms && serviceFetchedRooms.length > 0) {
      setRooms(serviceFetchedRooms);
      setError(null);
      setUsingLocalData(false);
      return serviceFetchedRooms;
    }
    
    // Fallback to the 11 themed rooms if Firestore is empty
    console.log("Using fallback room data - the 11 Colorado-themed rooms");
    setRooms(fallbackRooms);
    setUsingLocalData(true);
    setError(null);
    return fallbackRooms;
  } catch (err) {
    console.error("Error loading rooms:", err);
    
    // Even on error, show the fallback rooms so users can see the interface
    console.log("Error occurred, using fallback room data");
    setRooms(fallbackRooms);
    setUsingLocalData(true);
    setError("Using demo room data. Connect to Firestore to see live data.");
    return fallbackRooms;
  }
};
