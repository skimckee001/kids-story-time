// Kids Story Time app with inline styles and functionality
function App() {
  const [children, setChildren] = useState([]);
  const [selectedChild, setSelectedChild] = useState(null);
  const [currentView, setCurrentView] = useState('welcome');
  const [currentStory, setCurrentStory] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleChildCreated = (child) => {
    const newChild = { ...child, id: Date.now() };
    const newChildren = [...children, newChild];
    setChildren(newChildren);
    setSelectedChild(newChild);
    setCurrentView('home');
  };

  const generateStory = async () => {
    if (!selectedChild) return;
    
    setIsLoading(true);
    try {
      const response = await fetch('/api/stories/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          child_name: selectedChild.name,
          child_age: selectedChild.age,
          interests: selectedChild.interests || [],
          theme: 'adventure',
          language: 'en'
        })
      });
      
      if (response.ok) {
        const story = await response.json();
        setCurrentStory(story);
        setCurrentView('story');
      } else {
        alert('Failed to generate story. Make sure the backend is running.');
      }
    } catch (error) {
      alert('Error connecting to backend: ' + error.message);
    }
    setIsLoading(false);
  };

  if (currentView === 'welcome' && children.length === 0) {
    return <WelcomeScreen onChildCreated={handleChildCreated} />;
  }

  if (currentView === 'story' && currentStory) {
    return <StoryView story={currentStory} onBack={() => setCurrentView('home')} />;
  }

  if (currentView === 'createChild') {
    return <CreateChildForm onChildCreated={handleChildCreated} onCancel={() => setCurrentView('home')} />;
  }
  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #e0f2fe, #f3e5f5, #fce4ec)',
      fontFamily: 'system-ui, sans-serif'
    }}>
      {/* Header */}
      <header style={{
        backgroundColor: 'white',
        boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
        borderBottom: '1px solid #e5e7eb'
      }}>
        <div style={{
          maxWidth: '1200px',
          margin: '0 auto',
          padding: '0 24px'
        }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            height: '64px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{
                padding: '8px',
                background: 'linear-gradient(135deg, #8b5cf6, #ec4899)',
                borderRadius: '8px'
              }}>
                <div style={{
                  height: '24px',
                  width: '24px',
                  backgroundColor: 'white',
                  borderRadius: '4px'
                }}></div>
              </div>
              <div>
                <h1 style={{
                  fontSize: '20px',
                  fontWeight: 'bold',
                  color: '#111827',
                  margin: 0
                }}>Kids Story Time</h1>
                <p style={{
                  fontSize: '12px',
                  color: '#6b7280',
                  margin: 0
                }}>Full Product</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main style={{
        maxWidth: '1200px',
        margin: '0 auto',
        padding: '64px 24px'
      }}>
        <div style={{ textAlign: 'center' }}>
          <h1 style={{
            fontSize: '48px',
            fontWeight: 'bold',
            color: '#111827',
            marginBottom: '16px'
          }}>
            Welcome to Kids Story Time
          </h1>
          <p style={{
            fontSize: '20px',
            color: '#6b7280',
            marginBottom: '64px'
          }}>
            Create magical, personalized stories for your children
          </p>
          
          <div style={{
            backgroundColor: 'white',
            borderRadius: '12px',
            border: '1px solid #e5e7eb',
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
            padding: '24px',
            maxWidth: '400px',
            margin: '0 auto'
          }}>
            <h3 style={{
              fontSize: '24px',
              fontWeight: '600',
              marginBottom: '8px',
              color: '#111827'
            }}>Get Started</h3>
            <p style={{
              fontSize: '14px',
              color: '#6b7280',
              marginBottom: '24px'
            }}>
              Create your first child profile to begin generating personalized stories
            </p>
            {/* Child Profiles */}
            <div style={{ marginBottom: '24px' }}>
              <h4 style={{ marginBottom: '12px', fontSize: '16px', fontWeight: '600' }}>Children</h4>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '16px' }}>
                {children.map((child) => (
                  <button
                    key={child.id}
                    onClick={() => setSelectedChild(child)}
                    style={{
                      padding: '8px 12px',
                      backgroundColor: selectedChild?.id === child.id ? '#3b82f6' : '#f3f4f6',
                      color: selectedChild?.id === child.id ? 'white' : '#374151',
                      border: 'none',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      fontSize: '14px'
                    }}
                  >
                    {child.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Action Buttons */}
            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
              <button 
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '10px 16px',
                  fontSize: '14px',
                  fontWeight: '500',
                  backgroundColor: '#1f2937',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  transition: 'background-color 0.2s'
                }}
                onClick={() => setCurrentView('createChild')}
                onMouseOver={(e) => e.target.style.backgroundColor = '#374151'}
                onMouseOut={(e) => e.target.style.backgroundColor = '#1f2937'}
              >
                Add Child Profile
              </button>
              
              {selectedChild && (
                <button 
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '10px 16px',
                    fontSize: '14px',
                    fontWeight: '500',
                    backgroundColor: isLoading ? '#9ca3af' : '#3b82f6',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: isLoading ? 'not-allowed' : 'pointer',
                    transition: 'background-color 0.2s'
                  }}
                  onClick={generateStory}
                  disabled={isLoading}
                  onMouseOver={(e) => !isLoading && (e.target.style.backgroundColor = '#2563eb')}
                  onMouseOut={(e) => !isLoading && (e.target.style.backgroundColor = '#3b82f6')}
                >
                  {isLoading ? 'Generating...' : `Create Story for ${selectedChild.name}`}
                </button>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

}

function WelcomeScreen({ onChildCreated }) {
  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #e0f2fe, #f3e5f5, #fce4ec)',
      fontFamily: 'system-ui, sans-serif'
    }}>
      <header style={{
        backgroundColor: 'white',
        boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
        borderBottom: '1px solid #e5e7eb'
      }}>
        <div style={{
          maxWidth: '1200px',
          margin: '0 auto',
          padding: '0 24px'
        }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            height: '64px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{
                padding: '8px',
                background: 'linear-gradient(135deg, #8b5cf6, #ec4899)',
                borderRadius: '8px'
              }}>
                <div style={{
                  height: '24px',
                  width: '24px',
                  backgroundColor: 'white',
                  borderRadius: '4px'
                }}></div>
              </div>
              <div>
                <h1 style={{
                  fontSize: '20px',
                  fontWeight: 'bold',
                  color: '#111827',
                  margin: 0
                }}>Kids Story Time</h1>
                <p style={{
                  fontSize: '12px',
                  color: '#6b7280',
                  margin: 0
                }}>Full Product</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main style={{
        maxWidth: '1200px',
        margin: '0 auto',
        padding: '64px 24px'
      }}>
        <div style={{ textAlign: 'center' }}>
          <h1 style={{
            fontSize: '48px',
            fontWeight: 'bold',
            color: '#111827',
            marginBottom: '16px'
          }}>
            Welcome to Kids Story Time
          </h1>
          <p style={{
            fontSize: '20px',
            color: '#6b7280',
            marginBottom: '64px'
          }}>
            Create magical, personalized stories for your children
          </p>
          
          <CreateChildForm onChildCreated={onChildCreated} />
        </div>
      </main>
    </div>
  );
}

function CreateChildForm({ onChildCreated, onCancel }) {
  const [name, setName] = useState('');
  const [age, setAge] = useState('');
  const [interests, setInterests] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name.trim()) return;
    
    onChildCreated({
      name: name.trim(),
      age: parseInt(age) || null,
      interests: interests.split(',').map(i => i.trim()).filter(i => i)
    });
  };

  const containerStyle = onCancel ? {
    minHeight: '100vh',
    background: 'linear-gradient(135deg, #e0f2fe, #f3e5f5, #fce4ec)',
    fontFamily: 'system-ui, sans-serif',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '24px'
  } : {};

  return (
    <div style={containerStyle}>
      <div style={{
        backgroundColor: 'white',
        borderRadius: '12px',
        border: '1px solid #e5e7eb',
        boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
        padding: '24px',
        maxWidth: '400px',
        width: '100%'
      }}>
        <h3 style={{
          fontSize: '24px',
          fontWeight: '600',
          marginBottom: '8px',
          color: '#111827'
        }}>Create Child Profile</h3>
        <p style={{
          fontSize: '14px',
          color: '#6b7280',
          marginBottom: '24px'
        }}>
          Tell us about your child to create personalized stories
        </p>
        
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', marginBottom: '4px', fontSize: '14px', fontWeight: '500' }}>
              Child's Name *
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              style={{
                width: '100%',
                padding: '8px 12px',
                border: '1px solid #d1d5db',
                borderRadius: '6px',
                fontSize: '14px',
                boxSizing: 'border-box'
              }}
              placeholder="Enter child's name"
              required
            />
          </div>
          
          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', marginBottom: '4px', fontSize: '14px', fontWeight: '500' }}>
              Age
            </label>
            <input
              type="number"
              value={age}
              onChange={(e) => setAge(e.target.value)}
              style={{
                width: '100%',
                padding: '8px 12px',
                border: '1px solid #d1d5db',
                borderRadius: '6px',
                fontSize: '14px',
                boxSizing: 'border-box'
              }}
              placeholder="Age (optional)"
              min="1"
              max="18"
            />
          </div>
          
          <div style={{ marginBottom: '24px' }}>
            <label style={{ display: 'block', marginBottom: '4px', fontSize: '14px', fontWeight: '500' }}>
              Interests
            </label>
            <input
              type="text"
              value={interests}
              onChange={(e) => setInterests(e.target.value)}
              style={{
                width: '100%',
                padding: '8px 12px',
                border: '1px solid #d1d5db',
                borderRadius: '6px',
                fontSize: '14px',
                boxSizing: 'border-box'
              }}
              placeholder="e.g., dinosaurs, space, princesses (comma separated)"
            />
          </div>
          
          <div style={{ display: 'flex', gap: '12px' }}>
            <button 
              type="submit"
              style={{
                flex: 1,
                padding: '10px 16px',
                fontSize: '14px',
                fontWeight: '500',
                backgroundColor: '#3b82f6',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer'
              }}
            >
              Create Profile
            </button>
            
            {onCancel && (
              <button 
                type="button"
                onClick={onCancel}
                style={{
                  padding: '10px 16px',
                  fontSize: '14px',
                  fontWeight: '500',
                  backgroundColor: '#f3f4f6',
                  color: '#374151',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer'
                }}
              >
                Cancel
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}

function StoryView({ story, onBack }) {
  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #e0f2fe, #f3e5f5, #fce4ec)',
      fontFamily: 'system-ui, sans-serif'
    }}>
      <header style={{
        backgroundColor: 'white',
        boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
        borderBottom: '1px solid #e5e7eb'
      }}>
        <div style={{
          maxWidth: '1200px',
          margin: '0 auto',
          padding: '0 24px'
        }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            height: '64px'
          }}>
            <button
              onClick={onBack}
              style={{
                padding: '8px 16px',
                backgroundColor: '#f3f4f6',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '14px'
              }}
            >
              ← Back to Home
            </button>
            <h1 style={{
              fontSize: '20px',
              fontWeight: 'bold',
              color: '#111827',
              margin: 0
            }}>Kids Story Time</h1>
          </div>
        </div>
      </header>

      <main style={{
        maxWidth: '800px',
        margin: '0 auto',
        padding: '32px 24px'
      }}>
        <div style={{
          backgroundColor: 'white',
          borderRadius: '12px',
          border: '1px solid #e5e7eb',
          boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
          padding: '32px'
        }}>
          <h2 style={{
            fontSize: '32px',
            fontWeight: 'bold',
            color: '#111827',
            marginBottom: '24px'
          }}>
            {story.title}
          </h2>
          
          <div style={{
            fontSize: '16px',
            lineHeight: '1.7',
            color: '#374151',
            whiteSpace: 'pre-wrap'
          }}>
            {story.content}
          </div>
          
          {story.audio_url && (
            <div style={{ marginTop: '24px' }}>
              <audio controls style={{ width: '100%' }}>
                <source src={story.audio_url} type="audio/mpeg" />
                Your browser does not support the audio element.
              </audio>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

export default App;