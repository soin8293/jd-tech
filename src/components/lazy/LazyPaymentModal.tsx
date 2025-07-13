import { lazy, Suspense } from "react";
import { BookingDetails } from "@/types/hotel.types";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";

const PaymentModal = lazy(() => import("@/components/payment/PaymentModal"));

interface LazyPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  bookingDetails: BookingDetails | null;
  onPaymentComplete: () => void;
}

const PaymentModalSkeleton = () => (
  <Dialog open>
    <DialogContent className="sm:max-w-md">
      <div className="space-y-4">
        <Skeleton className="h-6 w-3/4" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-10 w-full" />
      </div>
    </DialogContent>
  </Dialog>
);

const LazyPaymentModal: React.FC<LazyPaymentModalProps> = (props) => {
  if (!props.isOpen) return null;

  return (
    <Suspense fallback={<PaymentModalSkeleton />}>
      <PaymentModal {...props} />
    </Suspense>
  );
};

export default LazyPaymentModal;