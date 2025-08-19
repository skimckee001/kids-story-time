import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button.jsx';
import { Card, CardContent } from '@/components/ui/card.jsx';
import { Badge } from '@/components/ui/badge.jsx';
import { WifiOff, Wifi, Download, HardDrive, RefreshCw } from 'lucide-react';
import { offlineManager } from '../lib/offlineManager';

export function OfflineIndicator({ onOfflineStoriesClick }) {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [offlineCapabilities, setOfflineCapabilities] = useState(null);
  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => {
    const handleOnlineStatus = (event) => {
      setIsOnline(event.detail.isOnline);
    };

    const handleOnlineChange = () => setIsOnline(navigator.onLine);
    const handleOfflineChange = () => setIsOnline(navigator.onLine);

    // Listen to custom events from offline manager
    window.addEventListener('onlineStatusChanged', handleOnlineStatus);
    
    // Listen to native browser events as backup
    window.addEventListener('online', handleOnlineChange);
    window.addEventListener('offline', handleOfflineChange);

    // Load offline capabilities
    loadOfflineCapabilities();

    return () => {
      window.removeEventListener('onlineStatusChanged', handleOnlineStatus);
      window.removeEventListener('online', handleOnlineChange);
      window.removeEventListener('offline', handleOfflineChange);
    };
  }, []);

  const loadOfflineCapabilities = async () => {
    try {
      const capabilities = await offlineManager.getOfflineCapabilities();
      setOfflineCapabilities(capabilities);
    } catch (error) {
      console.error('Failed to load offline capabilities:', error);
    }
  };

  const formatBytes = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getStoragePercentage = () => {
    if (!offlineCapabilities || !offlineCapabilities.storageQuota) return 0;
    return (offlineCapabilities.storageUsed / offlineCapabilities.storageQuota) * 100;
  };

  if (!offlineCapabilities) {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 z-50">
      {/* Main Status Indicator */}
      <div className="flex items-center space-x-2">
        {!isOnline && (
          <Card className="bg-orange-50 border-orange-200 shadow-lg">
            <CardContent className="p-3">
              <div className="flex items-center space-x-2">
                <WifiOff className="h-4 w-4 text-orange-600" />
                <span className="text-sm font-medium text-orange-800">
                  Offline Mode
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowDetails(!showDetails)}
                  className="h-6 px-2 text-xs"
                >
                  {offlineCapabilities.offlineStories} stories
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {isOnline && (
          <Badge variant="secondary" className="bg-green-100 text-green-800 border-green-200">
            <Wifi className="h-3 w-3 mr-1" />
            Online
          </Badge>
        )}
      </div>

      {/* Detailed Offline Info */}
      {showDetails && (
        <Card className="mt-2 bg-white border shadow-lg max-w-sm">
          <CardContent className="p-4 space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="font-medium text-gray-800">Offline Storage</h4>
              <Button
                variant="ghost"
                size="sm"
                onClick={loadOfflineCapabilities}
                className="h-6 w-6 p-0"
              >
                <RefreshCw className="h-3 w-3" />
              </Button>
            </div>

            <div className="space-y-3">
              {/* Offline Stories */}
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <HardDrive className="h-4 w-4 text-blue-600" />
                  <span className="text-sm">Saved Stories</span>
                </div>
                <Badge variant="outline">
                  {offlineCapabilities.offlineStories}
                </Badge>
              </div>

              {/* Storage Usage */}
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span>Storage Used</span>
                  <span>{formatBytes(offlineCapabilities.storageUsed)}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-blue-600 h-2 rounded-full" 
                    style={{ width: `${Math.min(getStoragePercentage(), 100)}%` }}
                  ></div>
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  {formatBytes(offlineCapabilities.storageQuota)} available
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex space-x-2 pt-2">
                {offlineCapabilities.offlineStories > 0 && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={onOfflineStoriesClick}
                    className="flex-1"
                  >
                    <Download className="h-3 w-3 mr-1" />
                    View Offline
                  </Button>
                )}
                
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowDetails(false)}
                  className="flex-1"
                >
                  Close
                </Button>
              </div>
            </div>

            {/* Offline Tips */}
            {!isOnline && (
              <div className="text-xs text-gray-600 bg-gray-50 p-2 rounded">
                <p className="font-medium mb-1">Offline Mode Tips:</p>
                <ul className="space-y-1">
                  <li>• View your saved stories anytime</li>
                  <li>• Create new stories when back online</li>
                  <li>• Audio may not be available offline</li>
                </ul>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

export function OfflineStoryManager({ children, onStorySelect }) {
  const [offlineStories, setOfflineStories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedChild, setSelectedChild] = useState(null);

  useEffect(() => {
    loadOfflineStories();
  }, [selectedChild]);

  const loadOfflineStories = async () => {
    setLoading(true);
    try {
      const stories = await offlineManager.getOfflineStories(
        selectedChild ? selectedChild.id : null
      );
      setOfflineStories(stories);
    } catch (error) {
      console.error('Failed to load offline stories:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteStory = async (storyId) => {
    try {
      await offlineManager.deleteOfflineStory(storyId);
      setOfflineStories(prev => prev.filter(story => story.id !== storyId));
    } catch (error) {
      console.error('Failed to delete offline story:', error);
    }
  };

  const clearAllOfflineData = async () => {
    if (window.confirm('Are you sure you want to delete all offline stories?')) {
      try {
        await offlineManager.clearOfflineData();
        setOfflineStories([]);
      } catch (error) {
        console.error('Failed to clear offline data:', error);
      }
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-medium">Offline Stories</h3>
            <div className="flex items-center space-x-2">
              <select
                value={selectedChild?.id || ''}
                onChange={(e) => {
                  const child = children.find(c => c.id === parseInt(e.target.value));
                  setSelectedChild(child || null);
                }}
                className="text-sm border rounded px-2 py-1"
              >
                <option value="">All Children</option>
                {children.map(child => (
                  <option key={child.id} value={child.id}>
                    {child.name}
                  </option>
                ))}
              </select>
              
              {offlineStories.length > 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={clearAllOfflineData}
                  className="text-red-600 hover:text-red-700"
                >
                  Clear All
                </Button>
              )}
            </div>
          </div>

          {offlineStories.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <HardDrive className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>No offline stories saved</p>
              <p className="text-sm">Stories will appear here when saved for offline reading</p>
            </div>
          ) : (
            <div className="space-y-2">
              {offlineStories.map(story => (
                <div
                  key={story.id}
                  className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50"
                >
                  <div className="flex-1">
                    <h4 className="font-medium">{story.title}</h4>
                    <div className="flex items-center space-x-2 text-sm text-gray-600">
                      <span>{story.theme}</span>
                      <span>•</span>
                      <span>{story.reading_time_minutes} min read</span>
                      <span>•</span>
                      <span>Saved {new Date(story.saved_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onStorySelect(story)}
                    >
                      Read
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteStory(story.id)}
                      className="text-red-600 hover:text-red-700"
                    >
                      Delete
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

