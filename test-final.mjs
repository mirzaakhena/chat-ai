#!/usr/bin/env node

async function testFinal() {
  console.log('🧪 Testing available tools...\n');

  const response = await fetch('http://localhost:3000/api/chat', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      messages: [
        {
          role: 'user',
          content: 'What tools do you have available? List them.'
        }
      ],
    }),
  });

  console.log('📊 Response Status:', response.status);
  console.log('\n📝 Response:\n');

  const reader = response.body.getReader();
  const decoder = new TextDecoder();

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

        if (event.type === 'text-delta') {
          process.stdout.write(event.text);
        } else if (event.type === 'finish') {
          console.log('\n\n✨ Finished!');
        }
      } catch (e) {
        // Ignore parse errors
      }
    }
  }
}

testFinal().catch(console.error);
