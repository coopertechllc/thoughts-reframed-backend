# Security Implementation Guide
## Thoughts Reframed App - Backend & iOS

This guide outlines security improvements for both the backend and iOS application.

## ✅ Implemented Security Features

### Backend Security
- ✅ Strong JWT secret validation (no hardcoded fallback)
- ✅ Rate limiting on auth endpoints (5 attempts per 15 min for login, 3 per hour for signup)
- ✅ Account lockout after 5 failed attempts (15 minute lockout)
- ✅ Strong password policy (8+ chars, uppercase, lowercase, number)
- ✅ Input validation and sanitization (express-validator)
- ✅ Security headers (Helmet)
- ✅ CORS configuration (production-ready)
- ✅ Request timeouts (10s auth, 30s API, 5min uploads, 10min processing)
- ✅ Error message sanitization (generic errors in production)
- ✅ Environment variable validation (fails startup if missing)

### iOS App Security
- ✅ Input validation (email format, password strength)
- ✅ Input sanitization (XSS prevention)
- ✅ Secure Keychain storage (biometric protection available)
- ✅ Request timeouts (30s request, 5min resource)
- ✅ Log sanitization utilities (production-ready)
- ✅ Password strength validation (8+ chars, complexity)

## 📋 Implementation Status

### Phase 1: Critical Security Fixes ✅
- ✅ Strong JWT secret validation
- ✅ Rate limiting on auth endpoints
- ✅ Account lockout mechanism
- ✅ Strong password policy
- ✅ Security headers (Helmet)
- ✅ Input validation
- ✅ CORS configuration
- ✅ Error message sanitization

### Phase 2: Medium Priority 🔄 (In Progress)
- ⏳ Refresh token mechanism
- ⏳ File upload content validation
- ⏳ Audit logging
- ✅ Request timeouts
- ✅ Environment variable validation

### Phase 3: iOS App Security ✅
- ✅ Input validation
- ✅ Input sanitization
- ✅ Secure Keychain storage (biometric available)
- ✅ Request timeout configuration
- ✅ Log sanitization utilities
- ⏳ HTTPS configuration (needs production URL)
- ⏳ Certificate pinning (needs production certificate)

### Phase 4: Best Practices ⏳
- ⏳ API versioning
- ⏳ Request ID tracking
- ⏳ Database encryption at rest
- ⏳ Biometric authentication UI
- ⏳ Health check security

---

## 🔴 Critical Security Issues

### 1. **Weak JWT Secret**
- **Issue**: Hardcoded fallback secret `'your-secret-key-change-in-production'`
- **Risk**: If JWT_SECRET is not set, tokens can be easily forged
- **Fix**: Require JWT_SECRET to be set, fail startup if missing

### 2. **No HTTPS/TLS**
- **Issue**: Using HTTP (localhost for dev, but production needs HTTPS)
- **Risk**: Tokens and sensitive data transmitted in plain text
- **Fix**: Use HTTPS in production, enforce SSL/TLS

### 3. **Weak Password Requirements**
- **Issue**: Only 6 characters minimum, no complexity requirements
- **Risk**: Easy to brute force weak passwords
- **Fix**: Implement stronger password policy (8+ chars, complexity)

### 4. **No Rate Limiting**
- **Issue**: No protection against brute force attacks
- **Risk**: Attackers can attempt unlimited login/signup attempts
- **Fix**: Implement rate limiting on auth endpoints

### 5. **CORS Allows All Origins**
- **Issue**: `app.use(cors())` allows all origins
- **Risk**: Any website can make requests to your API
- **Fix**: Configure CORS to only allow your iOS app

### 6. **No Input Sanitization**
- **Issue**: User input not sanitized before processing
- **Risk**: Injection attacks, XSS, path traversal
- **Fix**: Validate and sanitize all user inputs

### 7. **Error Information Leakage**
- **Issue**: Detailed error messages exposed to clients
- **Risk**: Reveals system structure and vulnerabilities
- **Fix**: Generic error messages for clients, detailed logs server-side

### 8. **File Upload Security**
- **Issue**: Only MIME type validation, no content verification
- **Risk**: Malicious files could be uploaded
- **Fix**: Validate file content, scan for malware

### 9. **No Security Headers**
- **Issue**: Missing security headers (HSTS, CSP, X-Frame-Options, etc.)
- **Risk**: Vulnerable to various attacks
- **Fix**: Add security middleware

### 10. **No Account Lockout**
- **Issue**: Unlimited login attempts
- **Risk**: Brute force attacks
- **Fix**: Implement account lockout after failed attempts

---

## 🟡 Medium Priority Security Issues

### 1. **Long Token Expiration (7 days)**
- **Issue**: Tokens valid for 7 days
- **Risk**: Stolen tokens remain valid for long period
- **Fix**: Implement refresh tokens, shorter access token lifetime

### 2. **No Token Refresh Mechanism**
- **Issue**: Users must re-login when token expires
- **Risk**: Poor UX, but also no way to revoke tokens
- **Fix**: Implement refresh token rotation

### 3. **File Storage Not Encrypted**
- **Issue**: User data stored in plain text files
- **Risk**: Data breach exposes all user data
- **Fix**: Encrypt sensitive data at rest

### 4. **No Audit Logging**
- **Issue**: No logs of security events
- **Risk**: Can't detect or investigate security incidents
- **Fix**: Log authentication events, failed attempts, etc.

### 5. **No Request Timeout**
- **Issue**: Requests can hang indefinitely
- **Risk**: DoS vulnerability
- **Fix**: Set request timeouts

---

## 🔵 Low Priority / Best Practices

### 1. **No API Versioning**
- **Issue**: Breaking changes affect all clients
- **Fix**: Implement API versioning

### 2. **No Request ID Tracking**
- **Issue**: Hard to track requests across services
- **Fix**: Add request ID to all requests

### 3. **Environment Variable Validation**
- **Issue**: App starts even if required env vars missing
- **Fix**: Validate all required env vars at startup

### 4. **No Health Check Security**
- **Issue**: Health endpoint reveals system info
- **Fix**: Add authentication or rate limiting

---

## 📱 iOS App Security Issues

### 1. **HTTP Instead of HTTPS**
- **Issue**: `http://localhost:3000` hardcoded
- **Risk**: Data transmitted in plain text
- **Fix**: Use HTTPS, implement certificate pinning

### 2. **No Certificate Pinning**
- **Issue**: Vulnerable to MITM attacks
- **Risk**: Attackers can intercept API calls
- **Fix**: Implement SSL certificate pinning

### 3. **Sensitive Data in Logs**
- **Issue**: Logging tokens, user data, etc.
- **Risk**: Logs could be exposed
- **Fix**: Remove sensitive data from logs in production

### 4. **No Request Timeout**
- **Issue**: No timeout configuration
- **Risk**: Requests can hang indefinitely
- **Fix**: Set appropriate timeouts

### 5. **No Input Validation**
- **Issue**: Client-side validation is basic
- **Risk**: Malicious input could be sent
- **Fix**: Stronger client-side validation

### 6. **Keychain Not Using Access Control**
- **Issue**: Keychain items accessible without biometrics
- **Risk**: Stolen device can access tokens
- **Fix**: Add biometric authentication for Keychain access

---

## 🛠️ Implementation Steps

### Phase 1: Critical Security Fixes (Week 1)

1. **Backend: Strong JWT Secret**
   - Require JWT_SECRET environment variable
   - Generate strong secret if missing (and warn)
   - Use crypto.randomBytes for generation

2. **Backend: Rate Limiting**
   - Install `express-rate-limit`
   - Add rate limiting to auth endpoints
   - Different limits for login vs. signup

3. **Backend: CORS Configuration**
   - Configure CORS to only allow iOS app
   - Set specific allowed origins
   - Configure allowed headers and methods

4. **Backend: Stronger Password Policy**
   - Minimum 8 characters
   - Require uppercase, lowercase, number
   - Optionally require special characters

5. **Backend: Security Headers**
   - Install `helmet` middleware
   - Configure security headers
   - Enable HSTS for HTTPS

6. **Backend: Input Validation**
   - Install `express-validator` or `joi`
   - Validate all inputs
   - Sanitize user inputs

### Phase 2: Medium Priority (Week 2)

1. **Backend: Refresh Tokens**
   - Implement refresh token mechanism
   - Shorter access token (15 minutes)
   - Longer refresh token (7 days)
   - Token rotation on refresh

2. **Backend: Account Lockout**
   - Track failed login attempts
   - Lock account after 5 failed attempts
   - Unlock after 15 minutes or admin action

3. **Backend: File Upload Security**
   - Validate file content (not just MIME type)
   - Scan files for malware
   - Limit file types more strictly

4. **Backend: Audit Logging**
   - Log authentication events
   - Log failed login attempts
   - Log sensitive operations

5. **Backend: Request Timeout**
   - Set timeout for all requests
   - Configure timeout per endpoint type

### Phase 3: iOS App Security (Week 2-3)

1. **iOS: HTTPS Configuration**
   - Use HTTPS URLs
   - Implement certificate pinning
   - Handle certificate errors properly

2. **iOS: Keychain Security**
   - Add biometric authentication
   - Use access control flags
   - Secure keychain items

3. **iOS: Remove Sensitive Logs**
   - Remove logging in production builds
   - Use conditional compilation
   - Don't log tokens or user data

4. **iOS: Request Timeout**
   - Set timeout for URLSession
   - Handle timeout errors
   - Retry with exponential backoff

5. **iOS: Input Validation**
   - Stronger client-side validation
   - Validate email format properly
   - Validate password complexity

### Phase 4: Best Practices (Week 3-4)

1. **Backend: API Versioning**
   - Implement API versioning
   - Maintain backward compatibility

2. **Backend: Environment Validation**
   - Validate all required env vars
   - Fail startup if missing
   - Provide clear error messages

3. **Backend: Database Encryption**
   - Encrypt sensitive data at rest
   - Use encryption for user data
   - Encrypt file storage

4. **iOS: Biometric Authentication**
   - Add Face ID / Touch ID
   - Require biometrics for sensitive operations
   - Fallback to passcode

---

## 📋 Security Checklist

### Backend
- [ ] Strong JWT secret (no hardcoded fallback)
- [ ] Rate limiting on auth endpoints
- [ ] CORS configured properly
- [ ] Strong password policy (8+ chars, complexity)
- [ ] Security headers (Helmet)
- [ ] Input validation and sanitization
- [ ] HTTPS/TLS in production
- [ ] Refresh token mechanism
- [ ] Account lockout after failed attempts
- [ ] File upload content validation
- [ ] Audit logging
- [ ] Request timeouts
- [ ] Error message sanitization
- [ ] Environment variable validation
- [ ] Data encryption at rest

### iOS App
- [ ] HTTPS URLs (not HTTP)
- [ ] Certificate pinning
- [ ] Keychain with biometric protection
- [ ] No sensitive data in logs
- [ ] Request timeouts configured
- [ ] Strong input validation
- [ ] Secure error handling
- [ ] Biometric authentication option
- [ ] App Transport Security configured
- [ ] Secure backup/restore

---

## 🚀 Quick Start: Critical Fixes

### 1. Backend: Install Security Dependencies

```bash
cd thoughts-reframed-backend
npm install express-rate-limit helmet express-validator
```

### 2. Backend: Update server.js

Add security middleware:
- Helmet for security headers
- Rate limiting
- CORS configuration
- Request timeout

### 3. Backend: Update auth.js

- Stronger password validation
- Account lockout mechanism
- Rate limiting

### 4. iOS: Update APIService

- HTTPS URLs
- Certificate pinning
- Request timeouts
- Remove sensitive logs

### 5. iOS: Update KeychainService

- Biometric authentication
- Access control flags

---

## 📚 Additional Resources

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [OWASP Mobile Security](https://owasp.org/www-project-mobile-security/)
- [Express Security Best Practices](https://expressjs.com/en/advanced/best-practice-security.html)
- [iOS App Transport Security](https://developer.apple.com/documentation/security/preventing_insecure_network_connections)
- [JWT Best Practices](https://datatracker.ietf.org/doc/html/rfc8725)

---

## 🔍 Security Testing

### Backend Testing
- [ ] Penetration testing
- [ ] Vulnerability scanning
- [ ] Rate limiting testing
- [ ] Input validation testing
- [ ] Authentication testing
- [ ] Authorization testing

### iOS Testing
- [ ] Static analysis
- [ ] Dynamic analysis
- [ ] Certificate pinning testing
- [ ] Keychain security testing
- [ ] Network security testing

---

## 📝 Notes

- This guide should be reviewed and updated regularly
- Security is an ongoing process, not a one-time fix
- Regular security audits should be conducted
- Keep dependencies updated
- Monitor for security vulnerabilities
- Have an incident response plan

