// Configuration Loader for Kids Story Time
// This file loads environment variables securely for the frontend

(function() {
    // Configuration object - values will be injected by Netlify at build time
    const config = {
        SUPABASE_URL: process.env.SUPABASE_URL || '',
        SUPABASE_ANON_KEY: process.env.SUPABASE_ANON_KEY || '',
        STRIPE_PUBLIC_KEY: process.env.STRIPE_PUBLIC_KEY || '',
        SITE_URL: process.env.SITE_URL || 'https://kidsstorytime.ai',
        NODE_ENV: process.env.NODE_ENV || 'production'
    };

    // Inject configuration into meta tags
    function injectConfig() {
        Object.entries(config).forEach(([key, value]) => {
            if (value) {
                const metaName = key.toLowerCase().replace(/_/g, '-');
                let meta = document.querySelector(`meta[name="${metaName}"]`);
                
                if (!meta) {
                    meta = document.createElement('meta');
                    meta.name = metaName;
                    document.head.appendChild(meta);
                }
                
                meta.content = value;
            }
        });
    }

    // Run on DOM load
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', injectConfig);
    } else {
        injectConfig();
    }
})();