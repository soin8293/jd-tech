
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { Toaster } from "@/components/ui/toaster";
import { AuthProvider } from "@/contexts/AuthContext";
import Header from "@/components/layout/Header";
import ScrollToTop from "@/components/layout/ScrollToTop";
import Index from "@/pages/Index";
import Hotel from "@/pages/Hotel";
import RoomManagement from "@/pages/RoomManagement";
import MyBookings from "@/pages/MyBookings";
import NotFound from "@/pages/NotFound";
import "./App.css";

function App() {
  return (
    <AuthProvider>
      <Router>
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
      </Router>
    </AuthProvider>
  );
}

export default App;

