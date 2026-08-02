import * as admin from "firebase-admin";
import { getFirestore } from "firebase-admin/firestore";

/** Identity resolved from a verified MCP OAuth access token. */
export interface McpUser {
  uid: string;
  email: string | null;
  scopes: string[];
}

export interface ToolDefinition {
  name: string;
  title: string;
  description: string;
  inputSchema: Record<string, unknown>;
  annotations?: Record<string, boolean>;
  requiresAdmin?: boolean;
  requiresWrite?: boolean;
  handler: (input: any, user: McpUser) => Promise<unknown>;
}

export class ToolError extends Error {}

const db = () => getFirestore();

async function assertAdmin(user: McpUser): Promise<void> {
  const record = await admin.auth().getUser(user.uid);
  if (record.customClaims?.admin !== true) {
    throw new ToolError("Admin access required for this tool.");
  }
}

function iso(value: any): string | null {
  if (!value) return null;
  if (typeof value?.toDate === "function") return value.toDate().toISOString();
  if (value instanceof Date) return value.toISOString();
  if (typeof value === "string") return value;
  return null;
}

function dateKey(d: Date): string {
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${month}-${day}`;
}

function parseDate(value: string, label: string): Date {
  const parsed = new Date(`${value}T00:00:00Z`);
  if (isNaN(parsed.getTime())) {
    throw new ToolError(`${label} must be a valid YYYY-MM-DD date.`);
  }
  return parsed;
}

function eachDate(start: Date, end: Date): Date[] {
  if (end <= start) throw new ToolError("endDate must be after startDate.");
  const days: Date[] = [];
  const cursor = new Date(start);
  while (cursor < end) {
    days.push(new Date(cursor));
    cursor.setUTCDate(cursor.getUTCDate() + 1);
    if (days.length > 400) throw new ToolError("Date range is limited to 400 nights.");
  }
  return days;
}

async function loadAvailability(roomId: string, years: number[]) {
  const byYear: Record<number, Record<string, any>> = {};
  await Promise.all(
    years.map(async (year) => {
      const snap = await db()
        .collection("rooms").doc(roomId)
        .collection("availability").doc(String(year))
        .get();
      byYear[year] = (snap.data() as Record<string, any>) || {};
    })
  );
  return byYear;
}

function serializeRoom(id: string, data: any) {
  return {
    id,
    name: data?.name ?? null,
    description: data?.description ?? null,
    price: data?.price ?? data?.pricePerNight ?? null,
    capacity: data?.capacity ?? data?.maxGuests ?? null,
    beds: data?.beds ?? null,
    size: data?.size ?? null,
    amenities: data?.amenities ?? [],
    images: data?.images ?? [],
    status: data?.status ?? null,
  };
}

function serializeBooking(id: string, data: any) {
  return {
    id,
    status: data?.status ?? null,
    userEmail: data?.userEmail ?? null,
    userId: data?.userId ?? null,
    guests: data?.guests ?? null,
    totalPrice: data?.totalPrice ?? null,
    roomId: data?.roomId ?? null,
    rooms: data?.rooms ?? null,
    checkIn: iso(data?.checkInDate ?? data?.checkIn ?? data?.period?.startDate),
    checkOut: iso(data?.checkOutDate ?? data?.checkOut ?? data?.period?.endDate),
    createdAt: iso(data?.createdAt),
    specialRequests: data?.specialRequests ?? null,
  };
}

const str = (description: string) => ({ type: "string", description });

export const TOOLS: ToolDefinition[] = [
  {
    name: "list_rooms",
    title: "List rooms",
    description: "List every room at JD Suites with pricing, capacity and amenities.",
    inputSchema: { type: "object", properties: {}, additionalProperties: false },
    annotations: { readOnlyHint: true, openWorldHint: false },
    handler: async () => {
      const snap = await db().collection("rooms").get();
      return { rooms: snap.docs.map((d) => serializeRoom(d.id, d.data())) };
    },
  },
  {
    name: "get_room",
    title: "Get room",
    description: "Get the full details of a single room by its id.",
    inputSchema: {
      type: "object",
      properties: { roomId: str("The room id.") },
      required: ["roomId"],
      additionalProperties: false,
    },
    annotations: { readOnlyHint: true, openWorldHint: false },
    handler: async ({ roomId }) => {
      const snap = await db().collection("rooms").doc(String(roomId)).get();
      if (!snap.exists) throw new ToolError(`No room found with id ${roomId}.`);
      return { room: { ...serializeRoom(snap.id, snap.data()), raw: snap.data() } };
    },
  },
  {
    name: "check_availability",
    title: "Check availability",
    description:
      "Check which rooms are free for a stay. Returns per-room availability and the " +
      "list of blocked or booked nights inside the range.",
    inputSchema: {
      type: "object",
      properties: {
        startDate: str("Check-in date, YYYY-MM-DD."),
        endDate: str("Check-out date, YYYY-MM-DD."),
        roomId: str("Optional. Limit the check to one room."),
      },
      required: ["startDate", "endDate"],
      additionalProperties: false,
    },
    annotations: { readOnlyHint: true, openWorldHint: false },
    handler: async ({ startDate, endDate, roomId }) => {
      const start = parseDate(String(startDate), "startDate");
      const end = parseDate(String(endDate), "endDate");
      const nights = eachDate(start, end);
      const years = Array.from(new Set(nights.map((d) => d.getUTCFullYear())));

      const roomDocs = roomId ?
        [await db().collection("rooms").doc(String(roomId)).get()] :
        (await db().collection("rooms").get()).docs;

      const results = [];
      for (const doc of roomDocs) {
        if (!doc.exists) throw new ToolError(`No room found with id ${roomId}.`);
        const availability = await loadAvailability(doc.id, years);
        const unavailable = nights
          .filter((night) => {
            const entry = availability[night.getUTCFullYear()]?.[dateKey(night)];
            const status = entry?.status ?? "available";
            return status !== "available";
          })
          .map((night) => night.toISOString().slice(0, 10));

        results.push({
          roomId: doc.id,
          name: doc.data()?.name ?? null,
          available: unavailable.length === 0,
          nights: nights.length,
          unavailableDates: unavailable,
          pricePerNight: doc.data()?.price ?? doc.data()?.pricePerNight ?? null,
        });
      }
      return { startDate, endDate, nights: nights.length, rooms: results };
    },
  },
  {
    name: "get_availability_calendar",
    title: "Get availability calendar",
    description: "Get the full day-by-day availability calendar for one room and year.",
    inputSchema: {
      type: "object",
      properties: {
        roomId: str("The room id."),
        year: { type: "number", description: "Calendar year, e.g. 2026." },
      },
      required: ["roomId", "year"],
      additionalProperties: false,
    },
    annotations: { readOnlyHint: true, openWorldHint: false },
    handler: async ({ roomId, year }) => {
      const numericYear = Number(year);
      if (!Number.isInteger(numericYear) || numericYear < 2020 || numericYear > 2035) {
        throw new ToolError("year must be an integer between 2020 and 2035.");
      }
      const availability = await loadAvailability(String(roomId), [numericYear]);
      return { roomId, year: numericYear, availability: availability[numericYear] };
    },
  },
  {
    name: "list_my_bookings",
    title: "List my bookings",
    description: "List the bookings that belong to the signed-in user.",
    inputSchema: { type: "object", properties: {}, additionalProperties: false },
    annotations: { readOnlyHint: true, openWorldHint: false },
    handler: async (_input, user) => {
      const byUid = await db().collection("bookings").where("userId", "==", user.uid).get();
      const byEmail = user.email ?
        await db().collection("bookings").where("userEmail", "==", user.email).get() :
        { docs: [] as any[] };

      const seen = new Set<string>();
      const bookings = [...byUid.docs, ...byEmail.docs]
        .filter((d) => (seen.has(d.id) ? false : seen.add(d.id)))
        .map((d) => serializeBooking(d.id, d.data()));
      return { bookings };
    },
  },
  {
    name: "get_booking",
    title: "Get booking",
    description: "Get one booking by id. Non-admins can only read their own bookings.",
    inputSchema: {
      type: "object",
      properties: { bookingId: str("The booking id.") },
      required: ["bookingId"],
      additionalProperties: false,
    },
    annotations: { readOnlyHint: true, openWorldHint: false },
    handler: async ({ bookingId }, user) => {
      const snap = await db().collection("bookings").doc(String(bookingId)).get();
      if (!snap.exists) throw new ToolError(`No booking found with id ${bookingId}.`);
      const data = snap.data() as any;
      const owns = data.userId === user.uid ||
        (!!user.email && data.userEmail === user.email);
      if (!owns) await assertAdmin(user);
      return { booking: serializeBooking(snap.id, data) };
    },
  },
  {
    name: "list_bookings",
    title: "List all bookings",
    description: "Admin only. List bookings across all guests, newest first.",
    inputSchema: {
      type: "object",
      properties: {
        status: str("Optional status filter, e.g. confirmed or cancelled."),
        limit: { type: "number", description: "Max bookings to return (default 25, max 100)." },
      },
      additionalProperties: false,
    },
    annotations: { readOnlyHint: true, openWorldHint: false },
    requiresAdmin: true,
    handler: async ({ status, limit }) => {
      const max = Math.min(Math.max(Number(limit) || 25, 1), 100);
      let query = db().collection("bookings").orderBy("createdAt", "desc").limit(max);
      if (status) query = db().collection("bookings").where("status", "==", String(status)).limit(max);
      const snap = await query.get();
      return { bookings: snap.docs.map((d) => serializeBooking(d.id, d.data())) };
    },
  },
  {
    name: "cancel_booking",
    title: "Cancel booking",
    description: "Admin only. Cancel a booking and release its nights back to availability.",
    inputSchema: {
      type: "object",
      properties: {
        bookingId: str("The booking id to cancel."),
        reason: str("Optional cancellation reason."),
      },
      required: ["bookingId"],
      additionalProperties: false,
    },
    annotations: { readOnlyHint: false, destructiveHint: true, openWorldHint: false },
    requiresAdmin: true,
    requiresWrite: true,
    handler: async ({ bookingId, reason }, user) => {
      const ref = db().collection("bookings").doc(String(bookingId));
      const snap = await ref.get();
      if (!snap.exists) throw new ToolError(`No booking found with id ${bookingId}.`);
      const data = snap.data() as any;
      if (data.status === "cancelled") {
        return { success: true, bookingId, message: "Booking was already cancelled." };
      }

      await ref.update({
        status: "cancelled",
        cancelledAt: new Date(),
        cancelledBy: user.uid,
        cancellationReason: reason ? String(reason) : "Cancelled via MCP",
        updatedAt: new Date(),
      });

      const roomId = data.roomId;
      const checkIn = iso(data.checkInDate ?? data.checkIn ?? data.period?.startDate);
      const checkOut = iso(data.checkOutDate ?? data.checkOut ?? data.period?.endDate);
      if (roomId && checkIn && checkOut) {
        const nights = eachDate(new Date(checkIn), new Date(checkOut));
        const years = Array.from(new Set(nights.map((d) => d.getUTCFullYear())));
        for (const year of years) {
          const availRef = db().collection("rooms").doc(String(roomId))
            .collection("availability").doc(String(year));
          const availSnap = await availRef.get();
          const availData = (availSnap.data() as Record<string, any>) || {};
          let changed = false;
          for (const night of nights.filter((n) => n.getUTCFullYear() === year)) {
            const key = dateKey(night);
            if (availData[key]?.bookingId === bookingId || availData[key]?.status === "booked") {
              availData[key] = { status: "available" };
              changed = true;
            }
          }
          if (changed) await availRef.set(availData, { merge: true });
        }
      }
      return { success: true, bookingId, message: "Booking cancelled and nights released." };
    },
  },
  {
    name: "set_room_availability",
    title: "Set room availability",
    description:
      "Admin only. Block or unblock a date range for a room (for maintenance, " +
      "owner stays, or manual holds).",
    inputSchema: {
      type: "object",
      properties: {
        roomId: str("The room id."),
        startDate: str("First night, YYYY-MM-DD."),
        endDate: str("Checkout date (exclusive), YYYY-MM-DD."),
        status: {
          type: "string",
          enum: ["available", "blocked"],
          description: "Set the nights to available or blocked.",
        },
        note: str("Optional note stored with the blocked nights."),
      },
      required: ["roomId", "startDate", "endDate", "status"],
      additionalProperties: false,
    },
    annotations: { readOnlyHint: false, openWorldHint: false },
    requiresAdmin: true,
    requiresWrite: true,
    handler: async ({ roomId, startDate, endDate, status, note }, user) => {
      if (status !== "available" && status !== "blocked") {
        throw new ToolError("status must be 'available' or 'blocked'.");
      }
      const roomSnap = await db().collection("rooms").doc(String(roomId)).get();
      if (!roomSnap.exists) throw new ToolError(`No room found with id ${roomId}.`);

      const nights = eachDate(parseDate(String(startDate), "startDate"), parseDate(String(endDate), "endDate"));
      const years = Array.from(new Set(nights.map((d) => d.getUTCFullYear())));
      let skipped = 0;

      for (const year of years) {
        const availRef = db().collection("rooms").doc(String(roomId))
          .collection("availability").doc(String(year));
        const availSnap = await availRef.get();
        const availData = (availSnap.data() as Record<string, any>) || {};
        for (const night of nights.filter((n) => n.getUTCFullYear() === year)) {
          const key = dateKey(night);
          if (availData[key]?.bookingId) {
            skipped += 1; // never overwrite a real booking
            continue;
          }
          availData[key] = status === "available" ?
            { status: "available" } :
            { status: "blocked", note: note ? String(note) : "Blocked via MCP", updatedBy: user.uid };
        }
        await availRef.set(availData, { merge: true });
      }
      return {
        success: true,
        roomId,
        nightsUpdated: nights.length - skipped,
        nightsSkippedBecauseBooked: skipped,
      };
    },
  },
  {
    name: "update_room_details",
    title: "Update room details",
    description: "Admin only. Update editable fields on a room such as name, description, price or amenities.",
    inputSchema: {
      type: "object",
      properties: {
        roomId: str("The room id."),
        name: str("New room name."),
        description: str("New room description."),
        price: { type: "number", description: "New nightly price." },
        capacity: { type: "number", description: "New maximum guest count." },
        amenities: {
          type: "array",
          items: { type: "string" },
          description: "Replacement list of amenities.",
        },
      },
      required: ["roomId"],
      additionalProperties: false,
    },
    annotations: { readOnlyHint: false, openWorldHint: false },
    requiresAdmin: true,
    requiresWrite: true,
    handler: async (input, user) => {
      const { roomId, ...fields } = input ?? {};
      const ref = db().collection("rooms").doc(String(roomId));
      if (!(await ref.get()).exists) throw new ToolError(`No room found with id ${roomId}.`);

      const updates: Record<string, unknown> = {};
      for (const key of ["name", "description", "price", "capacity", "amenities"]) {
        if (fields[key] !== undefined) updates[key] = fields[key];
      }
      if (!Object.keys(updates).length) {
        throw new ToolError("Provide at least one field to update.");
      }
      updates.updatedAt = new Date();
      updates.updatedBy = user.uid;
      await ref.update(updates);
      return { success: true, roomId, updated: Object.keys(updates) };
    },
  },
];

export async function runTool(
  name: string,
  input: any,
  user: McpUser
): Promise<unknown> {
  const tool = TOOLS.find((t) => t.name === name);
  if (!tool) throw new ToolError(`Unknown tool: ${name}`);
  if (tool.requiresWrite && !user.scopes.includes("mcp:write")) {
    throw new ToolError("This tool requires the mcp:write scope.");
  }
  if (tool.requiresAdmin) await assertAdmin(user);
  return tool.handler(input ?? {}, user);
}
