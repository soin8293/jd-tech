
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";

const Index = () => {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background">
      <div className="container px-4 py-16 text-center">
        <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold mb-6 bg-clip-text text-transparent bg-gradient-to-r from-primary to-indigo-500">
          Welcome to Luxury Hotels
        </h1>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-8">
          Experience the ultimate comfort and luxury. Book your stay at our premium hotel locations and enjoy world-class amenities.
        </p>
        <Link to="/hotel">
          <Button size="lg" className="gap-2">
            Browse Rooms
            <ArrowRight className="h-4 w-4" />
          </Button>
        </Link>
      </div>
      
      <div className="w-full py-12 bg-muted">
        <div className="container px-4 grid gap-8 md:grid-cols-3 max-w-5xl mx-auto text-center">
          <div className="p-6 rounded-lg">
            <h3 className="text-xl font-medium mb-2">Luxury Accommodations</h3>
            <p className="text-muted-foreground">
              Our rooms and suites are designed for your comfort with premium furnishings and amenities.
            </p>
          </div>
          <div className="p-6 rounded-lg">
            <h3 className="text-xl font-medium mb-2">Exclusive Services</h3>
            <p className="text-muted-foreground">
              Enjoy 24/7 room service, spa treatments, and personalized concierge assistance.
            </p>
          </div>
          <div className="p-6 rounded-lg">
            <h3 className="text-xl font-medium mb-2">Prime Locations</h3>
            <p className="text-muted-foreground">
              Located in the heart of the city with easy access to major attractions and business centers.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;
