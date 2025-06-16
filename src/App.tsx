
import { Routes, Route } from "react-router-dom";
import { Toaster } from "@/components/ui/toaster";
import Header from "@/components/layout/Header";
import ScrollToTop from "@/components/layout/ScrollToTop";
import Index from "@/pages/Index";
import Hotel from "@/pages/Hotel";
import RoomManagement from "@/pages/RoomManagement";
import MyBookings from "@/pages/MyBookings";
import NotFound from "@/pages/NotFound";
import AuthDebugPanel from "@/components/auth/AuthDebugPanel";
import "./App.css";

function App() {
  console.log("🔥 APP: App component rendering at:", new Date().toISOString());
  
  return (
    <>
      <ScrollToTop />
      <Header />
      <Routes>
        <Route path="/" element={<Index />} />
        <Route path="/hotel" element={<Hotel />} />
        <Route path="/room-management" element={<RoomManagement />} />
        <Route path="/my-bookings" element={<MyBookings />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
      <Toaster />
      <AuthDebugPanel />
    </>
  );
}

export default App;
