import { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, Navigate } from 'react-router-dom';
import { Button } from '@/components/ui/button.jsx';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card.jsx';
import { 
  BookOpen, Users, Settings, CreditCard, Sparkles, 
  Home, Star, LogIn, UserPlus, Menu, X
} from 'lucide-react';

// Import our custom components and libraries
import { SubscriptionPricing } from './components/SubscriptionPricing.jsx';
import { auth, db } from './lib/supabase';
import { checkSubscriptionStatus } from './lib/stripe';
import './index.css';

// Landing Page Component
function LandingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-50 to-pink-50">
      {/* Hero Section */}
      <div className="container mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <h1 className="text-5xl md:text-6xl font-bold mb-6 font-fredoka gradient-text">
            Kids Story Time
          </h1>
          <p className="text-xl text-gray-700 mb-8">
            Create magical, personalized stories for your children with AI
          </p>
          <div className="flex gap-4 justify-center">
            <Link to="/signup">
              <Button size="lg" className="bg-purple-600 hover:bg-purple-700">
                Get Started Free
              </Button>
            </Link>
            <Link to="/login">
              <Button size="lg" variant="outline">
                Sign In
              </Button>
            </Link>
          </div>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-3 gap-8 mt-16">
          <Card className="hover:shadow-xl transition-shadow">
            <CardHeader>
              <Sparkles className="h-8 w-8 text-purple-600 mb-4" />
              <CardTitle>AI-Powered Stories</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">
                Generate unique, personalized stories tailored to your child's age and interests
              </p>
            </CardContent>
          </Card>

          <Card className="hover:shadow-xl transition-shadow">
            <CardHeader>
              <BookOpen className="h-8 w-8 text-purple-600 mb-4" />
              <CardTitle>Educational Content</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">
                Stories that teach valuable lessons while entertaining your children
              </p>
            </CardContent>
          </Card>

          <Card className="hover:shadow-xl transition-shadow">
            <CardHeader>
              <Users className="h-8 w-8 text-purple-600 mb-4" />
              <CardTitle>Multiple Profiles</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">
                Create separate profiles for each child with age-appropriate content
              </p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Pricing Section */}
      <div className="container mx-auto px-4">
        <SubscriptionPricing />
      </div>
    </div>
  );
}

// Login Page Component
function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const { error } = await auth.signIn(email, password);
    
    if (error) {
      setError(error.message);
      setLoading(false);
    } else {
      window.location.href = '/dashboard';
    }
  };

  // Quick test login buttons
  const quickLogin = async (tier) => {
    const credentials = {
      free: { email: 'test-free@kidsstorytime.org', password: 'testpass123' },
      premium: { email: 'test-premium@kidsstorytime.org', password: 'testpass123' },
      family: { email: 'test-family@kidsstorytime.org', password: 'testpass123' }
    };

    const creds = credentials[tier];
    setLoading(true);
    const { error } = await auth.signIn(creds.email, creds.password);
    
    if (error) {
      setError(`Test account not set up. Use regular login.`);
      setLoading(false);
    } else {
      window.location.href = '/dashboard';
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-purple-50 to-pink-50">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl text-center">Welcome Back!</CardTitle>
          <CardDescription className="text-center">
            Sign in to continue creating magical stories
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full p-2 border rounded-lg"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full p-2 border rounded-lg"
                required
              />
            </div>
            {error && (
              <div className="text-red-600 text-sm">{error}</div>
            )}
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Signing in...' : 'Sign In'}
            </Button>
          </form>

          {/* Quick Test Login */}
          <div className="mt-6 pt-6 border-t">
            <p className="text-sm text-gray-600 mb-3 text-center">Quick Test Login:</p>
            <div className="grid grid-cols-3 gap-2">
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => quickLogin('free')}
                disabled={loading}
              >
                Free
              </Button>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => quickLogin('premium')}
                disabled={loading}
                className="border-orange-500 text-orange-600"
              >
                Premium
              </Button>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => quickLogin('family')}
                disabled={loading}
                className="border-purple-500 text-purple-600"
              >
                Family
              </Button>
            </div>
          </div>

          <div className="mt-4 text-center">
            <Link to="/signup" className="text-purple-600 hover:underline">
              Don't have an account? Sign up
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Signup Page Component
function SignupPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSignup = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const { data, error } = await auth.signUp(email, password);
    
    if (error) {
      setError(error.message);
      setLoading(false);
    } else {
      alert('Check your email to confirm your account!');
      window.location.href = '/login';
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-purple-50 to-pink-50">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl text-center">Create Your Account</CardTitle>
          <CardDescription className="text-center">
            Start creating magical stories for your children
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSignup} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full p-2 border rounded-lg"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full p-2 border rounded-lg"
                required
                minLength={6}
              />
            </div>
            {error && (
              <div className="text-red-600 text-sm">{error}</div>
            )}
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Creating account...' : 'Sign Up'}
            </Button>
          </form>

          <div className="mt-4 text-center">
            <Link to="/login" className="text-purple-600 hover:underline">
              Already have an account? Sign in
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Dashboard Component (Main App)
function Dashboard() {
  const [user, setUser] = useState(null);
  const [subscription, setSubscription] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const currentUser = await auth.getUser();
    if (!currentUser) {
      window.location.href = '/login';
      return;
    }
    
    setUser(currentUser);
    const subStatus = await checkSubscriptionStatus();
    setSubscription(subStatus);
    setLoading(false);
  };

  const handleSignOut = async () => {
    await auth.signOut();
    window.location.href = '/';
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="spinner"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center space-x-4">
            <h1 className="text-2xl font-bold font-fredoka gradient-text">Kids Story Time</h1>
            <Badge variant="secondary">{subscription?.tier || 'Free'} Plan</Badge>
          </div>
          <div className="flex items-center space-x-4">
            <span className="text-sm text-gray-600">{user?.email}</span>
            <Button variant="outline" size="sm" onClick={handleSignOut}>
              Sign Out
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Card className="hover:shadow-lg transition-shadow cursor-pointer">
            <CardHeader>
              <BookOpen className="h-8 w-8 text-purple-600 mb-4" />
              <CardTitle>Create New Story</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">
                Generate a personalized story for your child
              </p>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow cursor-pointer">
            <CardHeader>
              <Star className="h-8 w-8 text-yellow-500 mb-4" />
              <CardTitle>Story Library</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">
                View all your saved stories
              </p>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow cursor-pointer">
            <CardHeader>
              <Users className="h-8 w-8 text-blue-600 mb-4" />
              <CardTitle>Child Profiles</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">
                Manage your children's profiles
              </p>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow cursor-pointer">
            <CardHeader>
              <CreditCard className="h-8 w-8 text-green-600 mb-4" />
              <CardTitle>Subscription</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">
                Manage your subscription plan
              </p>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow cursor-pointer">
            <CardHeader>
              <Settings className="h-8 w-8 text-gray-600 mb-4" />
              <CardTitle>Settings</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">
                Configure your preferences
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Coming Soon Notice */}
        <div className="mt-12 p-6 bg-yellow-50 border border-yellow-200 rounded-lg">
          <h3 className="text-lg font-semibold mb-2">🚀 React Migration In Progress</h3>
          <p className="text-gray-700">
            We're upgrading to a new, faster experience! Story creation and other features 
            will be available soon. For now, you can explore the interface and manage your subscription.
          </p>
        </div>
      </main>
    </div>
  );
}

// Main App Component with Router
function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignupPage />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/pricing" element={<SubscriptionPricing />} />
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </Router>
  );
}

export default App;