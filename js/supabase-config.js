// Supabase Configuration for Kids Story Time
// File: js/supabase-config.js

// Get credentials from meta tags or environment
const SUPABASE_URL = document.querySelector('meta[name="supabase-url"]')?.content || '';
const SUPABASE_ANON_KEY = document.querySelector('meta[name="supabase-anon-key"]')?.content || '';

// Initialize Supabase client
const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Make client globally available
window.supabaseClient = supabaseClient;

console.log('Supabase client initialized for Kids Story Time');

// Export for module usage if needed
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { supabaseClient, SUPABASE_URL, SUPABASE_ANON_KEY };
}