
import { Room } from "../types/hotel.types";

export const hotelRooms: Room[] = [
  {
    id: "deluxe-room",
    name: "Lagos Deluxe Suite",
    description: "Elegant suite with authentic Nigerian art pieces and premium amenities, featuring views of Victoria Island.",
    price: 320,
    capacity: 2,
    size: 400,
    bed: "King",
    amenities: [
      "Free High-Speed Wi-Fi",
      "55\" Smart TV",
      "Mini Bar with local beverages",
      "24/7 Room Service",
      "Air Conditioning",
      "Premium Nigerian Toiletries",
      "In-room Safe",
      "Ergonomic Work Desk"
    ],
    images: [
      "https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&w=1000",
      "https://images.unsplash.com/photo-1566665797739-1674de7a421a?auto=format&fit=crop&w=1000"
    ],
    availability: true
  },
  {
    id: "suite",
    name: "Executive Lagos Suite",
    description: "Spacious suite with separate living area featuring Nigerian-inspired decor and panoramic city views.",
    price: 560,
    capacity: 3,
    size: 650,
    bed: "King + Sofa Bed",
    amenities: [
      "Free High-Speed Wi-Fi",
      "65\" Smart TV",
      "Premium Mini Bar",
      "24/7 Room Service",
      "Climate Control",
      "Luxury Nigerian Bath Products",
      "Digital Safe",
      "Business Work Area",
      "Private Lounge",
      "Nespresso Coffee Machine",
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
    name: "Nigerian Family Suite",
    description: "Thoughtfully designed family accommodation with traditional Nigerian touches and amenities for children.",
    price: 420,
    capacity: 4,
    size: 550,
    bed: "2 Queen",
    amenities: [
      "Free High-Speed Wi-Fi",
      "55\" Smart TV",
      "Stocked Mini Bar",
      "24/7 Room Service",
      "Climate Control",
      "Nigerian Natural Toiletries",
      "Digital Safe",
      "Children's Welcome Pack",
      "Game Console",
      "Coffee & Tea Facilities"
    ],
    images: [
      "https://images.unsplash.com/photo-1591088398332-8a7791972843?auto=format&fit=crop&w=1000",
      "https://images.unsplash.com/photo-1540518614846-7eded433c457?auto=format&fit=crop&w=1000"
    ],
    availability: true
  },
  {
    id: "penthouse",
    name: "Lagos Presidential Penthouse",
    description: "Ultimate Nigerian luxury experience with panoramic views of Lagos, exclusive amenities and personalized service.",
    price: 1200,
    capacity: 4,
    size: 1200,
    bed: "King + 2 Queen",
    amenities: [
      "Dedicated High-Speed Wi-Fi",
      "75\" Smart TV",
      "Premium Bar with Nigerian spirits",
      "24/7 Personal Butler",
      "Advanced Climate System",
      "Luxury Nigerian-sourced Toiletries",
      "Biometric Safe",
      "Executive Office",
      "Separate Living Area",
      "Full Kitchen",
      "Private Terrace",
      "Jacuzzi with Lagos views",
      "Bose Sound System"
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
  headerImage: "https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&w=2000"
};
