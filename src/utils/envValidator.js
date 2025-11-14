// Environment variable validator
export const validateEnv = () => {
  const requiredVars = [
    'JWT_SECRET',
    'OPENAI_API_KEY',
    'ELEVENLABS_API_KEY'
  ];

  const missing = [];
  const warnings = [];

  // Check required variables
  requiredVars.forEach(varName => {
    if (!process.env[varName] || process.env[varName].trim() === '') {
      missing.push(varName);
    }
  });

  // Check JWT_SECRET strength
  if (process.env.JWT_SECRET) {
    if (process.env.JWT_SECRET === 'your-secret-key-change-in-production') {
      warnings.push('JWT_SECRET is using the default value. Please change it in production!');
    }
    if (process.env.JWT_SECRET.length < 32) {
      warnings.push('JWT_SECRET should be at least 32 characters long for security.');
    }
  }

  // Check ELEVENLABS_VOICE_ID (optional but recommended)
  if (!process.env.ELEVENLABS_VOICE_ID) {
    warnings.push('ELEVENLABS_VOICE_ID is not set. Users will need to clone their voice.');
  }

  // Fail if required vars are missing
  if (missing.length > 0) {
    console.error('❌ [EnvValidator] Missing required environment variables:');
    missing.forEach(varName => {
      console.error(`   - ${varName}`);
    });
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }

  // Warn about configuration issues
  if (warnings.length > 0) {
    console.warn('⚠️ [EnvValidator] Configuration warnings:');
    warnings.forEach(warning => {
      console.warn(`   - ${warning}`);
    });
  }

  console.log('✅ [EnvValidator] Environment variables validated');
};

