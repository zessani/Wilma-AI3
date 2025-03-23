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
const getTranscription = async (transcriptId) => {
  try {
    const response = await axios.post(
      FIREFLIES_API_URL,
      {
        query: `
          query Transcript($transcriptId: String!) {
            transcript(id: $transcriptId) {
              title
              sentences {
                text
                speaker_name
              }
              summary {
                action_items
                overview
              }
            }
          }
        `,
        variables: {
          transcriptId: transcriptId
        }
      },
      {
        headers: {
          'Authorization': `Bearer ${FIREFLIES_API_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );
    
    const transcriptData = response.data.data.transcript;
    
    if (!transcriptData) {
      return null;
    }
    
    // Format transcript from sentences
    let formattedTranscript = '';
    
    if (transcriptData.sentences && transcriptData.sentences.length > 0) {
      formattedTranscript = transcriptData.sentences.map(sentence => 
        `${sentence.speaker_name}: ${sentence.text}`
      ).join('\n\n');
    }
    
    // Extract action items 
    const actionItems = transcriptData.summary?.action_items || [];
    
    // Extract summary
    const summary = transcriptData.summary?.overview || '';
    
    return {
      transcript: formattedTranscript,
      summary: summary,
      actionItems: actionItems
    };
  } catch (error) {
    console.error('Error getting Fireflies transcription:', error.response?.data || error.message);
    throw error;
  }
};

module.exports = {
  scheduleBot,
  getTranscription
};