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

console.log('\n========== NOTION CLIENT STRUCTURE ==========');
console.log('notion keys:', Object.keys(notion));
console.log('\nnotion.databases keys:', Object.keys(notion.databases || {}));
console.log('\nnotion.dataSources keys:', Object.keys(notion.dataSources || {}));
console.log('\nnotion.databases type:', typeof notion.databases);
console.log('notion.dataSources type:', typeof notion.dataSources);

// Check if databases has query method
if (notion.databases) {
  console.log('\nnotion.databases.query type:', typeof notion.databases.query);
  console.log('notion.databases.retrieve type:', typeof notion.databases.retrieve);
  console.log('All databases methods:', Object.keys(Object.getPrototypeOf(notion.databases)));
}

// Check if dataSources exists
if (notion.dataSources) {
  console.log('\nnotion.dataSources.query type:', typeof notion.dataSources.query);
  console.log('notion.dataSources.retrieve type:', typeof notion.dataSources.retrieve);
  console.log('All dataSources methods:', Object.keys(Object.getPrototypeOf(notion.dataSources)));
}

console.log('=============================================\n');
