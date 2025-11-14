import OpenAI from 'openai';
import fs from 'fs';
import path from 'path';
import FormData from 'form-data';
import axios from 'axios';

const useGoogleSTT = process.env.USE_GOOGLE_STT === 'true';

let openaiClient = null;
if (!useGoogleSTT && process.env.OPENAI_API_KEY) {
  openaiClient = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
    timeout: 300000, // 5 minutes timeout for large audio files
    maxRetries: 3, // Retry up to 3 times on failure
  });
}

export const transcribeAudio = async (audioPath) => {
  if (useGoogleSTT) {
    return await transcribeWithGoogle(audioPath);
  } else {
    return await transcribeWithWhisper(audioPath);
  }
};

const transcribeWithWhisper = async (audioPath) => {
  if (!openaiClient) {
    throw new Error('OpenAI API key not configured');
  }

  // Get file size for logging
  const stats = fs.statSync(audioPath);
  const fileSizeInMB = (stats.size / (1024 * 1024)).toFixed(2);
  console.log(`[Whisper] Transcribing audio file: ${audioPath} (${fileSizeInMB} MB)`);

  let lastError = null;
  const maxRetries = 3;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`[Whisper] Attempt ${attempt}/${maxRetries}`);
      
      // Try using axios with form-data directly for more reliable file uploads
      const fileName = path.basename(audioPath);
      const fileStats = fs.statSync(audioPath);
      
      console.log(`[Whisper] Sending request with file size: ${(fileStats.size / 1024).toFixed(2)} KB`);
      const startTime = Date.now();
      
      // Use form-data for multipart form upload
      const formData = new FormData();
      const fileStream = fs.createReadStream(audioPath);
      formData.append('file', fileStream, {
        filename: fileName,
        contentType: 'audio/m4a'
      });
      formData.append('model', 'whisper-1');
      formData.append('language', 'en');
      formData.append('response_format', 'text');
      
      // Make direct API call with axios
      const response = await axios.post(
        'https://api.openai.com/v1/audio/transcriptions',
        formData,
        {
          headers: {
            'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
            ...formData.getHeaders()
          },
          timeout: 300000, // 5 minutes
          maxContentLength: Infinity,
          maxBodyLength: Infinity
        }
      );
      
      const transcription = response.data;
      
      // Ensure stream is closed
      fileStream.destroy();

      const duration = ((Date.now() - startTime) / 1000).toFixed(2);
      console.log(`[Whisper] Transcription successful in ${duration}s (${transcription.length} characters)`);
      return transcription;
    } catch (error) {
      lastError = error;
      const errorMessage = error.message || 'Unknown error';
      const errorCode = error.code || error.cause?.code || error.error?.code;
      const statusCode = error.response?.status || error.status;
      
      // Check for rate limiting (429) or connection errors
      const isRateLimit = statusCode === 429;
      const isConnectionError = errorCode === 'ECONNRESET' || 
                                errorCode === 'ETIMEDOUT' ||
                                errorMessage.includes('Connection') ||
                                errorMessage.includes('socket hang up') ||
                                errorMessage.includes('timeout');
      
      console.error(`[Whisper] Attempt ${attempt} failed:`, errorMessage);
      if (errorCode) {
        console.error(`[Whisper] Error code: ${errorCode}`);
      }
      if (statusCode) {
        console.error(`[Whisper] HTTP status: ${statusCode}`);
      }
      
      // Handle rate limiting with longer backoff
      if (attempt < maxRetries && isRateLimit) {
        // For rate limits, use longer exponential backoff: 10s, 20s, 40s
        const waitTime = Math.min(attempt * 10000, 60000); // Cap at 60 seconds
        console.log(`[Whisper] Rate limit detected (429). Retrying in ${waitTime/1000}s...`);
        await new Promise(resolve => setTimeout(resolve, waitTime));
        continue;
      }
      
      // Handle connection errors with shorter backoff
      if (attempt < maxRetries && isConnectionError) {
        const waitTime = attempt * 3000; // Exponential backoff: 3s, 6s, 9s
        console.log(`[Whisper] Connection error detected. Retrying in ${waitTime}ms...`);
        await new Promise(resolve => setTimeout(resolve, waitTime));
        continue;
      }
      
      // If it's the last attempt or not a retryable error, throw
      if (attempt === maxRetries) {
        if (isRateLimit) {
          throw new Error(`Transcription failed: Rate limit exceeded. Please try again in a few minutes.`);
        }
        throw new Error(`Transcription failed after ${maxRetries} attempts: ${errorMessage}`);
      }
      throw new Error(`Transcription failed: ${errorMessage}`);
    }
  }
  
  // Should never reach here, but just in case
  throw new Error(`Transcription failed after ${maxRetries} attempts: ${lastError?.message || 'Unknown error'}`);
};

const transcribeWithGoogle = async (audioPath) => {
  // Google Cloud Speech-to-Text implementation
  // This requires @google-cloud/speech package and service account credentials
  // For now, we'll throw an error if Google STT is selected but not fully configured
  
  if (!process.env.GOOGLE_APPLICATION_CREDENTIALS) {
    throw new Error('Google Cloud credentials not configured. Set GOOGLE_APPLICATION_CREDENTIALS environment variable.');
  }

  // TODO: Implement Google Cloud Speech-to-Text
  // const speech = require('@google-cloud/speech').v1.SpeechClient;
  // const client = new speech();
  // ... implementation here
  
  throw new Error('Google Cloud Speech-to-Text not yet implemented. Please use OpenAI Whisper by setting USE_GOOGLE_STT=false');
};

