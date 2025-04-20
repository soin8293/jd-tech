
import { hotelRooms } from "@/data/hotel.data";
import { saveRoom } from "./roomMutations";

export const seedRooms = async (): Promise<void> => {
  try {
    // Ensure each room has proper availability and bookings fields
    const roomsToSeed = hotelRooms.map(room => ({
      ...room,
      availability: true,
      bookings: []
    }));
    
    const savePromises = roomsToSeed.map(room => saveRoom(room));
    await Promise.all(savePromises);
    console.log("Database seeded with initial room data");
  } catch (error) {
    console.error("Error seeding rooms:", error);
    throw error;
  }
};
