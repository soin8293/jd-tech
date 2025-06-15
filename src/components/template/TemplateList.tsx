import React, { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  MoreHorizontal, 
  Copy, 
  Edit, 
  Trash2, 
  Eye,
  Users,
  DollarSign,
  Calendar,
  TrendingUp
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { RoomTemplate, RoomCategory } from "@/types/template.types";
import { formatCurrency } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";

interface TemplateListProps {
  templates: RoomTemplate[];
  categories: RoomCategory[];
  isLoading: boolean;
  selectedTemplates: string[];
  onTemplateSelect: (templateIds: string[]) => void;
  onCreateRoom: (templateId: string) => void;
  onEditTemplate: (templateId: string, updates: Partial<RoomTemplate>) => void;
  onDeleteTemplate: (templateId: string) => void;
  onBulkAction: (templateIds: string[]) => void;
}

export const TemplateList: React.FC<TemplateListProps> = ({
  templates,
  categories,
  isLoading,
  selectedTemplates,
  onTemplateSelect,
  onCreateRoom,
  onEditTemplate,
  onDeleteTemplate,
  onBulkAction
}) => {
  const [selectAll, setSelectAll] = useState(false);

  const getCategoryName = (categoryId: string) => {
    return categories.find(cat => cat.id === categoryId)?.name || 'Unknown';
  };

  const getCategoryColor = (categoryId: string) => {
    return categories.find(cat => cat.id === categoryId)?.color || '#6b7280';
  };

  const handleSelectAll = (checked: boolean) => {
    setSelectAll(checked);
    if (checked) {
      onTemplateSelect(templates.map(t => t.id));
    } else {
      onTemplateSelect([]);
    }
  };

  const handleSelectTemplate = (templateId: string, checked: boolean) => {
    if (checked) {
      onTemplateSelect([...selectedTemplates, templateId]);
    } else {
      onTemplateSelect(selectedTemplates.filter(id => id !== templateId));
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-6">
              <div className="h-4 bg-muted rounded w-1/4 mb-2"></div>
              <div className="h-3 bg-muted rounded w-1/2"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (templates.length === 0) {
    return (
      <Card className="text-center py-12">
        <CardContent>
          <Copy className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <CardTitle className="mb-2">No Templates Found</CardTitle>
          <CardDescription>
            Create your first room template to get started with consistent room creation.
          </CardDescription>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Bulk Selection Header */}
      {templates.length > 0 && (
        <div className="flex items-center gap-4 p-4 bg-muted/50 rounded-lg">
          <Checkbox
            checked={selectAll}
            onCheckedChange={handleSelectAll}
          />
          <span className="text-sm text-muted-foreground">
            {selectedTemplates.length === 0 
              ? `Select templates for bulk operations (${templates.length} total)`
              : `${selectedTemplates.length} of ${templates.length} templates selected`
            }
          </span>
          {selectedTemplates.length > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => onBulkAction(selectedTemplates)}
              className="ml-auto"
            >
              Bulk Actions ({selectedTemplates.length})
            </Button>
          )}
        </div>
      )}

      {/* Template Cards */}
      <div className="grid gap-4">
        {templates.map((template) => (
          <Card key={template.id} className="hover:shadow-md transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3">
                  <Checkbox
                    checked={selectedTemplates.includes(template.id)}
                    onCheckedChange={(checked) => 
                      handleSelectTemplate(template.id, checked as boolean)
                    }
                  />
                  
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <CardTitle className="text-lg">{template.name}</CardTitle>
                      <Badge 
                        variant="outline"
                        style={{ 
                          borderColor: getCategoryColor(template.categoryId),
                          color: getCategoryColor(template.categoryId)
                        }}
                      >
                        {getCategoryName(template.categoryId)}
                      </Badge>
                      <Badge variant={template.isActive ? "default" : "secondary"}>
                        {template.isActive ? "Active" : "Inactive"}
                      </Badge>
                    </div>
                    <CardDescription className="line-clamp-2">
                      {template.description}
                    </CardDescription>
                  </div>
                </div>
                
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="bg-background border shadow-lg z-50">
                    <DropdownMenuItem onClick={() => onCreateRoom(template.id)}>
                      <Copy className="h-4 w-4 mr-2" />
                      Create Room
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => onEditTemplate(template.id, {})}>
                      <Edit className="h-4 w-4 mr-2" />
                      Edit Template
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem 
                      onClick={() => onDeleteTemplate(template.id)}
                      className="text-destructive focus:text-destructive"
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </CardHeader>
            
            <CardContent className="pt-0">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                <div className="flex items-center gap-2">
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">{formatCurrency(template.price)}</span>
                </div>
                
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-muted-foreground" />
                  <span>{template.capacity} guests</span>
                </div>
                
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                  <span>{template.usageCount} uses</span>
                </div>
                
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">
                    {formatDistanceToNow(template.updatedAt, { addSuffix: true })}
                  </span>
                </div>
              </div>
              
              {/* Amenities */}
              <div className="flex flex-wrap gap-1 mb-4">
                {template.amenities.slice(0, 3).map((amenity, index) => (
                  <Badge key={index} variant="secondary" className="text-xs">
                    {amenity}
                  </Badge>
                ))}
                {template.amenities.length > 3 && (
                  <Badge variant="outline" className="text-xs">
                    +{template.amenities.length - 3} more
                  </Badge>
                )}
              </div>
              
              {/* Actions */}
              <div className="flex gap-2">
                <Button 
                  onClick={() => onCreateRoom(template.id)}
                  className="flex-1"
                >
                  <Copy className="h-4 w-4 mr-2" />
                  Create Room
                </Button>
                <Button 
                  variant="outline"
                  onClick={() => onEditTemplate(template.id, {})}
                >
                  <Edit className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};