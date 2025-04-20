
import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import { Room, BookingPeriod } from "../types/booking.types";

export const calculateNumberOfNights = (period: BookingPeriod): number => {
  const checkIn = new Date(period.checkIn);
  const checkOut = new Date(period.checkOut);
  return Math.max(1, Math.ceil((checkOut.getTime() - checkIn.getTime()) / (1000 * 3600 * 24)));
};

export const calculateRoomPrices = async (
  rooms: Room[],
  numberOfNights: number
): Promise<{ totalAmount: number; roomPrices: { [key: string]: number } }> => {
  const firestore = admin.firestore();
  let totalAmount = 0;
  const roomPrices: { [key: string]: number } = {};

  for (const room of rooms) {
    if (!room.id) {
      throw new functions.https.HttpsError(
        'invalid-argument',
        'Invalid room data: Missing room ID',
        { type: 'validation_error', details: { room } }
      );
    }

    const roomDoc = await firestore.collection('rooms').doc(room.id).get();

    if (!roomDoc.exists) {
      throw new functions.https.HttpsError(
        'not-found',
        `Room ${room.id} not found in database`,
        { type: 'room_not_found', details: { roomId: room.id } }
      );
    }

    const roomData = roomDoc.data();
    if (!roomData || typeof roomData.price !== 'number') {
      throw new functions.https.HttpsError(
        'invalid-argument',
        `Invalid price data for room: ${room.id}`,
        { type: 'invalid_price', details: { roomId: room.id, data: roomData } }
      );
    }

    const roomTotal = roomData.price * numberOfNights;
    totalAmount += roomTotal;
    roomPrices[room.id] = roomTotal;
  }

  return { totalAmount, roomPrices };
};
