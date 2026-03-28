/**
 * AutoSocial — Database Setup Script
 *
 * Run: node setup-db.js
 *
 * This creates all tables in your Supabase project using the REST API.
 * It uses the anon key from .env.local to test connectivity,
 * then guides you through the schema setup.
 */

const fs = require('fs');
const path = require('path');

// Load env
const envPath = path.join(__dirname, '.env.local');
const envContent = fs.readFileSync(envPath, 'utf-8');
const env = {};
envContent.split('\n').forEach(line => {
  const [key, ...rest] = line.split('=');
  if (key && !key.startsWith('#')) env[key.trim()] = rest.join('=').trim();
});

const SUPABASE_URL = env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

async function main() {
  console.log('🚀 AutoSocial Database Setup\n');
  console.log(`📡 Supabase URL: ${SUPABASE_URL}`);

  // Test connection
  console.log('\n1️⃣  Testing connection...');
  try {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/`, {
      headers: { apikey: SUPABASE_KEY },
    });
    if (res.ok) {
      console.log('   ✅ Connected to Supabase');
    } else {
      console.log(`   ❌ Connection failed: ${res.status}`);
      return;
    }
  } catch (e) {
    console.log(`   ❌ Connection error: ${e.message}`);
    return;
  }

  // Check if tables exist
  console.log('\n2️⃣  Checking tables...');
  const tables = ['posts', 'analytics', 'platform_connections', 'trends', 'scheduled_jobs'];
  const existing = [];
  const missing = [];

  for (const table of tables) {
    try {
      const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}?select=id&limit=1`, {
        headers: { apikey: SUPABASE_KEY },
      });
      if (res.ok) {
        existing.push(table);
        console.log(`   ✅ ${table} — exists`);
      } else {
        missing.push(table);
        console.log(`   ❌ ${table} — missing`);
      }
    } catch {
      missing.push(table);
      console.log(`   ❌ ${table} — error`);
    }
  }

  if (missing.length === 0) {
    console.log('\n🎉 All tables exist! Database is ready.');

    // Check data
    console.log('\n3️⃣  Checking data...');
    const postsRes = await fetch(`${SUPABASE_URL}/rest/v1/posts?select=id`, {
      headers: { apikey: SUPABASE_KEY },
    });
    const posts = await postsRes.json();
    console.log(`   📝 Posts: ${posts.length}`);

    const analyticsRes = await fetch(`${SUPABASE_URL}/rest/v1/analytics?select=id`, {
      headers: { apikey: SUPABASE_KEY },
    });
    const analytics = await analyticsRes.json();
    console.log(`   📊 Analytics entries: ${analytics.length}`);

    console.log('\n✅ AutoSocial is ready! Run: npm run dev');
    return;
  }

  console.log(`\n⚠️  ${missing.length} tables missing: ${missing.join(', ')}`);
  console.log('\n📋 To create them, you need to run the SQL schema.');
  console.log('   Copy the schema from: autosocial/supabase-schema.sql');
  console.log('');
  console.log('   Option 1 — Supabase Dashboard:');
  console.log(`   👉 ${SUPABASE_URL.replace('.supabase.co', '.supabase.co')}/project/sql`);
  console.log('   Paste the SQL and click Run.');
  console.log('');
  console.log('   Option 2 — Supabase CLI (needs DB password):');
  console.log('   npx supabase db query --db-url "postgresql://postgres:[PASSWORD]@db.oeflvpelqpxqkqmjxwzw.supabase.co:5432/postgres" < supabase-schema.sql');
  console.log('');
  console.log('   Option 3 — Copy-paste in any SQL client connected to your Supabase DB.');
}

main().catch(console.error);
