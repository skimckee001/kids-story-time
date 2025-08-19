import { useState } from 'react';

// Test adding UI components gradually
function App() {
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
          
          {/* Test basic card structure */}
          <div className="bg-white rounded-lg border shadow-sm p-6 max-w-md mx-auto">
            <div className="space-y-1.5 pb-6">
              <h3 className="text-2xl font-semibold leading-none tracking-tight">Get Started</h3>
              <p className="text-sm text-gray-600">
                Create your first child profile to begin generating personalized stories
              </p>
            </div>
            <div className="pt-0">
              {/* Simple button without shadcn styling */}
              <button 
                className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-950 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-slate-900 text-slate-50 hover:bg-slate-900/90 h-10 px-4 py-2"
                onClick={() => alert('Create story feature coming soon!')}
              >
                Create Your First Story
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default App;