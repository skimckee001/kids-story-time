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
  Sparkles, Users, Star, Palette 
} from 'lucide-react';
import { supabase } from '../lib/supabase';

// Reading levels from the app
const READING_LEVELS = [
  { value: 'preReader', label: 'Pre-Reader (Ages 0-4)', description: 'Picture-focused stories' },
  { value: 'earlyReader', label: 'Early Reader (Ages 4-6)', description: 'Simple sentences' },
  { value: 'beginningReader', label: 'Beginning Reader (Ages 6-8)', description: 'Short paragraphs' },
  { value: 'confidentReader', label: 'Confident Reader (Ages 8-10)', description: 'Chapter stories' },
  { value: 'independentReader', label: 'Independent Reader (Ages 10-12)', description: 'Complex narratives' },
  { value: 'advancedReader', label: 'Advanced Reader (Ages 12+)', description: 'Sophisticated themes' }
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

export function ChildProfileEnhanced({ 
  child, 
  onUpdate, 
  onSelect, 
  isSelected,
  onDelete 
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({
    name: child?.name || '',
    age: child?.age || '',
    gender: child?.gender || 'neutral',
    reading_level: child?.reading_level || 'beginningReader',
    favorite_themes: child?.favorite_themes || [],
    favorite_items: child?.favorite_items || [],
    include_name_in_stories: child?.include_name_in_stories !== false,
    is_default: child?.is_default || false
  });
  const [newItem, setNewItem] = useState('');

  useEffect(() => {
    // Update edit data when child changes
    setEditData({
      name: child?.name || '',
      age: child?.age || '',
      gender: child?.gender || 'neutral',
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

  const getAgeFromReadingLevel = (level) => {
    const levelMap = {
      'preReader': '0-4',
      'earlyReader': '4-6',
      'beginningReader': '6-8',
      'confidentReader': '8-10',
      'independentReader': '10-12',
      'advancedReader': '12+'
    };
    return levelMap[level] || '';
  };

  return (
    <Card className={`cursor-pointer transition-all duration-200 ${
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
                {isEditing ? (
                  <Select
                    value={editData.reading_level}
                    onValueChange={(value) => setEditData({...editData, reading_level: value})}
                  >
                    <SelectTrigger className="w-full" onClick={(e) => e.stopPropagation()}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {READING_LEVELS.map(level => (
                        <SelectItem key={level.value} value={level.value}>
                          {level.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <span>
                    {READING_LEVELS.find(l => l.value === child.reading_level)?.label || 
                     `Age ${child.age || getAgeFromReadingLevel(child.reading_level)}`}
                  </span>
                )}
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
                      gender: child?.gender || 'neutral',
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
        <div className="space-y-4">
          {/* Gender Selection (only in edit mode) */}
          {isEditing && (
            <div>
              <Label className="text-sm font-medium text-gray-700">Gender</Label>
              <div className="flex gap-2 mt-2">
                {['male', 'female', 'neutral'].map(gender => (
                  <Button
                    key={gender}
                    type="button"
                    size="sm"
                    variant={editData.gender === gender ? 'default' : 'outline'}
                    onClick={(e) => {
                      e.stopPropagation();
                      setEditData({...editData, gender});
                    }}
                  >
                    {gender.charAt(0).toUpperCase() + gender.slice(1)}
                  </Button>
                ))}
              </div>
            </div>
          )}

          {/* Include Name in Stories */}
          {isEditing && (
            <div className="flex items-center space-x-2">
              <Checkbox
                id="include-name"
                checked={editData.include_name_in_stories}
                onCheckedChange={(checked) => 
                  setEditData({...editData, include_name_in_stories: checked})
                }
              />
              <Label htmlFor="include-name" className="text-sm">
                Include {editData.name || 'child'}'s name in stories
              </Label>
            </div>
          )}

          {/* Favorite Themes */}
          <div>
            <Label className="text-sm font-medium text-gray-700">Favorite Story Types</Label>
            <div className="flex flex-wrap gap-2 mt-2">
              {isEditing ? (
                STORY_THEMES.map(theme => (
                  <Badge
                    key={theme.value}
                    variant={editData.favorite_themes.includes(theme.value) ? 'default' : 'outline'}
                    className="cursor-pointer"
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleTheme(theme.value);
                    }}
                  >
                    <span className="mr-1">{theme.icon}</span>
                    {theme.label}
                  </Badge>
                ))
              ) : (
                (child.favorite_themes || []).map(themeValue => {
                  const theme = STORY_THEMES.find(t => t.value === themeValue);
                  return theme ? (
                    <Badge key={themeValue} variant="secondary">
                      <span className="mr-1">{theme.icon}</span>
                      {theme.label}
                    </Badge>
                  ) : null;
                })
              )}
            </div>
          </div>

          {/* Favorite Items */}
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
                  placeholder="Add favorite item (toy, place, activity...)"
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
          
          {/* Selection indicator */}
          {isSelected && !isEditing && (
            <div className="pt-2 border-t">
              <Badge className="bg-purple-600">
                <Star className="h-3 w-3 mr-1" />
                Selected for Stories
              </Badge>
            </div>
          )}

          {/* Delete button (only in edit mode and not default profile) */}
          {isEditing && !child.is_default && onDelete && (
            <div className="pt-2 border-t">
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
      </CardContent>
    </Card>
  );
}

export function CreateChildProfileEnhanced({ onCreateChild, parentId }) {
  const [formData, setFormData] = useState({
    name: '',
    age: '',
    gender: 'neutral',
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
        age: formData.age ? parseInt(formData.age) : null,
        parent_id: parentId,
        is_default: false
      });
      
      // Reset form
      setFormData({
        name: '',
        age: '',
        gender: 'neutral',
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
    <Card className="border-dashed border-2 border-purple-300 bg-purple-50/50">
      <CardHeader>
        <CardTitle className="text-lg flex items-center space-x-2">
          <Plus className="h-5 w-5" />
          <span>Add New Child Profile</span>
        </CardTitle>
        <CardDescription>
          Create a personalized profile for your child
        </CardDescription>
      </CardHeader>
      
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Name and Gender */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="child-name">Child's Name *</Label>
              <Input
                id="child-name"
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                placeholder="Enter name"
                required
              />
            </div>
            
            <div>
              <Label>Gender</Label>
              <Select
                value={formData.gender}
                onValueChange={(value) => setFormData({...formData, gender: value})}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="male">Boy</SelectItem>
                  <SelectItem value="female">Girl</SelectItem>
                  <SelectItem value="neutral">Neutral</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          {/* Reading Level */}
          <div>
            <Label htmlFor="reading-level">Reading Level *</Label>
            <Select
              value={formData.reading_level}
              onValueChange={(value) => setFormData({...formData, reading_level: value})}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select reading level" />
              </SelectTrigger>
              <SelectContent>
                {READING_LEVELS.map(level => (
                  <SelectItem key={level.value} value={level.value}>
                    <div>
                      <div className="font-medium">{level.label}</div>
                      <div className="text-xs text-gray-500">{level.description}</div>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Include Name Checkbox */}
          <div className="flex items-center space-x-2">
            <Checkbox
              id="include-name-new"
              checked={formData.include_name_in_stories}
              onCheckedChange={(checked) => 
                setFormData({...formData, include_name_in_stories: checked})
              }
            />
            <Label htmlFor="include-name-new" className="text-sm">
              Include child's name in stories
            </Label>
          </div>
          
          {/* Favorite Themes */}
          <div>
            <Label>Favorite Story Types</Label>
            <div className="flex flex-wrap gap-2 mt-2">
              {STORY_THEMES.map(theme => (
                <Badge
                  key={theme.value}
                  variant={formData.favorite_themes.includes(theme.value) ? 'default' : 'outline'}
                  className="cursor-pointer"
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
          
          {/* Favorite Items */}
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
            className="w-full bg-purple-600 hover:bg-purple-700"
            disabled={!formData.name.trim() || isSubmitting}
          >
            {isSubmitting ? 'Creating...' : 'Create Child Profile'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}