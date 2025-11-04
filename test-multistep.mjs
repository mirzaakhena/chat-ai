#!/usr/bin/env node

async function testMultiStep() {
  console.log('🧪 Testing multi-step with 2 tool calls...\n');

  const response = await fetch('http://localhost:3000/api/chat', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      messages: [
        {
          role: 'user',
          content: 'Pilih satu data komplain yang bertipe technical 3 hari yang lalu. Jika data transactionnya ada, analisa transactionnya, jika tidak ketemu maka laporkan saja apa adanya.'
        }
      ],
    }),
  });

  console.log('📊 Response Status:', response.status);
  console.log('\n📝 Stream Events:\n');

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let toolCallCount = 0;
  let currentStep = 0;

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

        // Track steps
        if (event.type === 'start-step') {
          currentStep++;
          console.log(`\n${'='.repeat(60)}`);
          console.log(`📍 STEP ${currentStep} STARTED`);
          console.log(`${'='.repeat(60)}\n`);
        }

        // Show assistant thinking/text
        if (event.type === 'text-delta') {
          process.stdout.write(event.text);
        }

        // Show tool input construction (THINKING MESSAGE)
        if (event.type === 'tool-input-start') {
          console.log(`\n\n💭 Thinking: Preparing to call ${event.toolName}...`);
        }

        if (event.type === 'tool-input-delta' && event.delta) {
          process.stdout.write(event.delta);
        }

        // Show complete tool call
        if (event.type === 'tool-call') {
          toolCallCount++;
          console.log(`\n\n🔧 Tool Call #${toolCallCount}: ${event.toolName}`);
          console.log('   Parameters:', JSON.stringify(event.input, null, 2).substring(0, 300));
        }

        // Show tool result
        if (event.type === 'tool-result') {
          const resultStr = JSON.stringify(event.output, null, 2);
          console.log(`\n✅ Tool Result (first 400 chars):`);
          console.log(resultStr.substring(0, 400) + (resultStr.length > 400 ? '...' : ''));
        }

        // Show tool error
        if (event.type === 'tool-error') {
          console.log(`\n❌ Tool Error:`, event.error);
        }

        // Show step finish
        if (event.type === 'finish-step') {
          console.log(`\n\n${'='.repeat(60)}`);
          console.log(`✨ STEP ${currentStep} FINISHED`);
          console.log(`   Reason: ${event.finishReason}`);
          console.log(`   Tokens: ${event.usage.totalTokens}`);
          console.log(`${'='.repeat(60)}`);
        }

        // Show final finish
        if (event.type === 'finish') {
          console.log(`\n\n${'*'.repeat(60)}`);
          console.log(`🎉 CONVERSATION FINISHED`);
          console.log(`   Total Steps: ${currentStep}`);
          console.log(`   Total Tool Calls: ${toolCallCount}`);
          console.log(`   Total Tokens: ${event.totalUsage.totalTokens}`);
          console.log(`   Finish Reason: ${event.finishReason}`);
          console.log(`${'*'.repeat(60)}`);
        }
      } catch (e) {
        // Ignore parse errors
      }
    }
  }

  console.log('\n\n✅ Test completed!');
}

testMultiStep().catch(console.error);
