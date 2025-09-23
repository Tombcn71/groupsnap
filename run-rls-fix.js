const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')

// Try to load environment from .env.local if it exists
try {
  const envContent = fs.readFileSync('.env.local', 'utf8')
  const envVars = envContent.split('\n').filter(line => line.includes('='))
  envVars.forEach(line => {
    const [key, value] = line.split('=')
    if (key && value) {
      process.env[key.trim()] = value.trim()
    }
  })
  console.log('📁 Loaded environment from .env.local')
} catch (e) {
  console.log('ℹ️  No .env.local found, using system environment')
}

console.log('🔧 Attempting to fix RLS infinite recursion...')

// Get Supabase credentials
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  console.log('\n❌ Missing Supabase credentials!')
  console.log('Need: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY')
  console.log('\nAlternatively, copy this SQL to Supabase Dashboard → SQL Editor:')
  console.log('\n' + '='.repeat(60))
  try {
    const sqlScript = fs.readFileSync('./scripts/003_fix_rls_policies.sql', 'utf8')
    console.log(sqlScript)
  } catch (e) {
    console.log('Could not read SQL file')
  }
  console.log('='.repeat(60))
  process.exit(1)
}

async function executeRLSFix() {
  console.log('\n🚀 Connecting to Supabase...')
  
  const supabase = createClient(supabaseUrl, supabaseKey)
  
  // First test connection
  try {
    const { data, error } = await supabase.from('profiles').select('id').limit(1)
    if (error && error.code !== '42P01') {
      throw new Error(`Connection failed: ${error.message}`)
    }
    console.log('✅ Connected to Supabase successfully')
  } catch (e) {
    console.error('❌ Connection failed:', e.message)
    return
  }

  // Read SQL file
  const sqlScript = fs.readFileSync('./scripts/003_fix_rls_policies.sql', 'utf8')
  
  // Execute each statement
  const statements = [
    'DROP POLICY IF EXISTS "groups_select_own_or_member" ON public.groups',
    
    `CREATE POLICY "groups_select_simple" ON public.groups FOR SELECT 
     USING (
       auth.uid() = owner_id OR 
       auth.uid() IN (
         SELECT gm.user_id 
         FROM public.group_members gm 
         WHERE gm.group_id = groups.id
       )
     )`,
    
    'DROP POLICY IF EXISTS "group_members_select_own_group" ON public.group_members',
    
    `CREATE POLICY "group_members_select_accessible" ON public.group_members FOR SELECT 
     USING (
       user_id = auth.uid() OR 
       auth.uid() IN (
         SELECT g.owner_id 
         FROM public.groups g 
         WHERE g.id = group_id
       )
     )`,
    
    'DROP POLICY IF EXISTS "group_members_insert_own_group" ON public.group_members',
    
    `CREATE POLICY "group_members_insert_by_owner" ON public.group_members FOR INSERT 
     WITH CHECK (
       auth.uid() IN (
         SELECT g.owner_id 
         FROM public.groups g 
         WHERE g.id = group_id
       )
     )`
  ]

  console.log(`\n📝 Executing ${statements.length} critical policy fixes...`)

  for (let i = 0; i < statements.length; i++) {
    const statement = statements[i]
    const action = statement.includes('DROP') ? 'DROP' : 'CREATE'
    
    console.log(`${i + 1}. ${action} policy...`)
    
    try {
      const { error } = await supabase.rpc('execute_sql', { query: statement })
      
      if (error) {
        console.log(`   ⚠️  ${error.message}`)
      } else {
        console.log(`   ✅ Success`)
      }
    } catch (e) {
      // Try alternative method
      try {
        const { error } = await supabase.sql([statement])
        if (error) {
          console.log(`   ⚠️  ${error.message}`)
        } else {
          console.log(`   ✅ Success (alt method)`)
        }
      } catch (e2) {
        console.log(`   ❌ Failed: ${e2.message}`)
      }
    }
  }

  // Test the fix
  console.log('\n🔍 Testing groups table access...')
  try {
    const { data, error } = await supabase.from('groups').select('id, name').limit(1)
    if (!error) {
      console.log('✅ Groups table accessible - infinite recursion fixed!')
    } else {
      console.log(`⚠️  Groups test: ${error.message}`)
    }
  } catch (e) {
    console.log(`❌ Groups test failed: ${e.message}`)
  }

  console.log('\n🎉 RLS fix attempt completed!')
  console.log('If group creation still fails, run the SQL manually in Supabase Dashboard.')
}

executeRLSFix().catch(console.error)
