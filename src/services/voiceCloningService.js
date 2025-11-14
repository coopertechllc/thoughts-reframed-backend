import axios from 'axios';
import FormData from 'form-data';
import fs from 'fs';

const elevenLabsApiKey = process.env.ELEVENLABS_API_KEY;

// Standard paragraph for voice cloning (approximately 200 words)
const VOICE_CLONING_TEXT = `Welcome to the future of voice technology. This paragraph is designed to capture the unique characteristics of your voice, including your tone, pitch, rhythm, and pronunciation patterns. As you read these words, the advanced voice cloning system will learn to replicate your natural speaking style. The goal is to create a digital version of your voice that sounds remarkably similar to the real thing. This technology has applications in various fields, from accessibility features to creative content production. Your voice is unique, and this system aims to preserve its distinctive qualities while enabling new possibilities for communication and expression.`;

export const createVoiceClone = async (audioFilePath, voiceName) => {
  if (!elevenLabsApiKey) {
    throw new Error('ElevenLabs API key not configured');
  }

  try {
    // Create form data for multipart upload
    const formData = new FormData();
    
    // Read the audio file
    const audioFile = fs.createReadStream(audioFilePath);
    formData.append('files', audioFile);
    formData.append('name', voiceName || 'My Voice Clone');
    formData.append('description', 'Voice clone created from user recording');

    console.log(`🎤 [VoiceCloning] Creating voice clone for: ${voiceName}`);
    
    const response = await axios.post(
      'https://api.elevenlabs.io/v1/voices/add',
      formData,
      {
        headers: {
          'xi-api-key': elevenLabsApiKey,
          ...formData.getHeaders()
        },
        maxContentLength: Infinity,
        maxBodyLength: Infinity,
        timeout: 120000 // 2 minutes timeout for voice cloning
      }
    );

    console.log(`✅ [VoiceCloning] Voice clone created successfully: ${response.data.voice_id}`);
    
    return {
      voiceId: response.data.voice_id,
      name: response.data.name
    };
  } catch (error) {
    console.error('ElevenLabs voice cloning error:', error.response?.data || error.message);
    
    if (error.response?.status === 401) {
      const errorMsg = error.response?.data?.message || error.response?.data?.detail?.message || 'ElevenLabs API key is invalid or unauthorized';
      throw new Error(`ElevenLabs API error: ${errorMsg}`);
    }
    if (error.response?.status === 400) {
      const errorMsg = error.response?.data?.message || error.response?.data?.detail?.message || 'Audio quality may be insufficient';
      throw new Error(`Invalid voice sample: ${errorMsg}`);
    }
    
    const errorMsg = error.response?.data?.message || error.response?.data?.detail?.message || error.message;
    throw new Error(`Voice cloning failed: ${errorMsg}`);
  }
};

export const getVoiceCloningText = () => {
  return VOICE_CLONING_TEXT;
};

