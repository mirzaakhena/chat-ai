#!/usr/bin/env node

async function testElasticsearch() {
  console.log('🧪 Testing Elasticsearch tool call...\n');

  const response = await fetch('http://localhost:3000/api/chat', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      messages: [
        {
          role: 'user',
          content: 'Query the Elasticsearch kube-events index to get the latest 3 events with type="Warning". Use elasticsearch_kube_event_query tool with appropriate query.'
        }
      ],
    }),
  });

  console.log('📊 Response Status:', response.status);
  console.log('\n📝 Stream Events:\n');

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let eventCount = 0;

  while (true) {
    const { done, value } = await reader.read();

    if (done) {
      break;
    }

    const chunk = decoder.decode(value, { stream: true });
    const lines = chunk.split('\n').filter(l => l.trim());

    for (const line of lines) {
      try {
        const event = JSON.parse(line);
        eventCount++;

        // Show important events
        if (event.type === 'tool-input-delta' && event.delta) {
          process.stdout.write(event.delta);
        } else if (event.type === 'tool-call') {
          console.log('\n\n🔧 Tool Call:', event.toolName);
          console.log('   Input:', JSON.stringify(event.input, null, 2));
        } else if (event.type === 'tool-result') {
          console.log('\n✅ Tool Result (first 500 chars):');
          const resultStr = JSON.stringify(event.result, null, 2);
          console.log(resultStr.substring(0, 500) + (resultStr.length > 500 ? '...' : ''));
        } else if (event.type === 'tool-error') {
          console.log('\n❌ Tool Error:', event.error);
        } else if (event.type === 'text-delta') {
          process.stdout.write(event.textDelta);
        } else if (event.type === 'finish') {
          console.log('\n\n✨ Finished!');
          console.log('   Total Usage:', event.totalUsage);
        }
      } catch (e) {
        // Ignore parse errors
      }
    }
  }

  console.log('\n\n📊 Total events received:', eventCount);
}

testElasticsearch().catch(console.error);
