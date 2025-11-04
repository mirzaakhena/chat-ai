import { Client } from "@notionhq/client";
import { readFileSync } from "fs";

// Load .env manually
const envContent = readFileSync('.env', 'utf-8');
const envVars = {};
envContent.split('\n').forEach(line => {
  const [key, ...valueParts] = line.split('=');
  if (key && valueParts.length) {
    envVars[key.trim()] = valueParts.join('=').trim();
  }
});

const notion = new Client({
  auth: envVars.NOTION_TOKEN,
});

const DATABASE_ID = envVars.NOTION_DATABASE_ID;

console.log('\n========== NOTION DATABASE ACCESS TEST ==========');
console.log('Database ID:', DATABASE_ID);
console.log('Token (first 20 chars):', envVars.NOTION_TOKEN?.substring(0, 20) + '...');
console.log('==================================================\n');

async function testAccess() {
  try {
    console.log('🔍 Testing databases.retrieve()...');
    const database = await notion.databases.retrieve({
      database_id: DATABASE_ID,
    });

    console.log('✅ SUCCESS! Database retrieved via databases.retrieve()');
    console.log('\nDatabase info:');
    console.log('  - ID:', database.id);
    console.log('  - Object type:', database.object);
    console.log('  - Title:', database.title);
    console.log('  - Has properties?:', 'properties' in database);

    if (database.properties) {
      console.log('  - Property count:', Object.keys(database.properties).length);
      console.log('  - Properties:', Object.keys(database.properties).join(', '));
    }

    console.log('\n🔍 Testing databases.query()...');
    const queryResult = await notion.databases.query({
      database_id: DATABASE_ID,
      page_size: 1,
    });

    console.log('✅ SUCCESS! Query executed via databases.query()');
    console.log('  - Results count:', queryResult.results?.length || 0);
    console.log('  - Has more?:', queryResult.has_more);

    console.log('\n✅✅✅ ALL TESTS PASSED! ✅✅✅');
    console.log('Your Notion integration is working correctly!\n');

  } catch (error) {
    console.log('❌ ERROR:', error.code || error.message);
    console.log('\nError details:', error);

    if (error.code === 'object_not_found') {
      console.log('\n📋 TROUBLESHOOTING STEPS:');
      console.log('1. Go to your Notion database page');
      console.log('2. Click the "..." menu (top right)');
      console.log('3. Click "Connections" or "Add connections"');
      console.log('4. Find and add your integration to this database');
      console.log('\nOR verify the database ID:');
      console.log('- Open your database in Notion');
      console.log('- Check the URL: https://www.notion.so/{workspace}/{DATABASE_ID}?v={view}');
      console.log('- Make sure DATABASE_ID matches:', DATABASE_ID);
    } else if (error.code === 'unauthorized') {
      console.log('\n📋 TROUBLESHOOTING STEPS:');
      console.log('1. Check if NOTION_TOKEN is valid');
      console.log('2. Verify the integration token hasn\'t expired');
      console.log('3. Make sure you\'re using an integration token (not OAuth)');
    }

    console.log('\n');
    process.exit(1);
  }
}

testAccess();
