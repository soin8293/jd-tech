
import { Link } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Building2, ArrowRight, Star, MapPin, Wifi, Car } from "lucide-react";

const Index = () => {
  const { toast } = useToast();

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <div className="relative overflow-hidden bg-gradient-to-br from-cyan-500 via-blue-500 to-indigo-600 pt-16">
        {/* Background Pattern */}
        <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/20 via-blue-500/20 to-indigo-600/20 opacity-20" />
        <div className="absolute inset-0" style={{
          backgroundImage: `url("data:image/svg+xml,%3csvg width='60' height='60' xmlns='http://www.w3.org/2000/svg'%3e%3cdefs%3e%3cpattern id='a' patternUnits='userSpaceOnUse' width='60' height='60'%3e%3ccircle cx='30' cy='30' r='1' fill='%23ffffff' fill-opacity='0.1'/%3e%3c/pattern%3e%3c/defs%3e%3crect width='100%25' height='100%25' fill='url(%23a)'/%3e%3c/svg%3e")`,
          opacity: 0.3
        }} />
        
        <div className="relative container mx-auto px-4 py-16 lg:py-24">
          <div className="max-w-4xl mx-auto text-center">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm px-4 py-2 rounded-full text-white mb-6 animate-fade-in">
              <Star className="h-4 w-4 text-yellow-300" />
              <span className="text-sm font-medium">Premium Nigerian Hospitality</span>
            </div>

            {/* Main Heading */}
            <div className="mb-6 animate-slide-up" style={{ animationDelay: "0.2s", animationFillMode: "forwards", opacity: "0" }}>
              <div className="flex items-center justify-center gap-4 mb-3">
                <Building2 className="h-14 w-14 text-white/90" />
                <h1 className="text-5xl md:text-7xl font-bold text-white tracking-tight">
                  JD Suites
                </h1>
              </div>
              <div className="w-20 h-1 bg-gradient-to-r from-yellow-300 to-orange-300 mx-auto rounded-full" />
            </div>

            {/* Subtitle */}
            <p className="text-lg md:text-xl text-white/90 mb-8 max-w-3xl mx-auto leading-relaxed animate-slide-up" style={{ animationDelay: "0.4s", animationFillMode: "forwards", opacity: "0" }}>
              Where Nigerian elegance meets modern luxury. Experience exceptional hospitality in the heart of Port Harcourt.
            </p>

            {/* CTA Button */}
            <div className="animate-slide-up" style={{ animationDelay: "0.6s", animationFillMode: "forwards", opacity: "0" }}>
              <Link to="/hotel">
                <Button size="lg" className="bg-white text-primary hover:bg-white/90 px-8 py-3 text-lg font-medium shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105">
                  Explore Our Suites <ArrowRight className="h-5 w-5 ml-2" />
                </Button>
              </Link>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-3 gap-6 mt-12 text-white/80 animate-fade-in" style={{ animationDelay: "0.8s", animationFillMode: "forwards", opacity: "0" }}>
              <div className="text-center">
                <div className="text-2xl font-light mb-1">4.8</div>
                <div className="text-sm">Guest Rating</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-light mb-1">24/7</div>
                <div className="text-sm">Concierge</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-light mb-1">Premium</div>
                <div className="text-sm">Location</div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Bottom curve */}
        <div className="absolute bottom-0 left-0 right-0">
          <svg viewBox="0 0 1440 120" className="w-full h-auto">
            <path fill="hsl(var(--background))" d="M0,120 C240,0 480,0 720,40 C960,80 1200,40 1440,0 L1440,120 Z"/>
          </svg>
        </div>
      </div>

      {/* Features Section */}
      <div className="py-14 bg-secondary/30">
        <div className="container mx-auto px-4">
          {/* Section Header */}
          <div className="text-center mb-12">
            <h2 className="text-3xl font-light text-foreground mb-3">
              Why Choose JD Suites
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Experience the perfect blend of Nigerian hospitality and modern luxury
            </p>
          </div>

          {/* Feature Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            <Card className="group bg-card border-0 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-2">
              <CardHeader className="text-center pb-3">
                <div className="w-14 h-14 bg-gradient-to-br from-cyan-500 to-blue-500 rounded-full flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform duration-300">
                  <Building2 className="h-7 w-7 text-white" />
                </div>
                <CardTitle className="text-lg">Nigerian Elegance</CardTitle>
              </CardHeader>
              <CardContent className="text-center pt-0">
                <p className="text-muted-foreground leading-relaxed text-sm">
                  Our suites blend contemporary design with authentic Nigerian elements for a unique cultural experience.
                </p>
              </CardContent>
            </Card>
            
            <Card className="group bg-card border-0 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-2">
              <CardHeader className="text-center pb-3">
                <div className="w-14 h-14 bg-gradient-to-br from-orange-500 to-red-500 rounded-full flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform duration-300">
                  <Star className="h-7 w-7 text-white" />
                </div>
                <CardTitle className="text-lg">Premium Service</CardTitle>
              </CardHeader>
              <CardContent className="text-center pt-0">
                <p className="text-muted-foreground leading-relaxed text-sm">
                  24/7 concierge service and locally-inspired cuisine prepared by renowned Nigerian chefs.
                </p>
              </CardContent>
            </Card>
            
            <Card className="group bg-card border-0 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-2">
              <CardHeader className="text-center pb-3">
                <div className="w-14 h-14 bg-gradient-to-br from-green-500 to-emerald-500 rounded-full flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform duration-300">
                  <MapPin className="h-7 w-7 text-white" />
                </div>
                <CardTitle className="text-lg">Prime Location</CardTitle>
              </CardHeader>
              <CardContent className="text-center pt-0">
                <p className="text-muted-foreground leading-relaxed text-sm">
                  Strategically located in Rumukparali with easy access to business districts and cultural attractions.
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Amenities Banner */}
          <div className="mt-14 bg-gradient-to-r from-cyan-500/10 via-blue-500/10 to-indigo-600/10 rounded-2xl p-6 text-center">
            <h3 className="text-xl font-light mb-4">Premium Amenities</h3>
            <div className="flex flex-wrap justify-center gap-4 text-sm">
              <div className="flex items-center gap-2">
                <Wifi className="h-4 w-4 text-primary" />
                <span>High-Speed WiFi</span>
              </div>
              <div className="flex items-center gap-2">
                <Building2 className="h-4 w-4 text-primary" />
                <span>Business Center</span>
              </div>
              <div className="flex items-center gap-2">
                <Star className="h-4 w-4 text-primary" />
                <span>Spa Services</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* AmirahCo Footer */}
      <footer className="bg-muted/50 py-6 mt-12">
        <div className="container mx-auto px-4 text-center">
          <p className="text-sm text-muted-foreground">
            Powered by <span className="font-semibold text-primary">AmirahCo</span> - 
            Empowering people, organisations, and communities for an AI-dominated world through open, human-centred technology.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
