
import { Link } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Building2, ArrowRight } from "lucide-react";

const Index = () => {
  const { toast } = useToast();

  return (
    <div className="min-h-screen pt-16">
      {/* Hero Section with rounded corners */}
      <div className="bg-gradient-to-r from-cyan-500 to-blue-500 py-20 mb-12 rounded-lg">
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
      <div className="relative container mx-auto px-4 mb-16">
        {/* Image Background with subtle rounded corners */}
        <div className="absolute inset-0 w-full h-full -z-10 overflow-hidden">
          <img 
            src="/lovable-uploads/4abd0589-5c26-4b24-a377-de00e13215f9.png"
            alt="JD Suites Building"
            className="w-full h-full object-cover rounded-lg shadow-lg"
          />
        </div>
        
        {/* Feature Cards */}
        <div className="py-16">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="bg-white/95 backdrop-blur-sm shadow-md border-0">
              <CardHeader>
                <CardTitle>Nigerian Elegance</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Our suites blend contemporary design with authentic Nigerian elements for a unique stay experience.
                </p>
              </CardContent>
            </Card>
            
            <Card className="bg-white/95 backdrop-blur-sm shadow-md border-0">
              <CardHeader>
                <CardTitle>Local Cuisine</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Enjoy our signature Nigerian dishes prepared by local chefs, alongside international favorites.
                </p>
              </CardContent>
            </Card>
            
            <Card className="bg-white/95 backdrop-blur-sm shadow-md border-0">
              <CardHeader>
                <CardTitle>Prime Location</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Conveniently located in Rumukparali, Port Harcourt, with easy access to business districts and local attractions.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* AmirahCo Footer */}
      <footer className="bg-muted/50 py-8 mt-16">
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
