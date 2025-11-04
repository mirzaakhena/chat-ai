#!/usr/bin/env node

async function testStream() {
  console.log('🧪 Testing streaming API...\n');

  const response = await fetch('http://localhost:3000/api/chat', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      messages: [
        { role: 'user', content: 'Count from 1 to 5, one number per line.' }
      ],
    }),
  });

  console.log('📊 Response Status:', response.status);
  console.log('📊 Response Headers:', Object.fromEntries(response.headers.entries()));
  console.log('\n📝 Stream Content:\n');

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';

  while (true) {
    const { done, value } = await reader.read();

    if (done) {
      console.log('\n\n✅ Stream completed');
      break;
    }

    const chunk = decoder.decode(value, { stream: true });
    buffer += chunk;

    // Show raw chunk
    console.log('📦 Raw chunk:', JSON.stringify(chunk));

    // Try to parse data stream format
    const lines = buffer.split('\n');
    buffer = lines.pop() || '';

    for (const line of lines) {
      if (line.startsWith('0:')) {
        console.log('🔹 Text chunk:', line);
      } else if (line.trim()) {
        console.log('🔸 Other data:', line);
      }
    }
  }
}

testStream().catch(console.error);
