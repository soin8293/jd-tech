import React from "react";
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";
import { useOptimizedHotelBooking } from "@/hooks/useOptimizedHotelBooking";
import BookingForm from "@/components/hotel/BookingForm";
import InitializeAdmin from "@/components/admin/InitializeAdmin";
import PaginatedRoomList from "@/components/hotel/PaginatedRoomList";
import FloatingBookButton from "@/components/hotel/FloatingBookButton";
import LazyPaymentModal from "@/components/lazy/LazyPaymentModal";
import PerformanceMonitor from "@/components/performance/PerformanceMonitor";
import FirebaseStatusBanner from "@/components/auth/FirebaseStatusBanner";
import { auth } from "@/lib/firebase";

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
    currentPage,
    totalPages,
    totalResults,
    setCurrentPage,
    currentUser,
    handleSearchRooms,
    handleSelectRoom,
    handleBookNow,
    handlePaymentComplete,
    setPaymentModalOpen
  } = useOptimizedHotelBooking();

  return (
    <div className="container mx-auto px-4 md:px-6 relative z-10 mt-16 pb-20">
      {/* Firebase Status Warning */}
      <FirebaseStatusBanner show={!auth} />
      
      {/* Performance Monitor - only show for admin */}
      {currentUser?.email === "amirahcolorado@gmail.com" && <PerformanceMonitor />}
      
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
        <div className="mb-4 p-3 bg-amber-50 border border-amber-300 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <p className="text-sm text-amber-700 font-medium">
              ⚠️ Currently showing demo room data
            </p>
          </div>
          <p className="text-xs text-amber-600">
            Your Firestore database appears to be empty or unreachable. 
            <button 
              onClick={() => window.open('https://console.firebase.google.com/project/jd-suites-backend/firestore', '_blank')}
              className="underline ml-1 hover:text-amber-800"
            >
              Check your Firestore console →
            </button>
          </p>
        </div>
      )}
      
      {hasSearched && (
        <div className="mt-6">
          <PaginatedRoomList 
            rooms={availableRooms}
            selectedRooms={selectedRooms}
            onSelectRoom={handleSelectRoom}
            bookingPeriod={bookingPeriod}
            roomAvailability={roomAvailability}
            isLoading={isLoading}
            currentPage={currentPage}
            totalPages={totalPages}
            totalResults={totalResults}
            onPageChange={setCurrentPage}
          />
        </div>
      )}

      <FloatingBookButton 
        onBookNow={handleBookNow}
        disabled={selectedRooms.length === 0}
      />

      {bookingDetails && (
        <LazyPaymentModal
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