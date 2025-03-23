// recall-service.js
const axios = require('axios');

const RECALL_API_KEY = process.env.RECALL_API_KEY;
const RECALL_API_URL = 'https://api.recall.ai/api/v1';

// Create a bot to join a meeting
const createBot = async (meetingLink) => {
  try {
    const response = await axios.post(`${RECALL_API_URL}/bot`, 
      {
        meeting_url: meetingLink,
        bot_name: "Wilma AI",
        recording_mode: "audio_only"
      },
      {
        headers: {
          'Authorization': `Token ${RECALL_API_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );
    
    return response.data;
  } catch (error) {
    console.error('Error creating Recall bot:', error);
    throw error;
  }
};

// Get audio from a bot session
const getAudioFromBot = async (botId) => {
  try {
    const response = await axios.get(`${RECALL_API_URL}/bot/${botId}/recording`, 
      {
        headers: {
          'Authorization': `Token ${RECALL_API_KEY}`
        },
        responseType: 'arraybuffer'
      }
    );
    
    return response.data;
  } catch (error) {
    console.error('Error getting audio from Recall:', error);
    throw error;
  }
};

module.exports = {
  createBot,
  getAudioFromBot
};