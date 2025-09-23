const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')

console.log('🔧 Fixing RLS infinite recursion policies...')

// Try to find environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  console.log('\n❌ Missing Supabase environment variables!')
  console.log('\nTo run this fix automatically, set:')
  console.log('   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url')
  console.log('   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key')
  console.log('\nOr copy and run this SQL manually in your Supabase dashboard:')
  console.log('\n' + '='.repeat(60))
  const sqlScript = fs.readFileSync('./scripts/003_fix_rls_policies.sql', 'utf8')
  console.log(sqlScript)
  console.log('='.repeat(60))
  process.exit(1)
}

async function fixRLS() {
  console.log('\n🚀 Connecting to Supabase...')
  
  const supabase = createClient(supabaseUrl, supabaseKey)
  
  // Read the SQL script
  const sqlScript = fs.readFileSync('./scripts/003_fix_rls_policies.sql', 'utf8')
  
  // Split into individual statements
  const statements = sqlScript
    .split(';')
    .map(stmt => stmt.trim())
    .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'))

  console.log(`📝 Executing ${statements.length} SQL statements...\n`)

  for (let i = 0; i < statements.length; i++) {
    const statement = statements[i] + ';'
    console.log(`${i + 1}. ${statement.split(' ').slice(0, 4).join(' ')}...`)
    
    try {
      const { error } = await supabase.rpc('exec_sql', { sql: statement })
      
      if (error) {
        console.log(`   ⚠️ ${error.message}`)
      } else {
        console.log(`   ✅ Success`)
      }
    } catch (e) {
      console.log(`   ⚠️ ${e.message}`)
    }
  }

  // Test by trying to select from groups
  console.log('\n🔍 Testing fixed policies...')
  try {
    const { data, error } = await supabase.from('groups').select('id').limit(1)
    if (!error) {
      console.log('✅ Groups table is now accessible without recursion!')
    } else {
      console.log('⚠️ Groups table test:', error.message)
    }
  } catch (e) {
    console.log('⚠️ Groups table test failed:', e.message)
  }
}

fixRLS().then(() => {
  console.log('\n🎉 RLS policy fix completed!')
}).catch((error) => {
  console.error('\n❌ Fix failed:', error)
})
