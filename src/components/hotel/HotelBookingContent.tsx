import React from "react";
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";
import BookingForm from "@/components/hotel/BookingForm";
import InitializeAdmin from "@/components/admin/InitializeAdmin";
import RoomList from "@/components/hotel/RoomList";
import FloatingBookButton from "@/components/hotel/FloatingBookButton";
import PaymentModal from "@/components/payment/PaymentModal";
import { useHotelBooking } from "@/hooks/useHotelBooking";

const HotelBookingContent: React.FC = () => {
  const isMobile = useIsMobile();
  const {
    selectedRooms,
    bookingPeriod,
    availableRooms,
    roomAvailability,
    hasSearched,
    isPaymentModalOpen,
    bookingDetails,
    isLoading,
    usingLocalData,
    currentUser,
    handleSearchRooms,
    handleSelectRoom,
    handleBookNow,
    handlePaymentComplete,
    setPaymentModalOpen
  } = useHotelBooking();

  return (
    <div className="container mx-auto px-4 md:px-6 relative z-10 -mt-8">
      <div className="flex justify-between items-center">
        <BookingForm 
          onSearch={handleSearchRooms} 
          className="mb-10"
          isLoading={isLoading}
        />
        
        {currentUser?.email === "amirahcolorado@gmail.com" && (
          <div className="flex gap-2">
            <InitializeAdmin />
          </div>
        )}
      </div>

      {usingLocalData && (
        <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-sm text-blue-700">
            Currently showing demo room data. Connect to Firestore to see live data.
          </p>
        </div>
      )}
      
      {hasSearched && (
        <div className="mt-6">
          <RoomList 
            rooms={availableRooms}
            selectedRooms={selectedRooms}
            onSelectRoom={handleSelectRoom}
            bookingPeriod={bookingPeriod}
            roomAvailability={roomAvailability}
            onBookNow={handleBookNow}
            context="booking"
            showEditButtons={false}
            isLoading={isLoading}
          />
        </div>
      )}

      <FloatingBookButton 
        onBookNow={handleBookNow}
        disabled={selectedRooms.length === 0}
      />

      {bookingDetails && (
        <PaymentModal
          isOpen={isPaymentModalOpen}
          onClose={() => setPaymentModalOpen(false)}
          bookingDetails={bookingDetails}
          onPaymentComplete={handlePaymentComplete}
        />
      )}
    </div>
  );
};

export default HotelBookingContent;