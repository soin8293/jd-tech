import React, { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Layout, 
  Plus, 
  Filter, 
  Download, 
  Upload,
  Copy,
  Settings,
  Tag
} from "lucide-react";
import { useTemplates } from "@/hooks/template/useTemplates";
import { useCategories } from "@/hooks/template/useCategories";
import { TemplateList } from "./TemplateList";
import { TemplateForm } from "./TemplateForm";
import { CategoryManager } from "./CategoryManager";
import { TemplateFilters } from "./TemplateFilters";
import { BulkOperations } from "./BulkOperations";

interface TemplateManagerProps {
  onTemplateCreated?: (templateId: string) => void;
  onRoomCreated?: (roomId: string) => void;
  className?: string;
}

export const TemplateManager: React.FC<TemplateManagerProps> = ({
  onTemplateCreated,
  onRoomCreated,
  className = ""
}) => {
  const templates = useTemplates();
  const categories = useCategories();
  
  const [activeTab, setActiveTab] = useState('templates');
  const [showCreateTemplate, setShowCreateTemplate] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [showBulkOps, setShowBulkOps] = useState(false);
  const [selectedTemplates, setSelectedTemplates] = useState<string[]>([]);

  const handleCreateTemplate = async (templateData: any) => {
    const newTemplate = await templates.createTemplate(templateData, 'current-user-id');
    if (newTemplate && onTemplateCreated) {
      onTemplateCreated(newTemplate.id);
    }
    setShowCreateTemplate(false);
  };

  const handleCreateRoom = async (templateId: string) => {
    const room = await templates.createRoomFromTemplate(templateId);
    if (room && onRoomCreated) {
      onRoomCreated(room.id);
    }
  };

  const handleBulkOperation = (templateIds: string[]) => {
    setSelectedTemplates(templateIds);
    setShowBulkOps(true);
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Layout className="h-6 w-6 text-primary" />
          <div>
            <h2 className="text-2xl font-bold">Template & Category Management</h2>
            <p className="text-muted-foreground">
              Create and manage room templates and categories for consistent room creation
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="gap-1">
            <Tag className="h-3 w-3" />
            {categories.categories.length} Categories
          </Badge>
          <Badge variant="outline" className="gap-1">
            <Layout className="h-3 w-3" />
            {templates.templates.length} Templates
          </Badge>
        </div>
      </div>

      {/* Main Content */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Room Templates & Categories</CardTitle>
              <CardDescription>
                Manage room templates and categories to streamline room creation and ensure consistency
              </CardDescription>
            </div>
            
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowFilters(!showFilters)}
                className="gap-2"
              >
                <Filter className="h-4 w-4" />
                Filters
              </Button>
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowBulkOps(!showBulkOps)}
                className="gap-2"
                disabled={selectedTemplates.length === 0}
              >
                <Settings className="h-4 w-4" />
                Bulk Ops ({selectedTemplates.length})
              </Button>
              
              <Button
                onClick={() => setShowCreateTemplate(true)}
                className="gap-2"
              >
                <Plus className="h-4 w-4" />
                New Template
              </Button>
            </div>
          </div>
        </CardHeader>
        
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="templates">Templates ({templates.templates.length})</TabsTrigger>
              <TabsTrigger value="categories">Categories ({categories.categories.length})</TabsTrigger>
            </TabsList>
            
            <TabsContent value="templates" className="mt-6">
              <div className="space-y-4">
                {/* Filters */}
                {showFilters && (
                  <TemplateFilters
                    categories={categories.categories}
                    onFiltersChange={templates.applyFilters}
                    onClearFilters={templates.clearFilters}
                    activeFilters={templates.activeFilters}
                  />
                )}
                
                {/* Bulk Operations */}
                {showBulkOps && selectedTemplates.length > 0 && (
                  <BulkOperations
                    selectedTemplateIds={selectedTemplates}
                    categories={categories.categories}
                    onOperation={templates.performBulkOperation}
                    onClose={() => setShowBulkOps(false)}
                  />
                )}
                
                {/* Template List */}
                <TemplateList
                  templates={templates.templates}
                  categories={categories.categories}
                  isLoading={templates.isLoading}
                  selectedTemplates={selectedTemplates}
                  onTemplateSelect={setSelectedTemplates}
                  onCreateRoom={handleCreateRoom}
                  onEditTemplate={templates.updateTemplate}
                  onDeleteTemplate={templates.deleteTemplate}
                  onBulkAction={handleBulkOperation}
                />
              </div>
            </TabsContent>
            
            <TabsContent value="categories" className="mt-6">
              <CategoryManager
                categories={categories.categories}
                isLoading={categories.isLoading}
                onCreateCategory={categories.createCategory}
                onUpdateCategory={categories.updateCategory}
                onDeleteCategory={categories.deleteCategory}
              />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Template Creation Form */}
      {showCreateTemplate && (
        <TemplateForm
          categories={categories.categories}
          onSubmit={handleCreateTemplate}
          onCancel={() => setShowCreateTemplate(false)}
        />
      )}
    </div>
  );
};