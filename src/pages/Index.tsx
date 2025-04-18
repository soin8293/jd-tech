
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";

const Index = () => {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background">
      <div className="container px-4 py-16 text-center">
        <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold mb-6 bg-clip-text text-transparent bg-gradient-to-r from-primary to-indigo-500">
          Welcome to JD Suites
        </h1>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-8">
          Experience authentic Nigerian hospitality in the heart of luxury, where traditional warmth meets modern comfort.
        </p>
        <Link to="/hotel">
          <Button size="lg" className="gap-2">
            Explore Our Suites
            <ArrowRight className="h-4 w-4" />
          </Button>
        </Link>
      </div>
      
      <div className="w-full py-12 bg-muted">
        <div className="container px-4 grid gap-8 md:grid-cols-3 max-w-5xl mx-auto text-center">
          <div className="p-6 rounded-lg">
            <h3 className="text-xl font-medium mb-2">Nigerian Elegance</h3>
            <p className="text-muted-foreground">
              Our suites blend contemporary design with authentic Nigerian elements for a unique stay experience.
            </p>
          </div>
          <div className="p-6 rounded-lg">
            <h3 className="text-xl font-medium mb-2">Local Cuisine</h3>
            <p className="text-muted-foreground">
              Enjoy our signature Nigerian dishes prepared by local chefs, alongside international favorites.
            </p>
          </div>
          <div className="p-6 rounded-lg">
            <h3 className="text-xl font-medium mb-2">Victoria Island Luxury</h3>
            <p className="text-muted-foreground">
              Perfectly situated in Victoria Island, Lagos, with easy access to business districts and cultural attractions.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;
