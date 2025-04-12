
import React, { useState, useEffect } from "react";
import { Room, RoomFormData } from "@/types/hotel.types";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { PlusCircle, Pencil, TrashIcon, X, Plus, Check } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import RoomCard from "./RoomCard";

interface RoomManagerProps {
  initialRooms: Room[];
  onSaveRooms: (rooms: Room[]) => void;
}

const defaultRoom: RoomFormData = {
  name: "New Room",
  description: "Description of the new room",
  price: 250,
  capacity: 2,
  size: 400,
  bed: "Queen",
  amenities: ["Free Wi-Fi", "TV", "Air Conditioning"],
  images: ["https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&w=1000"],
  availability: true
};

const RoomManager: React.FC<RoomManagerProps> = ({ initialRooms, onSaveRooms }) => {
  const { toast } = useToast();
  const [rooms, setRooms] = useState<Room[]>(initialRooms);
  const [editingRoom, setEditingRoom] = useState<RoomFormData | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [newAmenity, setNewAmenity] = useState('');
  const [newImageUrl, setNewImageUrl] = useState('');
  const [activeTab, setActiveTab] = useState('view');

  const handleAddRoom = () => {
    setEditingRoom({ ...defaultRoom });
    setIsAdding(true);
    setActiveTab('edit');
  };

  const handleEditRoom = (room: Room) => {
    setEditingRoom({ ...room });
    setIsAdding(false);
    setActiveTab('edit');
  };

  const handleDeleteRoom = (roomId: string) => {
    const updatedRooms = rooms.filter(room => room.id !== roomId);
    setRooms(updatedRooms);
    onSaveRooms(updatedRooms);
    
    toast({
      title: "Room deleted",
      description: "The room has been removed from your offerings",
    });
  };

  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    if (!editingRoom) return;
    
    const { name, value, type } = e.target;
    
    setEditingRoom(prev => {
      if (!prev) return prev;
      
      if (type === 'number') {
        return { ...prev, [name]: parseFloat(value) || 0 };
      }
      
      return { ...prev, [name]: value };
    });
  };

  const handleSwitchChange = (checked: boolean) => {
    if (!editingRoom) return;
    setEditingRoom({ ...editingRoom, availability: checked });
  };

  const handleAddAmenity = () => {
    if (!editingRoom || !newAmenity.trim()) return;
    
    if (!editingRoom.amenities.includes(newAmenity.trim())) {
      setEditingRoom({
        ...editingRoom,
        amenities: [...editingRoom.amenities, newAmenity.trim()]
      });
    }
    
    setNewAmenity('');
  };

  const handleRemoveAmenity = (amenity: string) => {
    if (!editingRoom) return;
    
    setEditingRoom({
      ...editingRoom,
      amenities: editingRoom.amenities.filter(a => a !== amenity)
    });
  };

  const handleAddImage = () => {
    if (!editingRoom || !newImageUrl.trim()) return;
    
    if (!editingRoom.images.includes(newImageUrl.trim())) {
      setEditingRoom({
        ...editingRoom,
        images: [...editingRoom.images, newImageUrl.trim()]
      });
    }
    
    setNewImageUrl('');
  };

  const handleRemoveImage = (image: string) => {
    if (!editingRoom) return;
    
    setEditingRoom({
      ...editingRoom,
      images: editingRoom.images.filter(img => img !== image)
    });
  };

  const handleSaveRoom = () => {
    if (!editingRoom) return;
    
    // Validate required fields
    if (!editingRoom.name || !editingRoom.price || editingRoom.images.length === 0) {
      toast({
        title: "Missing information",
        description: "Please fill in all required fields (name, price, and at least one image).",
        variant: "destructive",
      });
      return;
    }
    
    let updatedRooms: Room[];
    const roomToSave: Room = {
      ...editingRoom,
      id: editingRoom.id || `room-${Date.now()}` // Generate ID for new rooms
    };
    
    if (isAdding) {
      updatedRooms = [...rooms, roomToSave];
    } else {
      updatedRooms = rooms.map(room => 
        room.id === roomToSave.id ? roomToSave : room
      );
    }
    
    setRooms(updatedRooms);
    onSaveRooms(updatedRooms);
    
    setEditingRoom(null);
    setActiveTab('view');
    
    toast({
      title: isAdding ? "Room added" : "Room updated",
      description: `The room has been ${isAdding ? 'added to' : 'updated in'} your offerings.`,
    });
  };

  const handleCancelEdit = () => {
    setEditingRoom(null);
    setActiveTab('view');
  };

  return (
    <div className="w-full">
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <div className="flex justify-between items-center mb-4">
          <TabsList>
            <TabsTrigger value="view">View Rooms</TabsTrigger>
            <TabsTrigger value="edit" disabled={!editingRoom}>
              {isAdding ? "Add New Room" : "Edit Room"}
            </TabsTrigger>
          </TabsList>
          
          {activeTab === 'view' && (
            <Button onClick={handleAddRoom} className="gap-1">
              <PlusCircle className="h-4 w-4" />
              Add Room
            </Button>
          )}
        </div>
        
        <TabsContent value="view" className="mt-4">
          {rooms.length > 0 ? (
            <div className="grid grid-cols-1 gap-6 animate-fade-in">
              {rooms.map((room) => (
                <div key={room.id} className="relative">
                  <RoomCard
                    room={room}
                    onSelect={() => {}}
                    className="pr-16"
                  />
                  <div className="absolute top-4 right-4 flex flex-col gap-1">
                    <Button 
                      variant="outline" 
                      size="icon"
                      onClick={() => handleEditRoom(room)}
                      className="h-8 w-8"
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button 
                      variant="outline" 
                      size="icon"
                      onClick={() => handleDeleteRoom(room.id)}
                      className="h-8 w-8 text-destructive hover:text-destructive"
                    >
                      <TrashIcon className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 bg-secondary/50 rounded-lg">
              <h3 className="text-xl font-medium mb-2">No rooms available</h3>
              <p className="text-muted-foreground mb-4">
                Add your first room to start attracting guests
              </p>
              <Button onClick={handleAddRoom}>
                <PlusCircle className="h-4 w-4 mr-2" />
                Add Your First Room
              </Button>
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="edit" className="mt-4">
          {editingRoom && (
            <Card>
              <CardHeader>
                <CardTitle>{isAdding ? "Add New Room" : "Edit Room"}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Room Name*</Label>
                    <Input 
                      id="name" 
                      name="name"
                      value={editingRoom.name} 
                      onChange={handleFormChange}
                      placeholder="Deluxe Room"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="price">Price per Night (USD)*</Label>
                    <Input 
                      id="price" 
                      name="price"
                      type="number"
                      value={editingRoom.price} 
                      onChange={handleFormChange}
                      placeholder="300"
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea 
                    id="description" 
                    name="description"
                    value={editingRoom.description} 
                    onChange={handleFormChange}
                    placeholder="Elegant and spacious room with premium amenities..."
                    rows={3}
                  />
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="capacity">Max Guests</Label>
                    <Input 
                      id="capacity" 
                      name="capacity"
                      type="number"
                      value={editingRoom.capacity} 
                      onChange={handleFormChange}
                      placeholder="2"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="size">Size (sq ft)</Label>
                    <Input 
                      id="size" 
                      name="size"
                      type="number"
                      value={editingRoom.size} 
                      onChange={handleFormChange}
                      placeholder="400"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="bed">Bed Type</Label>
                    <Input 
                      id="bed" 
                      name="bed"
                      value={editingRoom.bed} 
                      onChange={handleFormChange}
                      placeholder="King"
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <Label>Availability</Label>
                    <Switch 
                      checked={editingRoom.availability}
                      onCheckedChange={handleSwitchChange}
                    />
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {editingRoom.availability 
                      ? "This room is available for booking"
                      : "This room is not available for booking"
                    }
                  </p>
                </div>
                
                <Separator />
                
                <div className="space-y-3">
                  <Label>Amenities</Label>
                  <div className="flex flex-wrap gap-2">
                    {editingRoom.amenities.map((amenity, index) => (
                      <Badge 
                        key={index} 
                        variant="secondary"
                        className="flex items-center gap-1 py-1"
                      >
                        {amenity}
                        <button
                          onClick={() => handleRemoveAmenity(amenity)}
                          className="ml-1 rounded-full hover:bg-muted p-0.5"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <Input
                      value={newAmenity}
                      onChange={(e) => setNewAmenity(e.target.value)}
                      placeholder="Add new amenity"
                      className="flex-1"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleAddAmenity();
                        }
                      }}
                    />
                    <Button 
                      type="button" 
                      onClick={handleAddAmenity}
                      variant="outline"
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                
                <Separator />
                
                <div className="space-y-3">
                  <Label>Images*</Label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                    {editingRoom.images.map((image, index) => (
                      <div key={index} className="relative group rounded-md overflow-hidden h-24">
                        <img 
                          src={image} 
                          alt={`Room preview ${index + 1}`}
                          className="w-full h-full object-cover"
                        />
                        <button
                          onClick={() => handleRemoveImage(image)}
                          className="absolute top-1 right-1 bg-background/80 rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <Input
                      value={newImageUrl}
                      onChange={(e) => setNewImageUrl(e.target.value)}
                      placeholder="Enter image URL"
                      className="flex-1"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleAddImage();
                        }
                      }}
                    />
                    <Button 
                      type="button" 
                      onClick={handleAddImage}
                      variant="outline"
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Add URLs for room images. At least one image is required.
                  </p>
                </div>
              </CardContent>
              <CardFooter className="flex justify-between">
                <Button 
                  variant="outline" 
                  onClick={handleCancelEdit}
                >
                  Cancel
                </Button>
                <Button 
                  onClick={handleSaveRoom}
                  className="gap-1"
                >
                  <Check className="h-4 w-4" />
                  {isAdding ? "Add Room" : "Save Changes"}
                </Button>
              </CardFooter>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default RoomManager;
