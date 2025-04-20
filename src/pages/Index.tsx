
import { Link } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Building2, ArrowRight } from "lucide-react";

const Index = () => {
  const { toast } = useToast();

  return (
    <div className="min-h-screen pt-16">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-cyan-500 to-blue-500 py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl">
            <div className="flex items-center gap-3 mb-6">
              <Building2 className="h-12 w-12 text-white" />
              <h1 className="text-5xl md:text-7xl font-extralight text-white">
                JD Suites
              </h1>
            </div>
            <p className="text-xl text-white/90 mb-8">
              Experience luxury and comfort in our carefully curated selection of rooms and suites.
            </p>
            <Link to="/hotel">
              <Button size="lg" className="gap-2">
                Browse Rooms <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Features Section with Image Background */}
      <div className="relative">
        {/* Feature Cards */}
        <div className="container mx-auto px-4 py-16 relative z-10">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="bg-white/95 backdrop-blur-sm">
              <CardHeader>
                <CardTitle>Luxury Rooms</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Choose from our selection of premium rooms and suites, each designed for your comfort.
                </p>
              </CardContent>
            </Card>
            
            <Card className="bg-white/95 backdrop-blur-sm">
              <CardHeader>
                <CardTitle>Easy Booking</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Book your stay with our simple and secure online booking system.
                </p>
              </CardContent>
            </Card>
            
            <Card className="bg-white/95 backdrop-blur-sm">
              <CardHeader>
                <CardTitle>24/7 Support</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Our dedicated team is always available to assist you with any needs.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Background Image */}
        <div className="absolute inset-0 w-full h-full -z-0">
          <img 
            src="/lovable-uploads/4abd0589-5c26-4b24-a377-de00e13215f9.png"
            alt="JD Suites Building"
            className="w-full h-full object-cover"
          />
        </div>
      </div>
    </div>
  );
};

export default Index;

