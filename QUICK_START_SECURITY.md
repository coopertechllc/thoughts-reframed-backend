# Quick Start: Security Implementation

## ✅ What's Been Implemented

### Backend Security (Node.js/Express)
1. **Rate Limiting** - Protection against brute force attacks
   - Login: 5 attempts per 15 minutes
   - Signup: 3 attempts per hour
   - API: 100 requests per 15 minutes
   - Uploads: 20 uploads per hour

2. **Account Lockout** - Locks accounts after 5 failed login attempts for 15 minutes

3. **Strong Password Policy** - Requires 8+ characters with uppercase, lowercase, and number

4. **Input Validation** - Validates and sanitizes all user inputs

5. **Security Headers** - Adds security headers (HSTS, CSP, XSS Filter, etc.)

6. **CORS Configuration** - Restricts CORS to allowed origins in production

7. **Request Timeouts** - Prevents hanging requests

8. **Error Sanitization** - Generic error messages in production

9. **Environment Validation** - Fails startup if required env vars are missing

### iOS App Security (Swift/SwiftUI)
1. **Input Validation** - Validates email format and password strength

2. **Input Sanitization** - Sanitizes inputs to prevent XSS attacks

3. **Secure Keychain** - Stores tokens securely with optional biometric protection

4. **Request Timeouts** - Configures URLSession with appropriate timeouts

5. **Log Sanitization** - Removes sensitive data from logs in production

## 🚀 Getting Started

### 1. Install Dependencies

```bash
cd thoughts-reframed-backend
npm install
```

New packages installed:
- `express-rate-limit` - Rate limiting
- `helmet` - Security headers
- `express-validator` - Input validation

### 2. Configure Environment Variables

Update your `.env` file:

```env
# Required
JWT_SECRET=your-strong-secret-key-here-minimum-32-characters
OPENAI_API_KEY=your-openai-api-key
ELEVENLABS_API_KEY=your-elevenlabs-api-key

# Optional
ELEVENLABS_VOICE_ID=your-elevenlabs-voice-id
NODE_ENV=development
ALLOWED_ORIGINS=https://your-app-domain.com

# New directories
LOCKOUT_DIR=./data/lockouts
```

### 3. Start the Backend

```bash
npm start
```

The server will validate environment variables at startup and fail if required ones are missing.

### 4. Test Security Features

#### Test Rate Limiting
```bash
# Try to login 6 times quickly (should be rate limited after 5 attempts)
for i in {1..6}; do
  curl -X POST http://localhost:3000/auth/login \
    -H "Content-Type: application/json" \
    -d '{"email":"test@example.com","password":"wrong"}'
done
```

#### Test Account Lockout
```bash
# Try to login with wrong password 5 times (account should be locked)
for i in {1..5}; do
  curl -X POST http://localhost:3000/auth/login \
    -H "Content-Type: application/json" \
    -d '{"email":"test@example.com","password":"wrong"}'
done
```

#### Test Password Validation
```bash
# Try to signup with weak password (should fail)
curl -X POST http://localhost:3000/auth/signup \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"weak"}'
```

### 5. iOS App Changes

The iOS app now includes:
- Input validation in `SignupView` and `LoginView`
- Secure Keychain storage with biometric protection available
- Request timeouts configured
- Log sanitization utilities

No additional configuration needed for development. For production:
- Update `baseURL` in `APIService.swift` to use HTTPS
- Configure certificate pinning
- Enable biometric authentication in settings

## 📋 Security Checklist

### Backend
- [x] Rate limiting on auth endpoints
- [x] Account lockout after failed attempts
- [x] Strong password policy
- [x] Input validation
- [x] Security headers
- [x] CORS configuration
- [x] Request timeouts
- [x] Error sanitization
- [x] Environment validation
- [ ] HTTPS/TLS in production
- [ ] Certificate pinning
- [ ] Refresh token mechanism
- [ ] File upload content validation
- [ ] Audit logging

### iOS App
- [x] Input validation
- [x] Input sanitization
- [x] Secure Keychain storage
- [x] Biometric protection (available)
- [x] Request timeouts
- [x] Log sanitization
- [ ] HTTPS URLs (needs production URL)
- [ ] Certificate pinning (needs production certificate)
- [ ] Biometric authentication UI

## 🔍 Testing

### Backend Testing
1. Test rate limiting by making multiple requests quickly
2. Test account lockout by making 5 failed login attempts
3. Test password validation with weak passwords
4. Test input validation with invalid emails
5. Test error handling in production mode

### iOS Testing
1. Test input validation with invalid emails and weak passwords
2. Test Keychain security with biometric authentication
3. Test request timeouts with slow network
4. Test error handling to ensure no sensitive data is exposed

## 📚 Documentation

- `SECURITY_GUIDE.md` - Comprehensive security guide
- `IMPLEMENTATION_SUMMARY.md` - Detailed implementation summary
- `QUICK_START_SECURITY.md` - This file

## 🛠️ Troubleshooting

### Backend Issues

#### Server fails to start
- Check that all required environment variables are set
- Check that JWT_SECRET is at least 32 characters
- Check that JWT_SECRET is not using the default value

#### Rate limiting too strict
- Adjust rate limits in `src/middleware/rateLimiter.js`
- Consider different limits for different endpoints

#### Account lockout too strict
- Adjust lockout duration in `src/middleware/accountLockout.js`
- Adjust max failed attempts

### iOS Issues

#### Input validation not working
- Check that `InputValidator` is accessible (it's in `SecureAPIService.swift`)
- Check that validation is called in the views

#### Keychain not working
- Check that Keychain entitlements are set in Xcode
- Check that biometric authentication is available on the device

## 🔐 Production Checklist

Before deploying to production:

1. **Backend**
   - [ ] Set `NODE_ENV=production`
   - [ ] Set strong `JWT_SECRET` (minimum 32 characters)
   - [ ] Configure `ALLOWED_ORIGINS` for CORS
   - [ ] Enable HTTPS/TLS
   - [ ] Set up monitoring and alerting
   - [ ] Perform security audit

2. **iOS App**
   - [ ] Update `baseURL` to use HTTPS
   - [ ] Configure certificate pinning
   - [ ] Enable biometric authentication
   - [ ] Remove sensitive logs in production
   - [ ] Test on physical devices
   - [ ] Perform security audit

## 📞 Support

For issues or questions:
1. Check the documentation in `SECURITY_GUIDE.md`
2. Check the implementation summary in `IMPLEMENTATION_SUMMARY.md`
3. Review the code in the security middleware files
4. Test the security features using the test commands above

