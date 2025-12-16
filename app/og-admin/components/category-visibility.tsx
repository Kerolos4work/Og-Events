"use client";

import { useState, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface Category {
  id: string;
  name: string;
  color: string;
  count: number;
}

interface CategoryVisibilityProps {
  categories?: Category[];
  onSaveComplete?: () => void;
}

export function CategoryVisibility({ categories = [], onSaveComplete }: CategoryVisibilityProps) {
  const [categoriesData, setCategoriesData] = useState<Category[]>(categories);
  const [visibleCategories, setVisibleCategories] = useState<Record<string, boolean>>(
    categories.reduce((acc, category) => {
      acc[category.id] = true; // All categories visible by default
      return acc;
    }, {} as Record<string, boolean>)
  );

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  // Fetch categories if not provided
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const { getSeats } = await import('../actions/seats');
        const seats = await getSeats();

        // Extract categories from seats
        const categoriesFromSeats = seats.reduce((acc: Record<string, Category>, seat) => {
          if (!acc[seat.category]) {
            // Generate a color based on category name
            const hue = seat.category.split('').reduce((acc: number, char: string) => acc + char.charCodeAt(0), 0) % 360;
            acc[seat.category] = {
              id: seat.category,
              name: seat.category,
              color: `hsl(${hue}, 70%, 50%)`,
              count: 0
            };
          }
          acc[seat.category]!.count++;
          return acc;
        }, {});

        setCategoriesData(Object.values(categoriesFromSeats));
      } catch (error: any) {
        toast.error(`Failed to load categories: ${error.message}`);
      }
    };

    if (categories.length === 0) {
      fetchCategories();
    }
  }, [categories.length]);

  // Load existing settings from database
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const { getCategorySettings } = await import('../actions/venue-category-settings');
        const settings = await getCategorySettings();

        // Merge with default settings (all visible)
        const mergedSettings = categoriesData.reduce((acc, category) => {
          acc[category.id] = settings[category.id] !== undefined ? settings[category.id] : true;
          return acc;
        }, {} as Record<string, boolean>);

        setVisibleCategories(mergedSettings);
        setLoading(false);
      } catch (error: any) {
        toast.error(`Failed to load category settings: ${error.message}`);
        setLoading(false);
      }
    };

    if (categoriesData.length > 0) {
      fetchSettings();
    }
  }, [categoriesData]);

  const handleToggle = (categoryId: string) => {
    const newVisibleCategories = {
      ...visibleCategories,
      [categoryId]: !visibleCategories[categoryId]
    };
    setVisibleCategories(newVisibleCategories);
    setHasChanges(true);
  };

  const toggleAll = (show: boolean) => {
    const newVisibleCategories = categoriesData.reduce((acc, category) => {
      acc[category.id] = show;
      return acc;
    }, {} as Record<string, boolean>);

    setVisibleCategories(newVisibleCategories);
    setHasChanges(true);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const { saveCategorySettings } = await import('../actions/venue-category-settings');
      await saveCategorySettings(visibleCategories);
      toast.success("Category visibility settings saved successfully!");
      setHasChanges(false);
      if (onSaveComplete) {
        onSaveComplete();
      }
    } catch (error: any) {
      toast.error(`Failed to save settings: ${error.message}`);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="flex justify-center items-center h-32">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle>Category Visibility</CardTitle>
          <div className="flex space-x-2">
            <button
              onClick={() => toggleAll(true)}
              className="text-xs px-2 py-1 bg-green-100 text-green-700 rounded hover:bg-green-200"
            >
              Show All
            </button>
            <button
              onClick={() => toggleAll(false)}
              className="text-xs px-2 py-1 bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
            >
              Hide All
            </button>
          </div>
        </div>
        <CardDescription>
          Toggle categories on/off to control which seats are displayed on the main page seat map
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {categoriesData.map((category) => (
            <div key={category.id} className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div
                  className="w-4 h-4 rounded"
                  style={{ backgroundColor: category.color }}
                />
                <span className="font-medium">{category.name}</span>
                {category.count !== undefined && (
                  <Badge variant="outline" className="ml-2">
                    {category.count} seats
                  </Badge>
                )}
              </div>
              <Switch
                checked={visibleCategories[category.id]}
                onCheckedChange={() => handleToggle(category.id)}
              />
            </div>
          ))}
        </div>

        <div className="mt-6 flex justify-end">
          <Button
            onClick={handleSave}
            disabled={!hasChanges || saving}
          >
            {saving ? "Saving..." : "Save Settings"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
