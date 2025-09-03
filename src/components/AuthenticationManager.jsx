import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import './AuthenticationManager.css';

function AuthenticationManager({ onAuthSuccess, onClose }) {
  const [authMode, setAuthMode] = useState('signin'); // 'signin', 'signup', 'magic-link', 'social'
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    parentName: '',
    agreeToTerms: false
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [showPasswordless, setShowPasswordless] = useState(false);
  const [rememberDevice, setRememberDevice] = useState(true);

  // Check for biometric availability
  const [biometricsAvailable, setBiometricsAvailable] = useState(false);

  useEffect(() => {
    checkBiometricsSupport();
    checkSavedCredentials();
  }, []);

  const checkBiometricsSupport = async () => {
    // Check if device supports biometric authentication
    if ('credentials' in navigator && 'create' in navigator.credentials) {
      try {
        const available = await navigator.credentials.get({
          publicKey: {
            challenge: new Uint8Array(32),
            allowCredentials: [],
            timeout: 1000
          }
        });
        setBiometricsAvailable(true);
      } catch (err) {
        // Biometrics not available or user cancelled
        setBiometricsAvailable(false);
      }
    }
  };

  const checkSavedCredentials = () => {
    // Check if user has opted for "remember me"
    const savedEmail = localStorage.getItem('kidsstory_saved_email');
    const hasRememberToken = localStorage.getItem('kidsstory_remember_token');
    
    if (savedEmail) {
      setFormData(prev => ({ ...prev, email: savedEmail }));
    }
    
    if (hasRememberToken) {
      setShowPasswordless(true);
    }
  };

  const handleEmailPasswordSignIn = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: formData.email,
        password: formData.password,
      });

      if (error) throw error;

      // Save credentials if user wants to be remembered
      if (rememberDevice) {
        localStorage.setItem('kidsstory_saved_email', formData.email);
        localStorage.setItem('kidsstory_remember_token', 'true');
        localStorage.setItem('kidsstory_last_login', new Date().toISOString());
      }

      // Create biometric credential for future logins (if supported)
      if (biometricsAvailable && rememberDevice) {
        await createBiometricCredential(data.user.id);
      }

      onAuthSuccess(data.user);
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSignUp = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      setLoading(false);
      return;
    }

    if (!formData.agreeToTerms) {
      setError('Please agree to the Terms of Service and Privacy Policy');
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            parent_name: formData.parentName
          }
        }
      });

      if (error) throw error;

      setSuccessMessage('Account created! Please check your email to verify your account.');
      setAuthMode('signin');
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleMagicLinkSignIn = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const { error } = await supabase.auth.signInWithOtp({
        email: formData.email,
        options: {
          shouldCreateUser: false
        }
      });

      if (error) throw error;

      setSuccessMessage('Check your email for the magic link to sign in!');
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSocialSignIn = async (provider) => {
    setLoading(true);
    setError('');

    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: provider,
        options: {
          redirectTo: `${window.location.origin}/auth/callback`
        }
      });

      if (error) throw error;
    } catch (error) {
      setError(error.message);
      setLoading(false);
    }
  };

  const createBiometricCredential = async (userId) => {
    if (!('credentials' in navigator)) return;

    try {
      const credential = await navigator.credentials.create({
        publicKey: {
          challenge: new Uint8Array(32),
          rp: {
            name: "KidsStoryTime.ai",
            id: window.location.hostname,
          },
          user: {
            id: new TextEncoder().encode(userId),
            name: formData.email,
            displayName: formData.parentName || formData.email
          },
          pubKeyCredParams: [{ alg: -7, type: "public-key" }],
          authenticatorSelection: {
            authenticatorAttachment: "platform",
            userVerification: "required"
          }
        }
      });

      // Store credential ID for future use
      localStorage.setItem('kidsstory_biometric_id', credential.id);
    } catch (err) {
      console.warn('Biometric credential creation failed:', err);
    }
  };

  const handleBiometricSignIn = async () => {
    const credentialId = localStorage.getItem('kidsstory_biometric_id');
    if (!credentialId) return;

    setLoading(true);
    setError('');

    try {
      const credential = await navigator.credentials.get({
        publicKey: {
          challenge: new Uint8Array(32),
          allowCredentials: [{
            id: new TextEncoder().encode(credentialId),
            type: 'public-key'
          }],
          userVerification: "required"
        }
      });

      if (credential) {
        // In production, verify the credential with your backend
        // For now, sign in with saved email
        const savedEmail = localStorage.getItem('kidsstory_saved_email');
        if (savedEmail) {
          const { error } = await supabase.auth.signInWithOtp({
            email: savedEmail,
            options: { shouldCreateUser: false }
          });
          
          if (!error) {
            setSuccessMessage('Biometric authentication successful! Check your email for the sign-in link.');
          }
        }
      }
    } catch (error) {
      setError('Biometric authentication failed. Please try another method.');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickSignIn = async () => {
    const savedEmail = localStorage.getItem('kidsstory_saved_email');
    if (!savedEmail) return;

    setLoading(true);
    setError('');

    try {
      const { error } = await supabase.auth.signInWithOtp({
        email: savedEmail,
        options: { shouldCreateUser: false }
      });

      if (error) throw error;

      setSuccessMessage(`Magic link sent to ${savedEmail}! Check your email to continue.`);
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-modal">
      <div className="auth-overlay" onClick={onClose}></div>
      <div className="auth-content">
        <div className="auth-header">
          <h2>
            {authMode === 'signin' && '🏠 Welcome Back!'}
            {authMode === 'signup' && '✨ Create Your Account'}
            {authMode === 'magic-link' && '🔗 Magic Link Sign In'}
          </h2>
          <button className="close-btn" onClick={onClose} aria-label="Close">×</button>
        </div>
        
        <div className="auth-body">

        {/* Quick Sign In Options (for returning users) */}
        {authMode === 'signin' && showPasswordless && (
          <div className="quick-signin-section">
            <h3>Quick Sign In</h3>
            <div className="quick-options">
              {biometricsAvailable && (
                <button 
                  className="quick-btn biometric"
                  onClick={handleBiometricSignIn}
                  disabled={loading}
                >
                  👤 Face/Touch ID
                </button>
              )}
              <button 
                className="quick-btn magic-link"
                onClick={handleQuickSignIn}
                disabled={loading}
              >
                ✉️ Email Magic Link
              </button>
            </div>
            <div className="divider">
              <span>or sign in with password</span>
            </div>
          </div>
        )}

          {/* Social Sign In */}
          <div className="social-signin">
            <button 
              className="social-btn google"
              onClick={() => handleSocialSignIn('google')}
              disabled={loading}
              type="button"
            >
              <span className="social-icon">🔍</span>
              <span><span className="btn-text-prefix">Continue with</span> Google</span>
            </button>
            <button 
              className="social-btn apple"
              onClick={() => handleSocialSignIn('apple')}
              disabled={loading}
              type="button"
            >
              <span className="social-icon">🍎</span>
              <span><span className="btn-text-prefix">Continue with</span> Apple</span>
            </button>
          </div>

        <div className="divider">
          <span>or</span>
        </div>

        {/* Email/Password Forms */}
        {authMode === 'signin' && (
          <form onSubmit={handleEmailPasswordSignIn} className="auth-form">
            <div className="form-group">
              <label>Email Address</label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                placeholder="parent@example.com"
                required
                autoComplete="email"
              />
            </div>
            <div className="form-group">
              <label>Password</label>
              <input
                type="password"
                value={formData.password}
                onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                placeholder="Your password"
                required
                autoComplete="current-password"
              />
            </div>
            <div className="form-options">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={rememberDevice}
                  onChange={(e) => setRememberDevice(e.target.checked)}
                />
                Remember this device for easy access
              </label>
              <button 
                type="button" 
                className="forgot-password"
                onClick={() => setAuthMode('magic-link')}
              >
                Forgot password?
              </button>
            </div>
            <button type="submit" className="auth-submit" disabled={loading}>
              {loading ? 'Signing In...' : 'Sign In'}
            </button>
          </form>
        )}

        {authMode === 'signup' && (
          <form onSubmit={handleSignUp} className="auth-form">
            <div className="form-group">
              <label>Parent Name</label>
              <input
                type="text"
                value={formData.parentName}
                onChange={(e) => setFormData(prev => ({ ...prev, parentName: e.target.value }))}
                placeholder="Your name"
                required
              />
            </div>
            <div className="form-group">
              <label>Email Address</label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                placeholder="parent@example.com"
                required
                autoComplete="email"
              />
            </div>
            <div className="form-group">
              <label>Password</label>
              <input
                type="password"
                value={formData.password}
                onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                placeholder="Create a secure password"
                required
                autoComplete="new-password"
                minLength="8"
              />
            </div>
            <div className="form-group">
              <label>Confirm Password</label>
              <input
                type="password"
                value={formData.confirmPassword}
                onChange={(e) => setFormData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                placeholder="Confirm your password"
                required
                autoComplete="new-password"
              />
            </div>
            <div className="form-options">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={formData.agreeToTerms}
                  onChange={(e) => setFormData(prev => ({ ...prev, agreeToTerms: e.target.checked }))}
                  required
                />
                I agree to the <a href="/terms" target="_blank">Terms of Service</a> and <a href="/privacy" target="_blank">Privacy Policy</a>
              </label>
            </div>
            <button type="submit" className="auth-submit" disabled={loading}>
              {loading ? 'Creating Account...' : 'Create Free Account'}
            </button>
          </form>
        )}

        {authMode === 'magic-link' && (
          <form onSubmit={handleMagicLinkSignIn} className="auth-form">
            <div className="form-group">
              <label>Email Address</label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                placeholder="Enter your email"
                required
                autoComplete="email"
              />
            </div>
            <button type="submit" className="auth-submit" disabled={loading}>
              {loading ? 'Sending...' : 'Send Magic Link'}
            </button>
          </form>
        )}

        {/* Messages */}
        {error && <div className="error-message">{error}</div>}
        {successMessage && <div className="success-message">{successMessage}</div>}

        {/* Mode Switching */}
        <div className="auth-switch">
          {authMode === 'signin' && (
            <>
              <p>Don't have an account? <button onClick={() => setAuthMode('signup')}>Create one free</button></p>
              <p>Trouble signing in? <button onClick={() => setAuthMode('magic-link')}>Use magic link</button></p>
            </>
          )}
          {authMode === 'signup' && (
            <p>Already have an account? <button onClick={() => setAuthMode('signin')}>Sign in</button></p>
          )}
          {authMode === 'magic-link' && (
            <p>Remember your password? <button onClick={() => setAuthMode('signin')}>Sign in</button></p>
          )}
        </div>

          {/* Bedtime Mode Tip */}
          <div className="bedtime-tip">
            <p>💡 <strong>Pro Tip:</strong> Enable "Remember this device" for quick access during bedtime routines!</p>
          </div>
        </div> {/* End auth-body */}
      </div>
    </div>
  );
}

export default AuthenticationManager;
