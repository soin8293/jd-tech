import { Room } from "../types/hotel.types";

export const hotelRooms: Room[] = [
  {
    id: "deluxe-room",
    name: "Deluxe Room",
    description: "Elegant and spacious room with premium amenities and a view of the city skyline.",
    price: 320,
    capacity: 2,
    size: 400,
    bed: "King",
    amenities: [
      "Free Wi-Fi",
      "55\" Smart TV",
      "Mini Bar",
      "Room Service",
      "Air Conditioning",
      "Premium Toiletries",
      "Safe",
      "Work Desk"
    ],
    images: [
      "https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&w=1000",
      "https://images.unsplash.com/photo-1566665797739-1674de7a421a?auto=format&fit=crop&w=1000"
    ],
    availability: true
  },
  {
    id: "suite",
    name: "Executive Suite",
    description: "Luxurious suite with separate living area, premium amenities and panoramic views.",
    price: 560,
    capacity: 3,
    size: 650,
    bed: "King + Sofa Bed",
    amenities: [
      "Free Wi-Fi",
      "65\" Smart TV",
      "Mini Bar",
      "Room Service",
      "Air Conditioning",
      "Premium Toiletries",
      "Safe",
      "Work Desk",
      "Living Area",
      "Coffee Machine",
      "Bathrobe & Slippers"
    ],
    images: [
      "https://images.unsplash.com/photo-1596394516093-501ba68a0ba6?auto=format&fit=crop&w=1000",
      "https://images.unsplash.com/photo-1587985064135-0366536eab42?auto=format&fit=crop&w=1000"
    ],
    availability: true
  },
  {
    id: "family-room",
    name: "Family Room",
    description: "Spacious room designed for families with additional beds and amenities for children.",
    price: 420,
    capacity: 4,
    size: 550,
    bed: "2 Queen",
    amenities: [
      "Free Wi-Fi",
      "55\" Smart TV",
      "Mini Bar",
      "Room Service",
      "Air Conditioning",
      "Premium Toiletries",
      "Safe",
      "Children's Amenities",
      "Game Console",
      "Coffee Machine"
    ],
    images: [
      "https://images.unsplash.com/photo-1591088398332-8a7791972843?auto=format&fit=crop&w=1000",
      "https://images.unsplash.com/photo-1540518614846-7eded433c457?auto=format&fit=crop&w=1000"
    ],
    availability: true
  },
  {
    id: "penthouse",
    name: "Penthouse Suite",
    description: "Ultimate luxury with panoramic views, exclusive amenities and personalized service.",
    price: 1200,
    capacity: 4,
    size: 1200,
    bed: "King + 2 Queen",
    amenities: [
      "Free Wi-Fi",
      "75\" Smart TV",
      "Full Bar",
      "24/7 Butler Service",
      "Air Conditioning",
      "Premium Toiletries",
      "Safe",
      "Office Space",
      "Living Area",
      "Kitchen",
      "Private Terrace",
      "Jacuzzi",
      "Premium Sound System"
    ],
    images: [
      "https://images.unsplash.com/photo-1608198093002-ad4e005484ec?auto=format&fit=crop&w=1000",
      "https://images.unsplash.com/photo-1631049552057-403cdb8f0658?auto=format&fit=crop&w=1000"
    ],
    availability: true
  }
];

export const hotelDetails = {
  name: "JD Suites",
  description: "Experience authentic Nigerian hospitality in the heart of luxury, where traditional warmth meets modern comfort.",
  address: "Victoria Island, Lagos, Nigeria",
  rating: 4.9,
  amenities: [
    "Free WiFi",
    "Restaurant",
    "Room Service",
    "Concierge",
    "Parking",
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
  headerImage: "https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&w=2000"
};
