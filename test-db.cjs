const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');

const envFile = fs.readFileSync('.env.local', 'utf8');
const env = envFile.split('\n').reduce((acc, line) => {
  const [key, ...value] = line.split('=');
  if (key && value && value.length > 0) {
    acc[key.trim()] = value.join('=').trim().replace(/^"(.*)"$/, '$1');
  }
  return acc;
}, {});

const supabase = createClient(env.VITE_SUPABASE_URL, env.VITE_SUPABASE_ANON_KEY);

supabase.from('truth_engine_history').select('*').limit(1).then(({ data, error }) => {
  if (error) {
    console.error('Supabase Error:', error);
    process.exit(1);
  } else {
    console.log('Successfully connected to Supabase! Found', data.length, 'rows.');
    process.exit(0);
  }
});
