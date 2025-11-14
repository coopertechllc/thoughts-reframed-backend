# Thoughts Reframed Backend

Backend service for the iOS app that provides speech-to-text, AI-powered thought reframing, and voice cloning text-to-speech capabilities.

## Features

- **Speech-to-Text**: Transcribe audio using OpenAI Whisper API (or Google Cloud Speech-to-Text)
- **AI Reframing**: Reframe negative thoughts using OpenAI GPT-4 or Anthropic Claude
- **Voice Cloning TTS**: Generate audio using ElevenLabs API with voice cloning

## Prerequisites

- Node.js 18+ (with ES modules support)
- API keys for:
  - OpenAI (for Whisper STT and GPT-4 reframing)
  - OR Anthropic (for Claude reframing)
  - ElevenLabs (for voice cloning TTS)
  - OR Google Cloud (for alternative STT)

## Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```

3. Copy `.env.example` to `.env` and configure your API keys:
   ```bash
   cp .env.example .env
   ```

4. Edit `.env` with your API keys:
   ```
   OPENAI_API_KEY=your_key_here
   ELEVENLABS_API_KEY=your_key_here
   ELEVENLABS_VOICE_ID=your_voice_id_here
   ```

## Configuration

### Environment Variables

- `PORT`: Server port (default: 3000)
- `OPENAI_API_KEY`: Required for Whisper STT and GPT-4 reframing
- `ANTHROPIC_API_KEY`: Alternative to OpenAI for reframing
- `USE_ANTHROPIC_FOR_REFRAMING`: Set to `true` to use Claude instead of GPT-4
- `ELEVENLABS_API_KEY`: Required for voice cloning TTS
- `ELEVENLABS_VOICE_ID`: Required - you must enroll a voice in ElevenLabs first
- `USE_GOOGLE_STT`: Set to `true` to use Google Cloud Speech-to-Text instead of Whisper
- `UPLOAD_DIR`: Directory for uploaded audio files (default: `./uploads`)
- `GENERATED_AUDIO_DIR`: Directory for generated audio files (default: `./uploads/generated`)

### ElevenLabs Voice Setup

Before using the service, you need to:

1. Create an account at [ElevenLabs](https://elevenlabs.io)
2. Enroll a voice (upload voice samples)
3. Get your Voice ID from the ElevenLabs dashboard
4. Set `ELEVENLABS_VOICE_ID` in your `.env` file

## Running the Server

```bash
# Development mode (with auto-reload)
npm run dev

# Production mode
npm start
```

The server will start on `http://localhost:3000` (or your configured PORT).

## Docker Deployment

### Building the Image

```bash
docker build -t thoughts-reframed-backend .
```

### Running with Docker

```bash
# Run with environment variables
docker run -d \
  -p 3000:3000 \
  -e OPENAI_API_KEY=your_key_here \
  -e ELEVENLABS_API_KEY=your_key_here \
  -e ELEVENLABS_VOICE_ID=your_voice_id_here \
  -v $(pwd)/uploads:/app/uploads \
  -v $(pwd)/data:/app/data \
  --name thoughts-reframed-backend \
  thoughts-reframed-backend
```

### Using Docker Compose

1. Create a `.env` file with your API keys (see Configuration section)

2. Start the service:
   ```bash
   docker-compose up -d
   ```

3. View logs:
   ```bash
   docker-compose logs -f
   ```

4. Stop the service:
   ```bash
   docker-compose down
   ```

The Docker setup includes:
- Health checks
- Volume mounts for persistent storage
- Non-root user for security
- Automatic restarts

## API Endpoints

### POST /sessions
Create a new session.

**Response:**
```json
{
  "id": "uuid",
  "createdAt": "2024-01-01T00:00:00.000Z",
  "status": "created",
  "audioFiles": []
}
```

### POST /sessions/:id/upload
Upload an audio file for processing.

**Request:** `multipart/form-data` with `audio` field

**Response:**
```json
{
  "message": "Audio file uploaded successfully",
  "file": {
    "filename": "audio_1234567890.mp3",
    "size": 1024000,
    "mimetype": "audio/mpeg"
  }
}
```

### POST /sessions/:id/process
Trigger the processing pipeline (STT → Reframing → TTS).

**Response:**
```json
{
  "message": "Processing started",
  "sessionId": "uuid",
  "status": "processing"
}
```

### GET /sessions/:id
Get session status and results.

**Response:**
```json
{
  "id": "uuid",
  "status": "completed",
  "transcript": "Original transcribed text",
  "reframedText": "Reframed positive text",
  "generatedAudioUrl": "/uploads/reframed_uuid_1234567890.mp3",
  "audioFiles": [...]
}
```

**Status values:**
- `created`: Session created, no audio uploaded
- `audio_uploaded`: Audio file uploaded
- `processing`: Pipeline running
- `transcribing`: Converting speech to text
- `transcribed`: Transcription complete
- `reframing`: AI reframing in progress
- `reframed`: Reframing complete
- `generating_audio`: TTS generation in progress
- `completed`: All processing complete
- `error`: Error occurred

### GET /uploads/:filename
Serve generated audio files.

**Response:** Audio file stream

## Processing Pipeline

The processing pipeline runs asynchronously and consists of three steps:

1. **Speech-to-Text**: Transcribes the uploaded audio using OpenAI Whisper
2. **AI Reframing**: Reframes the transcript using GPT-4 or Claude
3. **Text-to-Speech**: Generates audio with voice cloning using ElevenLabs

Monitor the session status via `GET /sessions/:id` to track progress.

## Error Handling

All endpoints return appropriate HTTP status codes:
- `200`: Success
- `201`: Created
- `400`: Bad Request
- `404`: Not Found
- `500`: Internal Server Error

Error responses include an `error` field with a descriptive message.

## File Storage

- Uploaded audio files are stored in `./uploads/{sessionId}/`
- Generated audio files are stored in `./uploads/generated/`
- Session data is stored in `./data/sessions/`

Make sure these directories exist or have write permissions.

## Development

The project uses ES modules. Make sure your Node.js version supports ES modules (Node 18+).

## License

ISC

