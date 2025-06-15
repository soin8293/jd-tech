import React, { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { X, Settings, DollarSign, Tag, Package, ToggleLeft } from "lucide-react";
import { RoomCategory } from "@/types/template.types";

interface BulkOperationsProps {
  selectedTemplateIds: string[];
  categories: RoomCategory[];
  onOperation: (
    templateIds: string[],
    operation: 'update_price' | 'update_amenities' | 'change_category' | 'toggle_active',
    data: any
  ) => Promise<boolean>;
  onClose: () => void;
}

export const BulkOperations: React.FC<BulkOperationsProps> = ({
  selectedTemplateIds,
  categories,
  onOperation,
  onClose
}) => {
  const [operationType, setOperationType] = useState<string>('');
  const [operationData, setOperationData] = useState<any>({});
  const [isLoading, setIsLoading] = useState(false);

  const handleOperation = async () => {
    if (!operationType || selectedTemplateIds.length === 0) return;

    setIsLoading(true);
    try {
      const success = await onOperation(
        selectedTemplateIds,
        operationType as any,
        operationData
      );
      
      if (success) {
        onClose();
      }
    } catch (error) {
      console.error('Bulk operation failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setOperationType('');
    setOperationData({});
  };

  const renderOperationForm = () => {
    switch (operationType) {
      case 'update_price':
        return <PriceUpdateForm data={operationData} onChange={setOperationData} />;
      case 'update_amenities':
        return <AmenitiesUpdateForm data={operationData} onChange={setOperationData} />;
      case 'change_category':
        return <CategoryChangeForm data={operationData} onChange={setOperationData} categories={categories} />;
      case 'toggle_active':
        return <ToggleActiveForm data={operationData} onChange={setOperationData} />;
      default:
        return null;
    }
  };

  const canExecute = operationType && Object.keys(operationData).length > 0;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Bulk Operations
            </CardTitle>
            <CardDescription>
              Apply changes to {selectedTemplateIds.length} selected templates
            </CardDescription>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Operation Type Selection */}
        <div>
          <Label htmlFor="operation">Select Operation</Label>
          <Select value={operationType} onValueChange={(value) => {
            setOperationType(value);
            setOperationData({});
          }}>
            <SelectTrigger>
              <SelectValue placeholder="Choose an operation..." />
            </SelectTrigger>
            <SelectContent className="bg-background border shadow-lg z-50">
              <SelectItem value="update_price">
                <div className="flex items-center gap-2">
                  <DollarSign className="h-4 w-4" />
                  Update Prices
                </div>
              </SelectItem>
              <SelectItem value="update_amenities">
                <div className="flex items-center gap-2">
                  <Package className="h-4 w-4" />
                  Update Amenities
                </div>
              </SelectItem>
              <SelectItem value="change_category">
                <div className="flex items-center gap-2">
                  <Tag className="h-4 w-4" />
                  Change Category
                </div>
              </SelectItem>
              <SelectItem value="toggle_active">
                <div className="flex items-center gap-2">
                  <ToggleLeft className="h-4 w-4" />
                  Toggle Active Status
                </div>
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Operation Form */}
        {operationType && (
          <div className="border rounded-lg p-4 bg-muted/50">
            {renderOperationForm()}
          </div>
        )}

        {/* Selected Templates Info */}
        <div className="bg-background border rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <Badge variant="outline">{selectedTemplateIds.length} templates selected</Badge>
          </div>
          <p className="text-sm text-muted-foreground">
            This operation will be applied to all selected templates. This action cannot be undone.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2">
          <Button 
            onClick={handleOperation} 
            disabled={!canExecute || isLoading}
            className="flex-1"
          >
            {isLoading ? 'Processing...' : 'Execute Operation'}
          </Button>
          <Button variant="outline" onClick={resetForm}>
            Reset
          </Button>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

// Individual operation forms
const PriceUpdateForm: React.FC<{data: any; onChange: (data: any) => void}> = ({
  data, onChange
}) => {
  return (
    <div className="space-y-4">
      <div>
        <Label htmlFor="price">New Price per Night</Label>
        <Input
          id="price"
          type="number"
          value={data.price || ''}
          onChange={(e) => onChange({ price: parseFloat(e.target.value) || 0 })}
          placeholder="Enter new price..."
          min="0"
          step="0.01"
        />
      </div>
    </div>
  );
};

const AmenitiesUpdateForm: React.FC<{data: any; onChange: (data: any) => void}> = ({
  data, onChange
}) => {
  const [newAmenity, setNewAmenity] = useState('');
  const amenities = data.amenities || [];

  const addAmenity = () => {
    if (newAmenity.trim() && !amenities.includes(newAmenity.trim())) {
      onChange({ amenities: [...amenities, newAmenity.trim()] });
      setNewAmenity('');
    }
  };

  const removeAmenity = (amenity: string) => {
    onChange({ amenities: amenities.filter((a: string) => a !== amenity) });
  };

  return (
    <div className="space-y-4">
      <div>
        <Label>Replace Amenities</Label>
        <div className="flex gap-2 mb-2">
          <Input
            value={newAmenity}
            onChange={(e) => setNewAmenity(e.target.value)}
            placeholder="Add amenity..."
            onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addAmenity())}
          />
          <Button type="button" onClick={addAmenity} size="sm">
            Add
          </Button>
        </div>
        <div className="flex flex-wrap gap-2">
          {amenities.map((amenity: string, index: number) => (
            <Badge key={index} variant="secondary" className="gap-1">
              {amenity}
              <X 
                className="h-3 w-3 cursor-pointer" 
                onClick={() => removeAmenity(amenity)}
              />
            </Badge>
          ))}
        </div>
        <p className="text-xs text-muted-foreground mt-2">
          This will completely replace the amenities list for all selected templates.
        </p>
      </div>
    </div>
  );
};

const CategoryChangeForm: React.FC<{
  data: any; 
  onChange: (data: any) => void;
  categories: RoomCategory[];
}> = ({ data, onChange, categories }) => {
  return (
    <div className="space-y-4">
      <div>
        <Label htmlFor="category">New Category</Label>
        <Select
          value={data.categoryId || ''}
          onValueChange={(value) => onChange({ categoryId: value })}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select new category..." />
          </SelectTrigger>
          <SelectContent className="bg-background border shadow-lg z-50">
            {categories.map((category) => (
              <SelectItem key={category.id} value={category.id}>
                <div className="flex items-center gap-2">
                  <div 
                    className="w-3 h-3 rounded"
                    style={{ backgroundColor: category.color }}
                  />
                  {category.name}
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
};

const ToggleActiveForm: React.FC<{data: any; onChange: (data: any) => void}> = ({
  data, onChange
}) => {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <Label htmlFor="active">Active Status</Label>
          <p className="text-sm text-muted-foreground">
            Set templates as active or inactive
          </p>
        </div>
        <Switch
          id="active"
          checked={data.isActive ?? true}
          onCheckedChange={(checked) => onChange({ isActive: checked })}
        />
      </div>
    </div>
  );
};