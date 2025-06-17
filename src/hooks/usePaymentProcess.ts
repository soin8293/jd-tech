
import { BookingDetails } from "@/types/hotel.types";
import { usePaymentProcessLogic } from "./payment/usePaymentProcessLogic";

export const usePaymentProcess = (
  isOpen: boolean,
  bookingDetails: BookingDetails | null,
  onPaymentComplete: () => void
) => {
  return usePaymentProcessLogic(isOpen, bookingDetails, onPaymentComplete);
};
