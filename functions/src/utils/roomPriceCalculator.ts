
import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import { Room, BookingPeriod } from "../types/booking.types";

export const calculateNumberOfNights = (period: BookingPeriod): number => {
  const checkIn = new Date(period.checkIn);
  const checkOut = new Date(period.checkOut);
  console.log("PRICE_CALC: Calculating nights between", {
    checkIn: checkIn.toISOString(),
    checkOut: checkOut.toISOString()
  });
  
  const nights = Math.max(1, Math.ceil((checkOut.getTime() - checkIn.getTime()) / (1000 * 3600 * 24)));
  console.log("PRICE_CALC: Calculated nights:", nights);
  return nights;
};

export const calculateRoomPrices = async (
  rooms: Room[],
  numberOfNights: number
): Promise<{ totalAmount: number; roomPrices: { [key: string]: number } }> => {
  console.log("PRICE_CALC: Starting room price calculation for", rooms.length, "rooms and", numberOfNights, "nights");
  
  try {
    const firestore = admin.firestore();
    let totalAmount = 0;
    const roomPrices: { [key: string]: number } = {};

    console.log("PRICE_CALC: Processing rooms:", rooms.map(room => ({
      id: room.id,
      name: room.name,
      price: room.price
    })));

    for (const room of rooms) {
      if (!room.id) {
        console.error("PRICE_CALC: Missing room ID, invalid room data:", room);
        throw new functions.https.HttpsError(
          'invalid-argument',
          'Invalid room data: Missing room ID',
          { type: 'validation_error', details: { room } }
        );
      }

      console.log(`PRICE_CALC: Fetching room data for ID: ${room.id}`);
      const roomDoc = await firestore.collection('rooms').doc(room.id).get();

      if (!roomDoc.exists) {
        console.error(`PRICE_CALC: Room ${room.id} not found in database`);
        throw new functions.https.HttpsError(
          'not-found',
          `Room ${room.id} not found in database`,
          { type: 'room_not_found', details: { roomId: room.id } }
        );
      }

      const roomData = roomDoc.data();
      console.log(`PRICE_CALC: Retrieved room data:`, roomData);
      
      if (!roomData || typeof roomData.price !== 'number') {
        console.error(`PRICE_CALC: Invalid price data for room: ${room.id}`, roomData);
        throw new functions.https.HttpsError(
          'invalid-argument',
          `Invalid price data for room: ${room.id}`,
          { type: 'invalid_price', details: { roomId: room.id, data: roomData } }
        );
      }

      const roomTotal = roomData.price * numberOfNights;
      totalAmount += roomTotal;
      roomPrices[room.id] = roomTotal;
      
      console.log(`PRICE_CALC: Calculated price for room ${room.id}: $${roomData.price} × ${numberOfNights} nights = $${roomTotal}`);
    }

    console.log("PRICE_CALC: Final calculation result:", {
      totalAmount,
      roomPrices,
      numberOfRooms: rooms.length,
      numberOfNights
    });

    return { totalAmount, roomPrices };
  } catch (error) {
    console.error("PRICE_CALC: Error calculating room prices:", error);
    throw error; // Re-throw to be handled by the calling function
  }
};
