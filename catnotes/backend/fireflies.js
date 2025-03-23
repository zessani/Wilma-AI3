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

    // Check if response contains errors
    if (response.data.errors) {
      console.error('Fireflies API returned errors:', response.data.errors);
      throw new Error(response.data.errors[0].message);
    }

    // Validate response data structure
    if (!response.data || !response.data.data) {
      console.error('Invalid API response structure:', response.data);
      throw new Error('Invalid API response structure');
    }

    const result = response.data.data.addToLiveMeeting;
    
    // Validate result
    if (!result) {
      console.error('No result data in API response');
      throw new Error('Failed to schedule bot - no result data');
    }

    return {
      success: result.success === true,
      error: result.success === true ? null : 'Failed to schedule bot'
    };

  } catch (error) {
    // Handle axios errors
    if (error.response) {
      // The request was made and the server responded with a status code
      // that falls out of the range of 2xx
      console.error('API Error Response:', error.response.data);
      throw new Error(`API Error: ${error.response.data?.errors?.[0]?.message || error.response.statusText}`);
    } else if (error.request) {
      // The request was made but no response was received
      console.error('No response received from API');
      throw new Error('No response received from Fireflies API');
    } else {
      // Something happened in setting up the request that triggered an Error
      console.error('Error scheduling Fireflies bot:', error.message);
      throw error;
    }
  }
};

// Get recent transcripts
const getRecentTranscripts = async (limit = 10) => {
  try {
    const response = await axios.post(
      FIREFLIES_API_URL,
      {
        query: `
          query GetRecentTranscripts($limit: Int) {
            transcripts(limit: $limit) {
              id
              title
              dateString
            }
          }
        `,
        variables: {
          limit
        }
      },
      {
        headers: {
          'Authorization': `Bearer ${FIREFLIES_API_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );

    return response.data.data.transcripts;
  } catch (error) {
    console.error('Error getting recent transcripts:', error.response?.data || error.message);
    throw error;
  }
};

// Find transcript by title (case-insensitive partial match)
const findTranscriptByTitle = async (searchTitle, maxResults = 10) => {
  try {
    const transcripts = await getRecentTranscripts(maxResults);
    return transcripts.filter(t => 
      t.title.toLowerCase().includes(searchTitle.toLowerCase())
    );
  } catch (error) {
    console.error('Error finding transcript:', error);
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
    
    if (transcriptData.sentences && Array.isArray(transcriptData.sentences) && transcriptData.sentences.length > 0) {
      formattedTranscript = transcriptData.sentences.map(sentence => 
        `${sentence.speaker_name || 'Speaker'}: ${sentence.text}`
      ).join('\n\n');
    }
    
    // Ensure action items is always an array
    let actionItems = [];
    if (transcriptData.summary && transcriptData.summary.action_items) {
      actionItems = Array.isArray(transcriptData.summary.action_items) 
        ? transcriptData.summary.action_items 
        : [transcriptData.summary.action_items];
    }
    
    // Ensure summary is a string
    const summary = transcriptData.summary?.overview || '';
    
    return {
      transcript: formattedTranscript || 'No transcript text available.',
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
  getTranscription,
  getRecentTranscripts,
  findTranscriptByTitle
};