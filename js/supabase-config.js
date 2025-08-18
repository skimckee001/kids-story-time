// Supabase Configuration for Kids Story Time
// File: js/supabase-config.js

// Replace these with your actual Supabase credentials
const SUPABASE_URL = 'https://uewfbzzrgiacgplyoccv.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVld2ZienpyZ2lhY2dwbHlvY2N2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTUxODUwNDUsImV4cCI6MjA3MDc2MTA0NX0.4ktNHJ7RnlzfUygqgU5423t91n19Ugb1F328lUlSK5s';

// Initialize Supabase client
const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Make client globally available
window.supabaseClient = supabaseClient;

console.log('Supabase client initialized for Kids Story Time');

// Export for module usage if needed
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { supabaseClient, SUPABASE_URL, SUPABASE_ANON_KEY };
}