// test-fireflies.js
require('dotenv').config();
const firefliesService = require('./fireflies');

async function testFirefliesIntegration() {
  try {
    console.log('Scheduling bot to join a test meeting...');
    const testMeetingLink = 'https://us04web.zoom.us/j/74086020873?pwd=DSbvNBFnzVYcXFbaHe0JPzz3fIocIG.1';
    
    const result = await firefliesService.scheduleBot(
      testMeetingLink,
      'Test Wilma Meeting'
    );
    
    console.log('Bot scheduled successfully!');
    console.log('Bot ID:', result.botId);
    
    return result.botId;
  } catch (error) {
    console.error('Test failed:', error);
  }
}

testFirefliesIntegration();