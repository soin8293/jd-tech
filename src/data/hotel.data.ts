
import { Room } from "../types/hotel.types";

export const hotelRooms: Room[] = [
  // Downstairs Rooms
  {
    id: "downstairs-1",
    name: "Denver Room",
    description: "Standard room located on the ground floor featuring a plush king-size bed and modern amenities inspired by the Mile High City",
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
    name: "Colorado Springs Room",
    description: "Standard room located on the ground floor featuring a plush king-size bed with mountain-inspired decor",
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
    name: "Boulder Room",
    description: "Standard room located on the ground floor featuring a plush king-size bed with natural Boulder-inspired elements",
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
    name: "Fort Collins Room",
    description: "Standard room located on the upper floor featuring a plush king-size bed with craft-inspired decor",
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
    name: "Aurora Room",
    description: "Standard room located on the upper floor featuring a plush king-size bed with gateway-themed amenities",
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
    name: "Pueblo Room",
    description: "Standard room located on the upper floor featuring a plush king-size bed with historic charm",
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
    name: "Vail Room",
    description: "Standard room located on the upper floor featuring a plush king-size bed with alpine-inspired luxury",
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
    name: "Aspen Room",
    description: "Our most luxurious accommodation featuring both king and queen-size beds, expanded living space, and premium amenities inspired by Aspen's luxury lifestyle",
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
  description: "Experience authentic hospitality with a Colorado mountain spirit in the heart of Port Harcourt, where traditional warmth meets modern comfort.",
  address: "Rumukparali, Port Harcourt, Rivers State, Nigeria",
  rating: 4.9,
  amenities: [
    "Free High-Speed WiFi",
    "Nigerian & International Restaurant",
    "Rocky Mountain Bar",
    "The Centennial Hall",
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
  headerImage: "https://images.unsplash.com/photo-1466442929976-97f336a657be",
  bar: "Rocky Mountain Bar",
  hall: "The Centennial Hall"
};
