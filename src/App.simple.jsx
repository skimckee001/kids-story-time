import { useState } from 'react';

// Simple version of the Kids Story app to test Tailwind
function App() {
  const [activeTab, setActiveTab] = useState('home');

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-2">
              <div className="p-2 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg">
                <div className="h-6 w-6 bg-white rounded"></div>
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Kids Story Time</h1>
                <p className="text-xs text-gray-500">Full Product</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center py-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Welcome to Kids Story Time
          </h1>
          <p className="text-xl text-gray-600 mb-8">
            Create magical, personalized stories for your children
          </p>
          
          <div className="bg-white rounded-lg shadow-md p-6 max-w-md mx-auto">
            <h3 className="text-lg font-semibold mb-4">Get Started</h3>
            <button 
              className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg"
              onClick={() => alert('Create story feature coming soon!')}
            >
              Create Your First Story
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}

export default App;