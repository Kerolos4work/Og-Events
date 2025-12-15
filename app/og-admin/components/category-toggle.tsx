"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

interface Category {
  id: string;
  name: string;
  color: string;
  count?: number;
}

interface CategoryToggleProps {
  categories: Category[];
  onToggleChange?: (categoryId: string, isVisible: boolean) => void;
}

export function CategoryToggle({ categories, onToggleChange }: CategoryToggleProps) {
  const [visibleCategories, setVisibleCategories] = useState<Record<string, boolean>>(
    categories.reduce((acc, category) => {
      acc[category.id] = true; // All categories visible by default
      return acc;
    }, {} as Record<string, boolean>)
  );

  const handleToggle = (categoryId: string) => {
    const newVisibleCategories = {
      ...visibleCategories,
      [categoryId]: !visibleCategories[categoryId]
    };
    setVisibleCategories(newVisibleCategories);

    if (onToggleChange) {
      onToggleChange(categoryId, newVisibleCategories[categoryId]);
    }
  };

  const toggleAll = (show: boolean) => {
    const newVisibleCategories = categories.reduce((acc, category) => {
      acc[category.id] = show;
      return acc;
    }, {} as Record<string, boolean>);

    setVisibleCategories(newVisibleCategories);

    if (onToggleChange) {
      categories.forEach(category => {
        onToggleChange(category.id, show);
      });
    }
  };

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
          Toggle categories on/off to control which seats are displayed on the seat map
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {categories.map((category) => (
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
      </CardContent>
    </Card>
  );
}
