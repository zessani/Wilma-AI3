// fireflies.js
const axios = require('axios');

const FIREFLIES_API_KEY = process.env.FIREFLIES_API_KEY;
const FIREFLIES_API_URL = 'https://api.fireflies.ai/graphql';

// Schedule a bot to join a meeting
const scheduleBot = async (meetingLink, meetingTitle) => {
  try {
    const response = await axios.post(
      FIREFLIES_API_URL,
      {
        query: `
          mutation AddToLiveMeeting($meetingLink: String!, $title: String) {
            addToLiveMeeting(meeting_link: $meetingLink, title: $title) {
              success
            }
          }
        `,
        variables: {
          meetingLink: meetingLink,
          title: meetingTitle
        }
      },
      {
        headers: {
          'Authorization': `Bearer ${FIREFLIES_API_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );
    
    return response.data.data.addToLiveMeeting;
  } catch (error) {
    console.error('Error scheduling Fireflies bot:', error.response?.data || error.message);
    throw error;
  }
};

// Get transcription for a meeting
const getTranscription = async (botId) => {
  try {
    const response = await axios.post(
      FIREFLIES_API_URL,
      {
        query: `
          query GetTranscription($botId: ID!) {
            meeting(id: $botId) {
              transcript
              summary
              actionItems
            }
          }
        `,
        variables: {
          botId: botId
        }
      },
      {
        headers: {
          'Authorization': `Bearer ${FIREFLIES_API_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );
    
    return response.data.data.meeting;
  } catch (error) {
    console.error('Error getting Fireflies transcription:', error.response?.data || error.message);
    throw error;
  }
};

module.exports = {
  scheduleBot,
  getTranscription
};