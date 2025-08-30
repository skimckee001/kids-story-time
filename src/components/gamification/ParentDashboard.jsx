import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card.jsx';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs.jsx';
import { Badge } from '@/components/ui/badge.jsx';
import { Progress } from '@/components/ui/progress.jsx';
import { Button } from '@/components/ui/button.jsx';
import { 
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer 
} from 'recharts';
import { 
  Trophy, TrendingUp, BookOpen, Clock, Star, Award, 
  Calendar, Target, Users, Settings, Download
} from 'lucide-react';
import gamification from '../../lib/gamification';
import { LevelProgress } from './LevelProgress';
import { BadgeGallery } from './BadgeGallery';

export function ParentDashboard({ children = [], onSettingsChange }) {
  const [selectedChild, setSelectedChild] = useState(children[0]);
  const [timeRange, setTimeRange] = useState('week'); // week, month, all
  const [dashboardData, setDashboardData] = useState(null);
  const [gamificationSettings, setGamificationSettings] = useState({
    enableStars: true,
    enableBadges: true,
    enableLevels: true,
    dailyGoal: 30, // minutes
    weeklyGoal: 150, // minutes
    difficulty: 'normal' // easy, normal, hard
  });

  useEffect(() => {
    if (selectedChild) {
      loadDashboardData(selectedChild.id);
    }
  }, [selectedChild, timeRange]);

  const loadDashboardData = async (childId) => {
    // Load gamification data for the selected child
    const status = gamification.getUserStatus();
    
    // Generate mock data for visualization (would come from database)
    const mockData = {
      userStatus: status,
      readingProgress: generateReadingProgress(),
      activityData: generateActivityData(),
      achievementProgress: generateAchievementProgress(),
      weeklyStats: generateWeeklyStats(),
      topBadges: status.unlockedBadges?.slice(0, 5) || []
    };
    
    setDashboardData(mockData);
  };

  const generateReadingProgress = () => {
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    return days.map(day => ({
      day,
      minutes: Math.floor(Math.random() * 60) + 10,
      stories: Math.floor(Math.random() * 3) + 1,
      stars: Math.floor(Math.random() * 20) + 5
    }));
  };

  const generateActivityData = () => {
    return [
      { name: 'Stories Created', value: 45, color: '#8b5cf6' },
      { name: 'Stories Completed', value: 38, color: '#3b82f6' },
      { name: 'Games Played', value: 62, color: '#10b981' },
      { name: 'Badges Earned', value: 12, color: '#f59e0b' }
    ];
  };

  const generateAchievementProgress = () => {
    return [
      { category: 'Reading', completed: 8, total: 10 },
      { category: 'Vocabulary', completed: 5, total: 8 },
      { category: 'Creativity', completed: 6, total: 10 },
      { category: 'Consistency', completed: 3, total: 5 }
    ];
  };

  const generateWeeklyStats = () => {
    return {
      totalMinutes: 245,
      totalStories: 18,
      totalStars: 156,
      averageSessionTime: 27,
      longestStreak: 7,
      favoriteTheme: 'Adventure'
    };
  };

  const exportProgressReport = () => {
    // Generate CSV or PDF report
    const report = {
      child: selectedChild.name,
      period: timeRange,
      level: dashboardData?.userStatus?.level,
      totalXP: dashboardData?.userStatus?.xp,
      badges: dashboardData?.userStatus?.badges?.length,
      readingMinutes: dashboardData?.weeklyStats?.totalMinutes,
      stories: dashboardData?.weeklyStats?.totalStories
    };
    
    // Convert to CSV
    const csv = Object.entries(report).map(([key, value]) => `${key},${value}`).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${selectedChild.name}_progress_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  if (!dashboardData) {
    return <div>Loading dashboard...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-2xl">Parent Dashboard</CardTitle>
              <CardDescription>Track your child's reading progress and achievements</CardDescription>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={exportProgressReport}>
                <Download className="h-4 w-4 mr-2" />
                Export Report
              </Button>
              <Button variant="outline" size="sm">
                <Settings className="h-4 w-4 mr-2" />
                Settings
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Child Selector */}
          <div className="flex items-center gap-4 mb-6">
            <span className="text-sm font-medium">Select Child:</span>
            <div className="flex gap-2">
              {children.map(child => (
                <Button
                  key={child.id}
                  variant={selectedChild?.id === child.id ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSelectedChild(child)}
                >
                  <Users className="h-4 w-4 mr-2" />
                  {child.name}
                </Button>
              ))}
            </div>
            
            {/* Time Range Selector */}
            <div className="ml-auto flex gap-2">
              {['week', 'month', 'all'].map(range => (
                <Button
                  key={range}
                  variant={timeRange === range ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setTimeRange(range)}
                >
                  {range === 'week' ? 'This Week' : range === 'month' ? 'This Month' : 'All Time'}
                </Button>
              ))}
            </div>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Current Level</p>
                    <p className="text-2xl font-bold">{dashboardData.userStatus.level}</p>
                  </div>
                  <Award className="h-8 w-8 text-purple-500" />
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Total Stars</p>
                    <p className="text-2xl font-bold">{dashboardData.userStatus.stars}</p>
                  </div>
                  <Star className="h-8 w-8 text-yellow-500" />
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Day Streak</p>
                    <p className="text-2xl font-bold">{dashboardData.userStatus.streaks.daily}</p>
                  </div>
                  <TrendingUp className="h-8 w-8 text-green-500" />
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Badges</p>
                    <p className="text-2xl font-bold">{dashboardData.userStatus.badges.length}</p>
                  </div>
                  <Trophy className="h-8 w-8 text-blue-500" />
                </div>
              </CardContent>
            </Card>
          </div>
        </CardContent>
      </Card>

      {/* Main Dashboard Tabs */}
      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="progress">Progress</TabsTrigger>
          <TabsTrigger value="achievements">Achievements</TabsTrigger>
          <TabsTrigger value="activity">Activity</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            {/* Reading Progress Chart */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Weekly Reading Progress</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={dashboardData.readingProgress}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="day" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="minutes" fill="#8b5cf6" name="Minutes Read" />
                    <Bar dataKey="stories" fill="#3b82f6" name="Stories" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Activity Distribution */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Activity Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie
                      data={dashboardData.activityData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, value }) => `${name}: ${value}`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {dashboardData.activityData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* Recent Badges */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Recent Badges Earned</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex gap-4 overflow-x-auto pb-2">
                {dashboardData.topBadges.map(badge => (
                  <div 
                    key={badge.id}
                    className="flex flex-col items-center min-w-[100px] p-3 bg-gradient-to-br from-purple-50 to-pink-50 rounded-lg"
                  >
                    <div className="text-3xl mb-2">{badge.icon}</div>
                    <p className="text-xs font-semibold text-center">{badge.name}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Progress Tab */}
        <TabsContent value="progress" className="space-y-4">
          <LevelProgress showDetails={true} />
          
          {/* Achievement Categories */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Achievement Progress</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {dashboardData.achievementProgress.map(category => (
                  <div key={category.category}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="font-medium">{category.category}</span>
                      <span>{category.completed}/{category.total}</span>
                    </div>
                    <Progress 
                      value={(category.completed / category.total) * 100} 
                      className="h-2"
                    />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Achievements Tab */}
        <TabsContent value="achievements">
          <BadgeGallery userId={selectedChild?.id} readingLevel={selectedChild?.readingLevel} />
        </TabsContent>

        {/* Activity Tab */}
        <TabsContent value="activity" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Reading Statistics</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <div className="text-center p-4 bg-purple-50 rounded-lg">
                  <Clock className="h-8 w-8 text-purple-600 mx-auto mb-2" />
                  <div className="text-2xl font-bold">{dashboardData.weeklyStats.totalMinutes}</div>
                  <div className="text-sm text-gray-600">Minutes This Week</div>
                </div>
                
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <BookOpen className="h-8 w-8 text-blue-600 mx-auto mb-2" />
                  <div className="text-2xl font-bold">{dashboardData.weeklyStats.totalStories}</div>
                  <div className="text-sm text-gray-600">Stories Read</div>
                </div>
                
                <div className="text-center p-4 bg-yellow-50 rounded-lg">
                  <Star className="h-8 w-8 text-yellow-600 mx-auto mb-2" />
                  <div className="text-2xl font-bold">{dashboardData.weeklyStats.totalStars}</div>
                  <div className="text-sm text-gray-600">Stars Earned</div>
                </div>
                
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <Target className="h-8 w-8 text-green-600 mx-auto mb-2" />
                  <div className="text-2xl font-bold">{dashboardData.weeklyStats.averageSessionTime}</div>
                  <div className="text-sm text-gray-600">Avg Minutes/Session</div>
                </div>
                
                <div className="text-center p-4 bg-orange-50 rounded-lg">
                  <TrendingUp className="h-8 w-8 text-orange-600 mx-auto mb-2" />
                  <div className="text-2xl font-bold">{dashboardData.weeklyStats.longestStreak}</div>
                  <div className="text-sm text-gray-600">Longest Streak</div>
                </div>
                
                <div className="text-center p-4 bg-pink-50 rounded-lg">
                  <Award className="h-8 w-8 text-pink-600 mx-auto mb-2" />
                  <div className="text-2xl font-bold">{dashboardData.weeklyStats.favoriteTheme}</div>
                  <div className="text-sm text-gray-600">Favorite Theme</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Settings Tab */}
        <TabsContent value="settings" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Gamification Settings</CardTitle>
              <CardDescription>Customize the gamification experience for {selectedChild?.name}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium">Enable Stars System</label>
                <Button
                  variant={gamificationSettings.enableStars ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setGamificationSettings(prev => ({ ...prev, enableStars: !prev.enableStars }))}
                >
                  {gamificationSettings.enableStars ? 'Enabled' : 'Disabled'}
                </Button>
              </div>
              
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium">Enable Badges</label>
                <Button
                  variant={gamificationSettings.enableBadges ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setGamificationSettings(prev => ({ ...prev, enableBadges: !prev.enableBadges }))}
                >
                  {gamificationSettings.enableBadges ? 'Enabled' : 'Disabled'}
                </Button>
              </div>
              
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium">Enable Levels</label>
                <Button
                  variant={gamificationSettings.enableLevels ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setGamificationSettings(prev => ({ ...prev, enableLevels: !prev.enableLevels }))}
                >
                  {gamificationSettings.enableLevels ? 'Enabled' : 'Disabled'}
                </Button>
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium">Daily Reading Goal (minutes)</label>
                <input
                  type="number"
                  value={gamificationSettings.dailyGoal}
                  onChange={(e) => setGamificationSettings(prev => ({ ...prev, dailyGoal: parseInt(e.target.value) }))}
                  className="w-full px-3 py-2 border rounded-lg"
                />
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium">Difficulty Level</label>
                <div className="flex gap-2">
                  {['easy', 'normal', 'hard'].map(level => (
                    <Button
                      key={level}
                      variant={gamificationSettings.difficulty === level ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setGamificationSettings(prev => ({ ...prev, difficulty: level }))}
                    >
                      {level.charAt(0).toUpperCase() + level.slice(1)}
                    </Button>
                  ))}
                </div>
              </div>
              
              <Button 
                className="w-full"
                onClick={() => onSettingsChange?.(gamificationSettings)}
              >
                Save Settings
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}