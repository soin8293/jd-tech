
import { hotelRooms } from "@/data/hotel.data";
import { saveRoom } from "./roomMutations";

export const seedRooms = async (): Promise<void> => {
  try {
    const savePromises = hotelRooms.map(room => saveRoom(room));
    await Promise.all(savePromises);
    console.log("Database seeded with initial room data");
  } catch (error) {
    console.error("Error seeding rooms:", error);
    throw error;
  }
};
