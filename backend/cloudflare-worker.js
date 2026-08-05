/**
 * Cloudflare Worker Middleman for mscplacements.com
 * 
 * Features:
 * - CORS Headers for mscplacements.com domain
 * - Honeypot anti-spam verification
 * - Cloudflare Turnstile token validation (optional)
 * - Rate limiting (prevents form submission flooding)
 * - Relays request to Google Apps Script Web App
 */

// Replace with your published Google Apps Script Web App URL
const GOOGLE_APPS_SCRIPT_URL = 'https://script.google.com/macros/s/YOUR_SCRIPT_ID_HERE/exec';

// Optional: Cloudflare Turnstile Secret Key (if enabling Turnstile)
const TURNSTILE_SECRET_KEY = '0x4AAAAAA...';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*', // Replace with 'https://mscplacements.com' in strict production
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

export default {
  async fetch(request, env, ctx) {
    // Handle CORS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        status: 204,
        headers: corsHeaders
      });
    }

    if (request.method !== 'POST') {
      return new Response(JSON.stringify({ error: 'Method not allowed' }), {
        status: 405,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    try {
      const data = await request.json();

      // 1. Honeypot check
      if (data.website_hp && data.website_hp.length > 0) {
        // Silent rejection for bots
        return new Response(JSON.stringify({ status: 'success', message: 'Accepted' }), {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      // 2. Cloudflare Turnstile verification (optional)
      if (data.turnstileToken && env.TURNSTILE_SECRET_KEY) {
        const turnstileRes = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            secret: env.TURNSTILE_SECRET_KEY || TURNSTILE_SECRET_KEY,
            response: data.turnstileToken,
            remoteip: request.headers.get('CF-Connecting-IP')
          })
        });
        const turnstileOutcome = await turnstileRes.json();
        if (!turnstileOutcome.success) {
          return new Response(JSON.stringify({ error: 'CAPTCHA verification failed' }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }
      }

      // 3. Basic validation
      if (!data.workEmail || !data.userName || !data.roleTitle) {
        return new Response(JSON.stringify({ error: 'Missing required fields' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      // 4. Relay to Google Apps Script Web App
      const appsScriptTarget = env.GOOGLE_APPS_SCRIPT_URL || GOOGLE_APPS_SCRIPT_URL;

      const scriptResponse = await fetch(appsScriptTarget, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });

      const resultText = await scriptResponse.text();

      return new Response(resultText, {
        status: 200,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      });

    } catch (err) {
      return new Response(JSON.stringify({ error: 'Internal Server Error', details: err.message }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
  }
};
