import axios from 'axios';
import fs from 'fs';
import path from 'path';
import { getUserById } from './userService.js';

const generatedAudioDir = process.env.GENERATED_AUDIO_DIR || './uploads/generated';
const elevenLabsApiKey = process.env.ELEVENLABS_API_KEY;
const elevenLabsVoiceId = process.env.ELEVENLABS_VOICE_ID;

export const generateAudio = async (text, sessionId, userId = null) => {
  if (!elevenLabsApiKey) {
    throw new Error('ElevenLabs API key not configured');
  }

  // Try to get user's voiceId, fallback to default voiceId
  let voiceIdToUse = elevenLabsVoiceId;
  
  if (userId) {
    try {
      const user = await getUserById(userId);
      if (user && user.voiceId) {
        voiceIdToUse = user.voiceId;
        console.log(`🎤 [TTS] Using user's voice clone: ${voiceIdToUse}`);
      }
    } catch (error) {
      console.warn(`⚠️ [TTS] Could not fetch user voiceId, using default: ${error.message}`);
    }
  }

  if (!voiceIdToUse) {
    throw new Error('ElevenLabs Voice ID not configured. Please enroll a voice first or clone your voice.');
  }

  try {
    const url = `https://api.elevenlabs.io/v1/text-to-speech/${voiceIdToUse}`;
    
    const response = await axios.post(
      url,
      {
        text: text,
        model_id: 'eleven_multilingual_v2', // or 'eleven_monolingual_v1' for English only
        voice_settings: {
          stability: 0.5,
          similarity_boost: 0.75,
          style: 0.0,
          use_speaker_boost: true
        }
      },
      {
        headers: {
          'Accept': 'audio/mpeg',
          'Content-Type': 'application/json',
          'xi-api-key': elevenLabsApiKey
        },
        responseType: 'arraybuffer'
      }
    );

    // Save the audio file
    const filename = `reframed_${sessionId}_${Date.now()}.mp3`;
    const filePath = path.join(generatedAudioDir, filename);
    
    fs.writeFileSync(filePath, Buffer.from(response.data));

    return filename;
  } catch (error) {
    console.error('ElevenLabs TTS error:', error.response?.data || error.message);
    throw new Error(`TTS generation failed: ${error.response?.data?.detail?.message || error.message}`);
  }
};

