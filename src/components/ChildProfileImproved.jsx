import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button.jsx';
import { Input } from '@/components/ui/input.jsx';
import { Label } from '@/components/ui/label.jsx';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card.jsx';
import { Badge } from '@/components/ui/badge.jsx';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select.jsx';
import { Checkbox } from '@/components/ui/checkbox.jsx';
import { 
  User, Plus, X, Edit2, Save, BookOpen, Heart, 
  Sparkles, Users, Star, Palette, ChevronDown
} from 'lucide-react';
import { supabase } from '../lib/supabase';

// Simplified reading levels
const READING_LEVELS = [
  { value: 'preReader', label: 'Pre-Reader', age: '0-4 years' },
  { value: 'earlyReader', label: 'Early Reader', age: '4-6 years' },
  { value: 'beginningReader', label: 'Beginning Reader', age: '6-8 years' },
  { value: 'confidentReader', label: 'Confident Reader', age: '8-10 years' },
  { value: 'independentReader', label: 'Independent Reader', age: '10-12 years' },
  { value: 'advancedReader', label: 'Advanced Reader', age: '12+ years' }
];

// Story themes/categories
const STORY_THEMES = [
  { value: 'adventure', label: 'Adventure', icon: '🗺️' },
  { value: 'animals', label: 'Animals', icon: '🦁' },
  { value: 'fairytale', label: 'Fairy Tales', icon: '🏰' },
  { value: 'space', label: 'Space', icon: '🚀' },
  { value: 'underwater', label: 'Ocean', icon: '🐠' },
  { value: 'friendship', label: 'Friendship', icon: '🤝' },
  { value: 'mystery', label: 'Mystery', icon: '🔍' },
  { value: 'fantasy', label: 'Fantasy', icon: '🧙‍♂️' },
  { value: 'educational', label: 'Educational', icon: '📚' },
  { value: 'bedtime', label: 'Bedtime', icon: '🌙' }
];

export function ChildProfileImproved({ 
  child, 
  onUpdate, 
  onSelect, 
  isSelected,
  onDelete,
  compact = false 
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({
    name: child?.name || '',
    age: child?.age || '',
    gender: child?.gender || 'either',
    reading_level: child?.reading_level || 'beginningReader',
    favorite_themes: child?.favorite_themes || [],
    favorite_items: child?.favorite_items || [],
    include_name_in_stories: child?.include_name_in_stories !== false,
    is_default: child?.is_default || false
  });
  const [newItem, setNewItem] = useState('');

  useEffect(() => {
    setEditData({
      name: child?.name || '',
      age: child?.age || '',
      gender: child?.gender === 'neutral' ? 'either' : (child?.gender || 'either'),
      reading_level: child?.reading_level || 'beginningReader',
      favorite_themes: child?.favorite_themes || [],
      favorite_items: child?.favorite_items || [],
      include_name_in_stories: child?.include_name_in_stories !== false,
      is_default: child?.is_default || false
    });
  }, [child]);

  const handleSave = async () => {
    try {
      await onUpdate(child.id, editData);
      setIsEditing(false);
    } catch (error) {
      console.error('Error updating profile:', error);
    }
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

  const toggleTheme = (theme) => {
    if (editData.favorite_themes.includes(theme)) {
      setEditData({
        ...editData,
        favorite_themes: editData.favorite_themes.filter(t => t !== theme)
      });
    } else {
      setEditData({
        ...editData,
        favorite_themes: [...editData.favorite_themes, theme]
      });
    }
  };

  if (compact) {
    // Compact view for profile selector
    return (
      <button
        onClick={() => onSelect(child)}
        className={`p-3 rounded-lg border-2 transition-all text-left ${
          isSelected
            ? 'border-purple-500 bg-purple-50'
            : 'border-gray-200 hover:border-purple-300'
        }`}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className={`p-1.5 rounded-full ${
              child.gender === 'female' ? 'bg-pink-100' :
              child.gender === 'male' ? 'bg-blue-100' :
              'bg-purple-100'
            }`}>
              <User className={`h-4 w-4 ${
                child.gender === 'female' ? 'text-pink-600' :
                child.gender === 'male' ? 'text-blue-600' :
                'text-purple-600'
              }`} />
            </div>
            <div>
              <p className="font-medium">{child.name}</p>
              <p className="text-xs text-gray-500">
                {READING_LEVELS.find(l => l.value === child.reading_level)?.label}
              </p>
            </div>
          </div>
          {isSelected && <Badge className="text-xs">Active</Badge>}
        </div>
      </button>
    );
  }

  // Full profile card view
  return (
    <Card className={`transition-all duration-200 ${
      isSelected 
        ? 'ring-2 ring-purple-500 bg-purple-50' 
        : 'hover:shadow-lg'
    }`}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3" onClick={() => !isEditing && onSelect(child)}>
            <div className={`p-2 rounded-full ${
              child.gender === 'female' ? 'bg-pink-100' :
              child.gender === 'male' ? 'bg-blue-100' :
              'bg-purple-100'
            }`}>
              <User className={`h-5 w-5 ${
                child.gender === 'female' ? 'text-pink-600' :
                child.gender === 'male' ? 'text-blue-600' :
                'text-purple-600'
              }`} />
            </div>
            <div className="flex-1">
              {isEditing ? (
                <Input
                  value={editData.name}
                  onChange={(e) => setEditData({...editData, name: e.target.value})}
                  className="text-lg font-semibold mb-1"
                  placeholder="Child's name"
                  onClick={(e) => e.stopPropagation()}
                />
              ) : (
                <CardTitle className="text-lg flex items-center gap-2">
                  {child.name}
                  {child.is_default && (
                    <Badge variant="secondary" className="text-xs">Default</Badge>
                  )}
                </CardTitle>
              )}
              <div className="text-sm text-gray-600">
                {READING_LEVELS.find(l => l.value === child.reading_level)?.label} • 
                {' ' + READING_LEVELS.find(l => l.value === child.reading_level)?.age}
              </div>
            </div>
          </div>
          
          <div className="flex space-x-2">
            {isEditing ? (
              <>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsEditing(false);
                    setEditData({
                      name: child?.name || '',
                      age: child?.age || '',
                      gender: child?.gender === 'neutral' ? 'either' : (child?.gender || 'either'),
                      reading_level: child?.reading_level || 'beginningReader',
                      favorite_themes: child?.favorite_themes || [],
                      favorite_items: child?.favorite_items || [],
                      include_name_in_stories: child?.include_name_in_stories !== false
                    });
                  }}
                >
                  <X className="h-4 w-4" />
                </Button>
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
              </>
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
        {isEditing ? (
          // Edit Mode
          <div className="space-y-6">
            {/* Gender and Reading Level */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-sm font-medium text-gray-700 mb-2 block">Gender</Label>
                <Select
                  value={editData.gender}
                  onValueChange={(value) => setEditData({...editData, gender: value})}
                >
                  <SelectTrigger onClick={(e) => e.stopPropagation()}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="male">Boy</SelectItem>
                    <SelectItem value="female">Girl</SelectItem>
                    <SelectItem value="either">Either</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label className="text-sm font-medium text-gray-700 mb-2 block">Reading Level</Label>
                <Select
                  value={editData.reading_level}
                  onValueChange={(value) => setEditData({...editData, reading_level: value})}
                >
                  <SelectTrigger onClick={(e) => e.stopPropagation()}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {READING_LEVELS.map(level => (
                      <SelectItem key={level.value} value={level.value}>
                        <span className="font-medium">{level.label}</span>
                        <span className="text-gray-500 ml-2">({level.age})</span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Include Name Checkbox */}
            <div className="flex items-center space-x-2">
              <Checkbox
                id={`include-name-${child.id}`}
                checked={editData.include_name_in_stories}
                onCheckedChange={(checked) => 
                  setEditData({...editData, include_name_in_stories: checked})
                }
              />
              <Label htmlFor={`include-name-${child.id}`} className="text-sm">
                Include {editData.name || 'child'}'s name in stories
              </Label>
            </div>

            {/* Favorite Topics */}
            <div>
              <Label className="text-sm font-medium text-gray-700 mb-2 block">Favorite Topics</Label>
              <div className="flex flex-wrap gap-2">
                {STORY_THEMES.map(theme => (
                  <Badge
                    key={theme.value}
                    variant={editData.favorite_themes.includes(theme.value) ? 'default' : 'outline'}
                    className="cursor-pointer py-1.5"
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleTheme(theme.value);
                    }}
                  >
                    <span className="mr-1">{theme.icon}</span>
                    {theme.label}
                  </Badge>
                ))}
              </div>
            </div>

            {/* Favorite Things */}
            <div>
              <Label className="text-sm font-medium text-gray-700 mb-2 block">Favorite Things</Label>
              <div className="flex flex-wrap gap-2 mb-2">
                {editData.favorite_items.map((item, index) => (
                  <Badge key={index} variant="secondary" className="flex items-center space-x-1">
                    <span>{item}</span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        removeFavoriteItem(item);
                      }}
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
                  placeholder="Add favorite (toy, place, activity, people, character...)"
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
            </div>

            {/* Delete button */}
            {!child.is_default && onDelete && (
              <div className="pt-4 border-t">
                <Button
                  variant="destructive"
                  size="sm"
                  className="w-full"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (confirm(`Delete ${child.name}'s profile? This cannot be undone.`)) {
                      onDelete(child.id);
                    }
                  }}
                >
                  Delete Profile
                </Button>
              </div>
            )}
          </div>
        ) : (
          // View Mode
          <div className="space-y-3">
            {/* Favorite Topics */}
            {(child.favorite_themes || []).length > 0 && (
              <div>
                <Label className="text-xs font-medium text-gray-500 mb-1 block">Favorite Topics</Label>
                <div className="flex flex-wrap gap-1">
                  {(child.favorite_themes || []).map(themeValue => {
                    const theme = STORY_THEMES.find(t => t.value === themeValue);
                    return theme ? (
                      <Badge key={themeValue} variant="secondary" className="text-xs">
                        <span className="mr-1">{theme.icon}</span>
                        {theme.label}
                      </Badge>
                    ) : null;
                  })}
                </div>
              </div>
            )}

            {/* Favorite Things */}
            {(child.favorite_items || []).length > 0 && (
              <div>
                <Label className="text-xs font-medium text-gray-500 mb-1 block">Favorite Things</Label>
                <div className="flex flex-wrap gap-1">
                  {child.favorite_items.map((item, index) => (
                    <Badge key={index} variant="outline" className="text-xs">
                      {item}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
            
            {/* Selection indicator */}
            {isSelected && (
              <div className="pt-2 border-t">
                <Badge className="bg-purple-600">
                  <Star className="h-3 w-3 mr-1" />
                  Selected for Stories
                </Badge>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export function CreateChildProfileImproved({ onCreateChild, parentId }) {
  const [formData, setFormData] = useState({
    name: '',
    gender: 'either',
    reading_level: 'beginningReader',
    favorite_themes: [],
    favorite_items: [],
    include_name_in_stories: true
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

  const toggleTheme = (theme) => {
    if (formData.favorite_themes.includes(theme)) {
      setFormData({
        ...formData,
        favorite_themes: formData.favorite_themes.filter(t => t !== theme)
      });
    } else {
      setFormData({
        ...formData,
        favorite_themes: [...formData.favorite_themes, theme]
      });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) return;

    setIsSubmitting(true);
    try {
      await onCreateChild({
        ...formData,
        parent_id: parentId,
        is_default: false
      });
      
      // Reset form
      setFormData({
        name: '',
        gender: 'either',
        reading_level: 'beginningReader',
        favorite_themes: [],
        favorite_items: [],
        include_name_in_stories: true
      });
      setNewItem('');
    } catch (error) {
      console.error('Error creating child:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="border-2 border-dashed border-purple-300 bg-purple-50/30">
      <CardHeader>
        <CardTitle className="text-xl flex items-center gap-2">
          <div className="p-2 bg-purple-100 rounded-full">
            <Plus className="h-5 w-5 text-purple-600" />
          </div>
          Add New Child Profile
        </CardTitle>
        <CardDescription>
          Create a personalized profile for magical story experiences
        </CardDescription>
      </CardHeader>
      
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information Section */}
          <div className="space-y-4">
            <h3 className="font-medium text-gray-900 pb-2 border-b">Basic Information</h3>
            
            {/* Child's Name */}
            <div className="space-y-2">
              <Label htmlFor="child-name" className="text-sm font-medium">
                Child's Name *
              </Label>
              <Input
                id="child-name"
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                placeholder="Enter your child's name"
                className="mt-1"
                required
              />
              
              {/* Include Name Checkbox - right under name field */}
              <div className="flex items-center space-x-2 mt-2">
                <Checkbox
                  id="include-name-new"
                  checked={formData.include_name_in_stories}
                  onCheckedChange={(checked) => 
                    setFormData({...formData, include_name_in_stories: checked})
                  }
                />
                <Label htmlFor="include-name-new" className="text-sm text-gray-600">
                  Include child's name in stories
                </Label>
              </div>
            </div>

            {/* Gender and Reading Level */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="gender" className="text-sm font-medium">
                  Gender
                </Label>
                <Select
                  value={formData.gender}
                  onValueChange={(value) => setFormData({...formData, gender: value})}
                >
                  <SelectTrigger id="gender" className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="male">Boy</SelectItem>
                    <SelectItem value="female">Girl</SelectItem>
                    <SelectItem value="either">Either</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="reading-level" className="text-sm font-medium">
                  Reading Level *
                </Label>
                <Select
                  value={formData.reading_level}
                  onValueChange={(value) => setFormData({...formData, reading_level: value})}
                >
                  <SelectTrigger id="reading-level" className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {READING_LEVELS.map(level => (
                      <SelectItem key={level.value} value={level.value}>
                        <div className="flex items-center justify-between w-full">
                          <span className="font-medium">{level.label}</span>
                          <span className="text-xs text-gray-500 ml-2">{level.age}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Preferences Section */}
          <div className="space-y-4">
            <h3 className="font-medium text-gray-900 pb-2 border-b">
              Select Your Preset Preferences
            </h3>
            
            {/* Favorite Topics */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">
                Favorite Topics
              </Label>
              <p className="text-xs text-gray-500 mb-2">
                Choose story themes your child enjoys
              </p>
              <div className="flex flex-wrap gap-2 mt-1">
                {STORY_THEMES.map(theme => (
                  <Badge
                    key={theme.value}
                    variant={formData.favorite_themes.includes(theme.value) ? 'default' : 'outline'}
                    className="cursor-pointer py-1.5 px-3"
                    onClick={(e) => {
                      e.preventDefault();
                      toggleTheme(theme.value);
                    }}
                  >
                    <span className="mr-1">{theme.icon}</span>
                    {theme.label}
                  </Badge>
                ))}
              </div>
            </div>
            
            {/* Favorite Things */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">
                Favorite Things
              </Label>
              <p className="text-xs text-gray-500 mb-2">
                Add things to include in stories
              </p>
              
              {formData.favorite_items.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-2">
                  {formData.favorite_items.map((item, index) => (
                    <Badge key={index} variant="secondary" className="flex items-center gap-1">
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
              )}
              
              <div className="flex gap-2">
                <Input
                  value={newItem}
                  onChange={(e) => setNewItem(e.target.value)}
                  placeholder="Add favorite (toy, place, activity, people, character...)"
                  className="flex-1"
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
                  className="px-3"
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
          
          {/* Submit Button */}
          <div className="pt-4">
            <Button
              type="submit"
              className="w-full bg-purple-600 hover:bg-purple-700 py-2"
              disabled={!formData.name.trim() || isSubmitting}
            >
              {isSubmitting ? (
                <span className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Creating Profile...
                </span>
              ) : (
                <span className="flex items-center justify-center">
                  <Sparkles className="mr-2 h-4 w-4" />
                  Create Child Profile
                </span>
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}