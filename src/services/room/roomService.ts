
import { Room, BookingPeriod, BookingNote, ChargeRecord } from "@/types/hotel.types";
import { getRooms as fetchRooms, getRoom as fetchRoom } from "./roomQueries";
import { saveRoom, saveRooms, deleteRoom, addBookingToRoom } from "./roomMutations";
import { seedRooms } from "./roomSeed";
import { getAvailableRooms } from "./roomAvailability";
import { addNoteToBooking, addChargeToBooking } from "./roomIssueTracking";

// Re-export all room-related functionality
export {
  fetchRooms as getRooms,
  fetchRoom as getRoom,
  saveRoom,
  saveRooms,
  deleteRoom,
  seedRooms,
  getAvailableRooms,
  addBookingToRoom,
  addNoteToBooking,
  addChargeToBooking
};
