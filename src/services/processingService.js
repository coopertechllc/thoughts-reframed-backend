import { transcribeAudio } from './speechToTextService.js';
import { reframeText } from './reframingService.js';
import { generateAudio } from './ttsService.js';
import { getSession, updateSession } from './sessionService.js';
import fs from 'fs';
import path from 'path';

const generatedAudioDir = process.env.GENERATED_AUDIO_DIR || './uploads/generated';

// Ensure generated audio directory exists
if (!fs.existsSync(generatedAudioDir)) {
  fs.mkdirSync(generatedAudioDir, { recursive: true });
}

export const processAudioPipeline = async (sessionId) => {
  try {
    const session = await getSession(sessionId);
    
    if (!session || !session.audioFiles || session.audioFiles.length === 0) {
      throw new Error('Session or audio files not found');
    }

    // Use the most recently uploaded audio file
    const audioFile = session.audioFiles[session.audioFiles.length - 1];
    const audioPath = audioFile.path;

    // Step 1: Speech-to-Text
    console.log(`[${sessionId}] Starting transcription...`);
    await updateSession(sessionId, { status: 'transcribing' });
    const transcript = await transcribeAudio(audioPath);
    await updateSession(sessionId, { transcript, status: 'transcribed' });
    console.log(`[${sessionId}] Transcription complete`);

    // Step 2: AI Reframing
    console.log(`[${sessionId}] Starting reframing...`);
    await updateSession(sessionId, { status: 'reframing' });
    const reframedText = await reframeText(transcript);
    await updateSession(sessionId, { reframedText, status: 'reframed' });
    console.log(`[${sessionId}] Reframing complete`);

    // Step 3: Text-to-Speech (Voice Cloning) - Optional
    // If TTS fails, we still mark as completed since transcript and reframe are ready
    let generatedAudioUrl = null;
    try {
      console.log(`[${sessionId}] Starting TTS generation...`);
      await updateSession(sessionId, { status: 'generating_audio' });
      const audioFilename = await generateAudio(reframedText, sessionId, session.userId);
      generatedAudioUrl = `/uploads/${audioFilename}`;
      console.log(`[${sessionId}] Audio generation complete`);
    } catch (ttsError) {
      console.warn(`[${sessionId}] TTS generation failed (non-critical):`, ttsError.message);
      // Don't throw - TTS is optional, transcript and reframe are the main results
      // Store the TTS error but don't fail the whole pipeline
      await updateSession(sessionId, { 
        error: `TTS unavailable: ${ttsError.message}. Transcript and reframe are ready.`
      });
    }
    
    // Mark as completed even if TTS failed
    await updateSession(sessionId, { 
      generatedAudioUrl, 
      status: 'completed' 
    });

    return {
      transcript,
      reframedText,
      generatedAudioUrl
    };
  } catch (error) {
    console.error(`[${sessionId}] Pipeline error:`, error);
    await updateSession(sessionId, {
      status: 'error',
      error: error.message
    });
    throw error;
  }
};

