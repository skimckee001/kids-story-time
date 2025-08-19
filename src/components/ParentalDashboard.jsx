import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button.jsx';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card.jsx';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs.jsx';
import { Badge } from '@/components/ui/badge.jsx';
import { Switch } from '@/components/ui/switch.jsx';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select.jsx';
import { Label } from '@/components/ui/label.jsx';
import { 
  Users, Settings, BarChart3, Clock, Star, BookOpen, 
  Shield, Volume2, Globe, Palette, Download, Eye 
} from 'lucide-react';
import { apiClient } from '../lib/api';
import { useSessionId } from '../hooks/useLocalStorage';

export function ParentalDashboard({ children, onSettingsChange }) {
  const [analytics, setAnalytics] = useState({});
  const [parentalSettings, setParentalSettings] = useState({
    contentFilter: 'age_appropriate',
    readingLevel: 'auto',
    audioEnabled: true,
    interactiveEnabled: true,
    languagePreference: 'en',
    themeRestrictions: [],
    maxStoriesPerDay: 5,
    bedtimeMode: false,
    shareAnalytics: true
  });
  const [loading, setLoading] = useState(true);
  const sessionId = useSessionId();

  useEffect(() => {
    loadAnalytics();
    loadParentalSettings();
  }, [children]);

  const loadAnalytics = async () => {
    // Simulate analytics data - in real app this would come from backend
    const mockAnalytics = {
      totalStories: 24,
      favoriteThemes: ['adventure', 'fairytale', 'educational'],
      readingTime: 180, // minutes
      weeklyProgress: [3, 5, 2, 4, 6, 3, 4],
      languageDistribution: { en: 20, es: 3, fr: 1 },
      interactiveChoices: 45
    };
    setAnalytics(mockAnalytics);
  };

  const loadParentalSettings = () => {
    // Load from localStorage or backend
    const saved = localStorage.getItem(`parental_settings_${sessionId}`);
    if (saved) {
      setParentalSettings(JSON.parse(saved));
    }
    setLoading(false);
  };

  const updateSetting = (key, value) => {
    const newSettings = { ...parentalSettings, [key]: value };
    setParentalSettings(newSettings);
    localStorage.setItem(`parental_settings_${sessionId}`, JSON.stringify(newSettings));
    
    if (onSettingsChange) {
      onSettingsChange(newSettings);
    }
  };

  const exportData = () => {
    const data = {
      children: children,
      analytics: analytics,
      settings: parentalSettings,
      exportDate: new Date().toISOString()
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `kids_story_data_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Shield className="h-6 w-6 text-blue-600" />
            <span>Parental Dashboard</span>
          </CardTitle>
          <CardDescription>
            Manage your children's story experience and monitor their reading progress
          </CardDescription>
        </CardHeader>
      </Card>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
          <TabsTrigger value="privacy">Privacy</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Children Summary */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {children.map((child) => (
              <ChildSummaryCard key={child.id} child={child} analytics={analytics} />
            ))}
          </div>

          {/* Quick Stats */}
          <div className="grid md:grid-cols-4 gap-4">
            <StatCard
              icon={BookOpen}
              title="Total Stories"
              value={analytics.totalStories || 0}
              subtitle="Stories created"
              color="blue"
            />
            <StatCard
              icon={Clock}
              title="Reading Time"
              value={`${Math.floor((analytics.readingTime || 0) / 60)}h ${(analytics.readingTime || 0) % 60}m`}
              subtitle="This month"
              color="green"
            />
            <StatCard
              icon={Star}
              title="Favorites"
              value={children.reduce((acc, child) => acc + (child.favorite_stories || 0), 0)}
              subtitle="Favorite stories"
              color="yellow"
            />
            <StatCard
              icon={Globe}
              title="Languages"
              value={Object.keys(analytics.languageDistribution || {}).length}
              subtitle="Languages used"
              color="purple"
            />
          </div>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          <AnalyticsView analytics={analytics} children={children} />
        </TabsContent>

        <TabsContent value="settings" className="space-y-6">
          <ParentalControls 
            settings={parentalSettings} 
            onUpdateSetting={updateSetting} 
          />
        </TabsContent>

        <TabsContent value="privacy" className="space-y-6">
          <PrivacyControls 
            settings={parentalSettings} 
            onUpdateSetting={updateSetting}
            onExportData={exportData}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function ChildSummaryCard({ child, analytics }) {
  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-purple-100 rounded-full">
            <Users className="h-4 w-4 text-purple-600" />
          </div>
          <div>
            <CardTitle className="text-lg">{child.name}</CardTitle>
            {child.age && (
              <CardDescription>Age: {child.age}</CardDescription>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Stories Created</span>
            <span className="font-medium">12</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Favorite Theme</span>
            <Badge variant="secondary">Adventure</Badge>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Reading Time</span>
            <span className="font-medium">2h 30m</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function StatCard({ icon: Icon, title, value, subtitle, color }) {
  const colorClasses = {
    blue: 'bg-blue-100 text-blue-600',
    green: 'bg-green-100 text-green-600',
    yellow: 'bg-yellow-100 text-yellow-600',
    purple: 'bg-purple-100 text-purple-600'
  };

  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center space-x-3">
          <div className={`p-2 rounded-full ${colorClasses[color]}`}>
            <Icon className="h-5 w-5" />
          </div>
          <div>
            <p className="text-2xl font-bold">{value}</p>
            <p className="text-sm text-gray-600">{subtitle}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function AnalyticsView({ analytics, children }) {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <BarChart3 className="h-5 w-5" />
            <span>Reading Analytics</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-6">
            {/* Favorite Themes */}
            <div>
              <h4 className="font-medium mb-3">Favorite Themes</h4>
              <div className="space-y-2">
                {(analytics.favoriteThemes || []).map((theme, index) => (
                  <div key={theme} className="flex items-center justify-between">
                    <span className="capitalize">{theme.replace('_', ' ')}</span>
                    <div className="flex items-center space-x-2">
                      <div className="w-20 bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-purple-600 h-2 rounded-full" 
                          style={{ width: `${100 - (index * 20)}%` }}
                        ></div>
                      </div>
                      <span className="text-sm text-gray-600">{100 - (index * 20)}%</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Language Usage */}
            <div>
              <h4 className="font-medium mb-3">Language Usage</h4>
              <div className="space-y-2">
                {Object.entries(analytics.languageDistribution || {}).map(([lang, count]) => (
                  <div key={lang} className="flex items-center justify-between">
                    <span className="uppercase">{lang}</span>
                    <div className="flex items-center space-x-2">
                      <div className="w-20 bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-blue-600 h-2 rounded-full" 
                          style={{ width: `${(count / analytics.totalStories) * 100}%` }}
                        ></div>
                      </div>
                      <span className="text-sm text-gray-600">{count}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Weekly Progress */}
      <Card>
        <CardHeader>
          <CardTitle>Weekly Reading Activity</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-end space-x-2 h-32">
            {(analytics.weeklyProgress || []).map((stories, index) => (
              <div key={index} className="flex-1 flex flex-col items-center">
                <div 
                  className="w-full bg-purple-600 rounded-t"
                  style={{ height: `${(stories / 6) * 100}%` }}
                ></div>
                <span className="text-xs text-gray-600 mt-2">
                  {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'][index]}
                </span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function ParentalControls({ settings, onUpdateSetting }) {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Settings className="h-5 w-5" />
            <span>Content Controls</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <Label htmlFor="content-filter">Content Filter</Label>
              <Select 
                value={settings.contentFilter} 
                onValueChange={(value) => onUpdateSetting('contentFilter', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="strict">Strict (Ages 3-5)</SelectItem>
                  <SelectItem value="age_appropriate">Age Appropriate (Ages 6-8)</SelectItem>
                  <SelectItem value="moderate">Moderate (Ages 9-12)</SelectItem>
                  <SelectItem value="open">Open (All Ages)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="reading-level">Reading Level</Label>
              <Select 
                value={settings.readingLevel} 
                onValueChange={(value) => onUpdateSetting('readingLevel', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="simple">Simple (Beginner)</SelectItem>
                  <SelectItem value="auto">Auto (Age-based)</SelectItem>
                  <SelectItem value="advanced">Advanced (Challenge)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="audio-enabled">Audio Narration</Label>
                <p className="text-sm text-gray-600">Allow voice narration of stories</p>
              </div>
              <Switch
                id="audio-enabled"
                checked={settings.audioEnabled}
                onCheckedChange={(checked) => onUpdateSetting('audioEnabled', checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="interactive-enabled">Interactive Elements</Label>
                <p className="text-sm text-gray-600">Enable story choices and interactions</p>
              </div>
              <Switch
                id="interactive-enabled"
                checked={settings.interactiveEnabled}
                onCheckedChange={(checked) => onUpdateSetting('interactiveEnabled', checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="bedtime-mode">Bedtime Mode</Label>
                <p className="text-sm text-gray-600">Calmer themes and slower narration</p>
              </div>
              <Switch
                id="bedtime-mode"
                checked={settings.bedtimeMode}
                onCheckedChange={(checked) => onUpdateSetting('bedtimeMode', checked)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Usage Limits</CardTitle>
        </CardHeader>
        <CardContent>
          <div>
            <Label htmlFor="max-stories">Maximum Stories Per Day</Label>
            <Select 
              value={settings.maxStoriesPerDay.toString()} 
              onValueChange={(value) => onUpdateSetting('maxStoriesPerDay', parseInt(value))}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="3">3 stories</SelectItem>
                <SelectItem value="5">5 stories</SelectItem>
                <SelectItem value="10">10 stories</SelectItem>
                <SelectItem value="999">Unlimited</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function PrivacyControls({ settings, onUpdateSetting, onExportData }) {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Eye className="h-5 w-5" />
            <span>Privacy Settings</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="share-analytics">Share Anonymous Analytics</Label>
              <p className="text-sm text-gray-600">Help improve the app with anonymous usage data</p>
            </div>
            <Switch
              id="share-analytics"
              checked={settings.shareAnalytics}
              onCheckedChange={(checked) => onUpdateSetting('shareAnalytics', checked)}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Data Management</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-medium">Export Your Data</h4>
              <p className="text-sm text-gray-600">Download all your children's stories and data</p>
            </div>
            <Button onClick={onExportData} variant="outline">
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
          </div>

          <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <h4 className="font-medium text-yellow-800 mb-2">Data Retention</h4>
            <p className="text-sm text-yellow-700">
              Your data is stored locally and on our secure servers. You can delete your account 
              and all associated data at any time from the account settings.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

