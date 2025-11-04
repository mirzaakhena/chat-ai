#!/usr/bin/env node

async function testToolCall() {
  console.log('🧪 Testing tool call functionality...\n');

  const response = await fetch('http://localhost:3000/api/chat', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      messages: [
        {
          role: 'user',
          content: 'Query the Notion database to get the latest 2 complaints. Use the notion_query_complaints tool with page_size set to 2.'
        }
      ],
    }),
  });

  console.log('📊 Response Status:', response.status);
  console.log('📊 Response Headers:', Object.fromEntries(response.headers.entries()));
  console.log('\n📝 Stream Content:\n');

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let fullText = '';

  while (true) {
    const { done, value } = await reader.read();

    if (done) {
      break;
    }

    const chunk = decoder.decode(value, { stream: true });
    fullText += chunk;
    process.stdout.write(chunk);
  }

  console.log('\n\n✅ Stream completed');
  console.log('\n📦 Full response length:', fullText.length, 'bytes');
}

testToolCall().catch(console.error);
