/**
 * Refactored Hotel Booking Page
 * Clean, modular implementation using centralized services and hooks
 * Separated concerns: booking logic, room search, UI components
 */

import React, { useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useIsMobile } from "@/hooks/use-mobile";
import { useBooking } from "@/hooks/useBooking";
import { useRoomSearch } from "@/hooks/useRoomSearch";
import { cn } from "@/lib/utils";
import { addDays } from "date-fns";

// UI Components
import HotelHeader from "@/components/hotel/HotelHeader";
import BookingForm from "@/components/hotel/BookingForm";
import RoomList from "@/components/hotel/RoomList";
import FloatingBookButton from "@/components/hotel/FloatingBookButton";
import PaymentModal from "@/components/payment/PaymentModal";
import LocalDataBanner from "@/components/hotel/LocalDataBanner";
import InitializeAdmin from "@/components/admin/InitializeAdmin";

// Types
import { BookingPeriod } from "@/types/hotel.types";

const HotelBooking: React.FC = () => {
  const { currentUser } = useAuth();
  const isMobile = useIsMobile();

  // Initialize booking hook with default values
  const booking = useBooking({
    checkIn: new Date(),
    checkOut: addDays(new Date(), 3),
  }, 2);

  // Initialize room search hook
  const roomSearch = useRoomSearch();

  // Payment modal state
  const [isPaymentModalOpen, setPaymentModalOpen] = React.useState(false);

  /**
   * Handle room search when user submits booking form
   */
  const handleSearchRooms = async (period: BookingPeriod, guestCount: number) => {
    // Update booking state
    booking.setBookingPeriod(period);
    booking.setGuests(guestCount);
    
    // Perform room search
    await roomSearch.searchRooms(period, guestCount);
  };

  /**
   * Handle room selection
   */
  const handleSelectRoom = (room: any) => {
    const availability = roomSearch.getRoomAvailability(room.id);
    booking.selectRoom(room, availability);
  };

  /**
   * Handle booking initiation
   */
  const handleBookNow = async () => {
    const bookingDetails = await booking.createBooking(currentUser?.email);
    
    if (bookingDetails) {
      setPaymentModalOpen(true);
    }
  };

  /**
   * Handle payment completion
   */
  const handlePaymentComplete = () => {
    setPaymentModalOpen(false);
    
    // Update room availability to reflect the booking
    booking.selectedRooms.forEach(room => {
      // Future: Update room availability in the search results
      console.log(`Room ${room.id} has been booked`);
    });
    
    // Reset booking state
    booking.resetBooking();
  };

  return (
    <div className="min-h-screen flex flex-col pt-16">
      <HotelHeader />
      
      <div className={cn(
        "container mx-auto px-4 md:px-6 relative z-10",
        isMobile ? "-mt-32" : "-mt-12"
      )}>
        {/* Booking Form and Admin Controls */}
        <div className="flex justify-between items-center">
          <BookingForm 
            onSearch={handleSearchRooms} 
            className="mb-10"
            isLoading={roomSearch.isLoading}
          />
          
          {/* Admin Controls - Only show for specific admin user */}
          {currentUser?.email === "amirahcolorado@gmail.com" && (
            <div className="flex gap-2">
              <InitializeAdmin />
            </div>
          )}
        </div>

        {/* Local Data Banner - Will be shown by RoomList component if needed */}
        <LocalDataBanner />
        
        {/* Room Search Results */}
        {roomSearch.isSearched && (
          <div className="mt-6">
            <RoomList 
              rooms={roomSearch.searchResults}
              selectedRooms={booking.selectedRooms}
              onSelectRoom={handleSelectRoom}
              bookingPeriod={booking.bookingPeriod}
              roomAvailability={roomSearch.roomAvailability}
              onBookNow={handleBookNow}
              context="booking"
              showEditButtons={false}
              isLoading={roomSearch.isLoading}
            />
          </div>
        )}

        {/* Floating Book Button */}
        <FloatingBookButton 
          onBookNow={handleBookNow}
          disabled={!booking.hasSelectedRooms || booking.isProcessing}
        />

        {/* Payment Modal */}
        {booking.bookingDetails && (
          <PaymentModal
            isOpen={isPaymentModalOpen}
            onClose={() => setPaymentModalOpen(false)}
            bookingDetails={booking.bookingDetails}
            onPaymentComplete={handlePaymentComplete}
          />
        )}
      </div>
    </div>
  );
};

export default HotelBooking;