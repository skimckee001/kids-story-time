import { useState } from 'react';
import { Button } from '@/components/ui/button.jsx';
import { Input } from '@/components/ui/input.jsx';
import { Label } from '@/components/ui/label.jsx';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card.jsx';
import { Badge } from '@/components/ui/badge.jsx';
import { User, Plus, X, Edit2, Save } from 'lucide-react';

export function ChildProfile({ child, onUpdate, onSelect, isSelected }) {
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({
    name: child?.name || '',
    age: child?.age || '',
    favorite_items: child?.favorite_items || []
  });
  const [newItem, setNewItem] = useState('');

  const handleSave = () => {
    onUpdate(child.id, editData);
    setIsEditing(false);
  };

  const addFavoriteItem = () => {
    if (newItem.trim() && !editData.favorite_items.includes(newItem.trim())) {
      setEditData({
        ...editData,
        favorite_items: [...editData.favorite_items, newItem.trim()]
      });
      setNewItem('');
    }
  };

  const removeFavoriteItem = (item) => {
    setEditData({
      ...editData,
      favorite_items: editData.favorite_items.filter(i => i !== item)
    });
  };

  return (
    <Card className={`cursor-pointer transition-all duration-200 ${
      isSelected 
        ? 'ring-2 ring-purple-500 bg-purple-50' 
        : 'hover:shadow-lg hover:scale-105'
    }`}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3" onClick={() => onSelect(child)}>
            <div className="p-2 bg-purple-100 rounded-full">
              <User className="h-5 w-5 text-purple-600" />
            </div>
            <div>
              {isEditing ? (
                <Input
                  value={editData.name}
                  onChange={(e) => setEditData({...editData, name: e.target.value})}
                  className="text-lg font-semibold"
                  onClick={(e) => e.stopPropagation()}
                />
              ) : (
                <CardTitle className="text-lg">{child.name}</CardTitle>
              )}
              {isEditing ? (
                <Input
                  type="number"
                  value={editData.age}
                  onChange={(e) => setEditData({...editData, age: parseInt(e.target.value) || ''})}
                  placeholder="Age"
                  className="text-sm mt-1"
                  onClick={(e) => e.stopPropagation()}
                />
              ) : (
                child.age && <CardDescription>Age: {child.age}</CardDescription>
              )}
            </div>
          </div>
          
          <div className="flex space-x-2">
            {isEditing ? (
              <Button
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  handleSave();
                }}
                className="bg-green-600 hover:bg-green-700"
              >
                <Save className="h-4 w-4" />
              </Button>
            ) : (
              <Button
                size="sm"
                variant="outline"
                onClick={(e) => {
                  e.stopPropagation();
                  setIsEditing(true);
                }}
              >
                <Edit2 className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      
      <CardContent>
        <div className="space-y-3">
          <div>
            <Label className="text-sm font-medium text-gray-700">Favorite Things</Label>
            <div className="flex flex-wrap gap-2 mt-2">
              {editData.favorite_items.map((item, index) => (
                <Badge key={index} variant="secondary" className="flex items-center space-x-1">
                  <span>{item}</span>
                  {isEditing && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        removeFavoriteItem(item);
                      }}
                      className="ml-1 hover:text-red-600"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  )}
                </Badge>
              ))}
            </div>
            
            {isEditing && (
              <div className="flex space-x-2 mt-2">
                <Input
                  value={newItem}
                  onChange={(e) => setNewItem(e.target.value)}
                  placeholder="Add favorite item"
                  className="flex-1"
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      addFavoriteItem();
                    }
                  }}
                  onClick={(e) => e.stopPropagation()}
                />
                <Button
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    addFavoriteItem();
                  }}
                  disabled={!newItem.trim()}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>
          
          {isSelected && (
            <div className="pt-2 border-t">
              <Badge className="bg-purple-600">Selected</Badge>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export function CreateChildForm({ onCreateChild, parentId }) {
  const [formData, setFormData] = useState({
    name: '',
    age: '',
    favorite_items: []
  });
  const [newItem, setNewItem] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const addFavoriteItem = () => {
    if (newItem.trim() && !formData.favorite_items.includes(newItem.trim())) {
      setFormData({
        ...formData,
        favorite_items: [...formData.favorite_items, newItem.trim()]
      });
      setNewItem('');
    }
  };

  const removeFavoriteItem = (item) => {
    setFormData({
      ...formData,
      favorite_items: formData.favorite_items.filter(i => i !== item)
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) return;

    setIsSubmitting(true);
    try {
      await onCreateChild({
        ...formData,
        age: formData.age ? parseInt(formData.age) : null,
        parent_id: parentId
      });
      
      // Reset form
      setFormData({
        name: '',
        age: '',
        favorite_items: []
      });
    } catch (error) {
      console.error('Error creating child:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="border-dashed border-2 border-purple-300 bg-purple-50/50">
      <CardHeader>
        <CardTitle className="text-lg flex items-center space-x-2">
          <Plus className="h-5 w-5" />
          <span>Add New Child</span>
        </CardTitle>
        <CardDescription>
          Create a profile for your child to get personalized stories
        </CardDescription>
      </CardHeader>
      
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="child-name">Child's Name *</Label>
            <Input
              id="child-name"
              value={formData.name}
              onChange={(e) => setFormData({...formData, name: e.target.value})}
              placeholder="Enter child's name"
              required
            />
          </div>
          
          <div>
            <Label htmlFor="child-age">Age (optional)</Label>
            <Input
              id="child-age"
              type="number"
              value={formData.age}
              onChange={(e) => setFormData({...formData, age: e.target.value})}
              placeholder="Enter age"
              min="1"
              max="18"
            />
          </div>
          
          <div>
            <Label>Favorite Things</Label>
            <div className="flex flex-wrap gap-2 mt-2 mb-2">
              {formData.favorite_items.map((item, index) => (
                <Badge key={index} variant="secondary" className="flex items-center space-x-1">
                  <span>{item}</span>
                  <button
                    type="button"
                    onClick={() => removeFavoriteItem(item)}
                    className="ml-1 hover:text-red-600"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
            </div>
            
            <div className="flex space-x-2">
              <Input
                value={newItem}
                onChange={(e) => setNewItem(e.target.value)}
                placeholder="Add favorite item (toy, place, activity...)"
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    addFavoriteItem();
                  }
                }}
              />
              <Button
                type="button"
                size="sm"
                onClick={addFavoriteItem}
                disabled={!newItem.trim()}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </div>
          
          <Button
            type="submit"
            className="w-full"
            disabled={!formData.name.trim() || isSubmitting}
          >
            {isSubmitting ? 'Creating...' : 'Create Child Profile'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

