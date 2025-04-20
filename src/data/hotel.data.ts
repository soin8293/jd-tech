
import { Room } from "../types/hotel.types";

export const hotelRooms: Room[] = [
  // Downstairs Rooms
  {
    id: "downstairs-1",
    name: "Room 101",
    description: "Comfortable downstairs room with king-size bed",
    price: 320,
    capacity: 2,
    size: 400,
    bed: "King",
    amenities: [
      "Free High-Speed Wi-Fi",
      "Air Conditioning",
      "Premium Toiletries",
      "In-room Safe",
      "Work Desk"
    ],
    images: [],
    availability: true
  },
  {
    id: "downstairs-2",
    name: "Room 102",
    description: "Comfortable downstairs room with king-size bed",
    price: 320,
    capacity: 2,
    size: 400,
    bed: "King",
    amenities: [
      "Free High-Speed Wi-Fi",
      "Air Conditioning",
      "Premium Toiletries",
      "In-room Safe",
      "Work Desk"
    ],
    images: [],
    availability: true
  },
  {
    id: "downstairs-3",
    name: "Room 103",
    description: "Comfortable downstairs room with king-size bed",
    price: 320,
    capacity: 2,
    size: 400,
    bed: "King",
    amenities: [
      "Free High-Speed Wi-Fi",
      "Air Conditioning",
      "Premium Toiletries",
      "In-room Safe",
      "Work Desk"
    ],
    images: [],
    availability: false // This room is marked as booked for demonstration
  },
  // Upstairs Rooms
  {
    id: "upstairs-1",
    name: "Room 201",
    description: "Comfortable upstairs room with king-size bed",
    price: 320,
    capacity: 2,
    size: 400,
    bed: "King",
    amenities: [
      "Free High-Speed Wi-Fi",
      "Air Conditioning",
      "Premium Toiletries",
      "In-room Safe",
      "Work Desk"
    ],
    images: [],
    availability: true
  },
  {
    id: "upstairs-2",
    name: "Room 202",
    description: "Comfortable upstairs room with king-size bed",
    price: 320,
    capacity: 2,
    size: 400,
    bed: "King",
    amenities: [
      "Free High-Speed Wi-Fi",
      "Air Conditioning",
      "Premium Toiletries",
      "In-room Safe",
      "Work Desk"
    ],
    images: [],
    availability: true
  },
  {
    id: "upstairs-3",
    name: "Room 203",
    description: "Comfortable upstairs room with king-size bed",
    price: 320,
    capacity: 2,
    size: 400,
    bed: "King",
    amenities: [
      "Free High-Speed Wi-Fi",
      "Air Conditioning",
      "Premium Toiletries",
      "In-room Safe",
      "Work Desk"
    ],
    images: [],
    availability: true
  },
  {
    id: "upstairs-4",
    name: "Room 204",
    description: "Comfortable upstairs room with king-size bed",
    price: 320,
    capacity: 2,
    size: 400,
    bed: "King",
    amenities: [
      "Free High-Speed Wi-Fi",
      "Air Conditioning",
      "Premium Toiletries",
      "In-room Safe",
      "Work Desk"
    ],
    images: [],
    availability: true
  },
  {
    id: "upstairs-suite",
    name: "Executive Suite 205",
    description: "Spacious upstairs suite with king and queen-size beds",
    price: 560,
    capacity: 4,
    size: 650,
    bed: "King + Queen",
    amenities: [
      "Free High-Speed Wi-Fi",
      "Premium Air Conditioning",
      "Luxury Toiletries",
      "Digital Safe",
      "Work Area",
      "Mini Bar",
      "Extra Seating Area",
      "Premium Coffee Machine"
    ],
    images: [],
    availability: true
  }
];

export const hotelDetails = {
  name: "JD Suites",
  description: "Experience authentic Nigerian hospitality in the heart of luxury, where traditional warmth meets modern comfort.",
  address: "Victoria Island, Lagos, Nigeria",
  rating: 4.9,
  amenities: [
    "Free High-Speed WiFi",
    "Nigerian & International Restaurant",
    "24/7 Room Service",
    "Dedicated Concierge",
    "Secure Parking",
    "Business Center",
    "24/7 Security"
  ],
  checkInTime: "15:00",
  checkOutTime: "11:00",
  images: [
    "https://images.unsplash.com/photo-1564501049412-61c2a3083791?auto=format&fit=crop&w=2000",
    "https://images.unsplash.com/photo-1571896349842-33c89424de2d?auto=format&fit=crop&w=2000",
    "https://images.unsplash.com/photo-1584132967334-10e028bd69f7?auto=format&fit=crop&w=2000"
  ],
  headerImage: "https://images.unsplash.com/photo-1466442929976-97f336a657be"
};
