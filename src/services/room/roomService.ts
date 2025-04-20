
import { Room } from "@/types/hotel.types";
import { getRooms as fetchRooms, getRoom as fetchRoom } from "./roomQueries";
import { saveRoom, saveRooms, deleteRoom } from "./roomMutations";
import { seedRooms } from "./roomSeed";
import { getAvailableRooms } from "./roomAvailability";

// Re-export all room-related functionality
export {
  fetchRooms as getRooms,
  fetchRoom as getRoom,
  saveRoom,
  saveRooms,
  deleteRoom,
  seedRooms,
  getAvailableRooms,
};
