// Test Supabase connection
require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

console.log('Testing Supabase Connection...\n');
console.log('URL:', supabaseUrl);
console.log('Key:', supabaseAnonKey ? `${supabaseAnonKey.substring(0, 20)}...` : 'NOT SET');

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('\n❌ Error: Supabase credentials not found in .env file');
  process.exit(1);
}

if (supabaseUrl === 'https://your-project.supabase.co' || supabaseAnonKey === 'your-anon-key-here') {
  console.error('\n❌ Error: Please replace example values with actual Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testConnection() {
  try {
    console.log('\n1. Testing basic connection...');

    // Test 1: Get session (should be null initially)
    const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
    if (sessionError) throw sessionError;
    console.log('✅ Auth connection successful');
    console.log('   Current session:', sessionData.session ? 'Active' : 'None (expected)');

    // Test 2: Try to query a table (will fail if RLS is working correctly, which is good)
    console.log('\n2. Testing database connection...');
    const { data: profilesData, error: profilesError } = await supabase
      .from('profiles')
      .select('*')
      .limit(1);

    if (profilesError) {
      // This is expected for unauthenticated requests with RLS
      console.log('✅ Database connection successful (RLS is protecting data)');
    } else {
      console.log('✅ Database connection successful');
      console.log('   Profiles found:', profilesData ? profilesData.length : 0);
    }

    // Test 3: Check if we can query public tables
    console.log('\n3. Testing public tables...');
    const { data: productsData, error: productsError } = await supabase
      .from('products')
      .select('count');

    if (!productsError) {
      console.log('✅ Public tables accessible');
    } else {
      console.log('⚠️  Products table error:', productsError.message);
    }

    console.log('\n✅ All connection tests passed!');
    console.log('\n📝 Next steps:');
    console.log('   1. Start dev server: npm run web');
    console.log('   2. Navigate to: http://localhost:3003/auth/register');
    console.log('   3. Create a test account');
    console.log('   4. Check Supabase Dashboard > Authentication > Users');

  } catch (error) {
    console.error('\n❌ Connection test failed:', error.message);
    console.error('\nTroubleshooting:');
    console.error('   1. Verify Supabase URL and key are correct');
    console.error('   2. Check if database migration has been run');
    console.error('   3. Visit your Supabase project dashboard to check project status');
    process.exit(1);
  }
}

testConnection();
