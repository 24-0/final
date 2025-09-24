const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Get environment variables directly
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing required environment variables');
  console.error('Please ensure NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Read the schema file
const schemaPath = path.join(__dirname, 'groups_schema.sql');
const schema = fs.readFileSync(schemaPath, 'utf8');

async function executeSchema() {
  try {
    console.log('Executing database schema...');

    // Split the schema into individual statements
    const statements = schema
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));

    console.log(`Found ${statements.length} SQL statements to execute`);

    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      if (statement.trim()) {
        console.log(`Executing statement ${i + 1}/${statements.length}...`);

        try {
          // Use the raw SQL execution via rpc
          const { data, error } = await supabase.rpc('exec_sql', {
            sql: statement + ';'
          });

          if (error) {
            console.error(`Error in statement ${i + 1}:`, error.message);
            console.error('Statement was:', statement.substring(0, 200) + '...');
            // Continue with other statements instead of failing completely
          } else {
            console.log(`✓ Statement ${i + 1} executed successfully`);
          }
        } catch (err) {
          console.error(`Exception in statement ${i + 1}:`, err.message);
          console.error('Statement was:', statement.substring(0, 200) + '...');
        }
      }
    }

    console.log('Schema execution completed');
  } catch (error) {
    console.error('Error setting up schema:', error);
  }
}

executeSchema();
