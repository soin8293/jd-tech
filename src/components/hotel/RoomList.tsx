
import React from "react";
import { Room, BookingPeriod, RoomAvailabilityCheck } from "@/types/hotel.types";
import { Button } from "@/components/ui/button";
import { Loader2, PlusCircle } from "lucide-react";
import RoomCard from "./RoomCard";
import { format } from "date-fns"; // Added this import for date formatting
