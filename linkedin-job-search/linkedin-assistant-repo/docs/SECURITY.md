# 🔐 SECURITY - LinkedIn Assistant

## Overview

This document outlines security best practices and implementation for the LinkedIn Assistant project.

## 1. Credentials Management

### ❌ NEVER DO
```javascript
// ❌ WRONG - Credentials in code
const email = "user@gmail.com";
const password = "secret123";

// ❌ WRONG - Credentials in commits
git add .env
```

### ✅ CORRECT

**Local Development:**
```bash
# Create .env (not in git)
LINKEDIN_EMAIL=your-email@example.com
LINKEDIN_PASSWORD=your-password
GOOGLE_SHEETS_API_KEY=xxx-yyy-zzz
```

```javascript
// Load from environment
import dotenv from 'dotenv';
dotenv.config();

const email = process.env.LINKEDIN_EMAIL;
const password = process.env.LINKEDIN_PASSWORD;
```

**Production (GitHub Actions):**
1. Go to: Settings → Secrets and variables → Actions
2. Create secrets:
   - `LINKEDIN_EMAIL`
   - `LINKEDIN_PASSWORD`
   - `GOOGLE_SHEETS_API_KEY`
   - `N8N_WEBHOOK_URL`

3. Use in CI/CD:
```yaml
- name: Deploy
  env:
    LINKEDIN_EMAIL: ${{ secrets.LINKEDIN_EMAIL }}
    LINKEDIN_PASSWORD: ${{ secrets.LINKEDIN_PASSWORD }}
```

## 2. Code Security

### Secret Detection

**Pre-commit hooks (recommended):**
```bash
npm install --save-dev husky lint-staged
npx husky install
```

**Scan commits for secrets:**
```bash
# Manual scan
git log --all -p | grep -i "password\|api_key\|secret"

# Tool: git-secrets (https://github.com/awslabs/git-secrets)
brew install git-secrets
git secrets --install
git secrets --add --global "password\s*=\s*"
```

### If you accidentally committed secrets:

```bash
# ⚠️ CRITICAL: Revoke the exposed credentials IMMEDIATELY

# Remove from git history
git filter-branch --tree-filter 'rm .env' HEAD

# Force push (WARNING: rewrites history)
git push origin --force

# Verify it's gone
git log --all -p | grep LINKEDIN_PASSWORD  # Should be empty
```

## 3. Data Security

### Google Sheets API

**Setup securely:**
```bash
# Use service account JSON (not API key directly)
# Download from Google Cloud Console

# Encrypt locally
openssl enc -aes-256-cbc -in credentials.json -out credentials.json.enc
```

**Least Privilege:**
- Service account should only have access to specific sheets
- Set role to "Spreadsheet reader/writer" (not Editor)
- Disable unused permissions

### LinkedIn Authentication

**Risks:**
- ⚠️ LinkedIn can detect automated logins
- ⚠️ Captchas may block access
- ⚠️ Account ban if too aggressive

**Mitigation:**
```javascript
// 1. Add realistic delays
await page.waitForTimeout(Math.random() * 5000 + 2000);

// 2. Rotate User-Agent
const userAgents = [
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
  // ... more
];
const ua = userAgents[Math.floor(Math.random() * userAgents.length)];
await browser.setUserAgent(ua);

// 3. Respect rate limits
const MAX_APPLICATIONS_PER_DAY = 50;
const MAX_APPLICATIONS_PER_HOUR = 10;

// 4. Handle captcha gracefully
try {
  await handleCaptcha(page);
} catch (e) {
  logger.warn('Captcha detected, pausing for manual intervention');
  // Alert user
}
```

## 4. Network Security

### HTTPS Only
```javascript
// Ensure all requests use HTTPS
axios.defaults.httpsAgent = new https.Agent({
  rejectUnauthorized: true,
});
```

### API Key Protection
```javascript
// Never expose API key in logs
logger.info('Sheets API call', {
  // ❌ WRONG:
  // apiKey: process.env.GOOGLE_SHEETS_API_KEY,
  
  // ✅ CORRECT:
  apiKeyHash: crypto
    .createHash('sha256')
    .update(process.env.GOOGLE_SHEETS_API_KEY)
    .digest('hex')
    .substring(0, 8),
});
```

## 5. Application-Level Security

### Input Validation
```javascript
import { z } from 'zod';

const JobSchema = z.object({
  id: z.number().positive(),
  link: z.string().url().includes('linkedin.com'),
  title: z.string().min(1).max(200),
  // ...
});

const validateJob = (data) => {
  return JobSchema.parse(data);
};
```

### Rate Limiting
```javascript
import rateLimit from 'express-rate-limit';

const limiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 10, // 10 requests per minute
  message: 'Too many requests, please try again later',
});

app.post('/apply', limiter, (req, res) => {
  // Handle application
});
```

### CSRF Protection
```javascript
// If using express:
const csrf = require('csurf');
const cookieParser = require('cookie-parser');

app.use(cookieParser());
app.use(csrf({ cookie: false }));

app.post('/apply', (req, res) => {
  if (!req.csrfToken()) {
    return res.status(403).send('CSRF token missing');
  }
  // Process
});
```

## 6. Logging Security

### What to Log
```javascript
// ✅ GOOD:
logger.info('Application submitted', {
  jobId: 123,
  timestamp: new Date(),
  duration: 5000,
  success: true,
});

// ❌ BAD:
logger.info('Application submitted', {
  email: 'user@gmail.com',        // 🔴 PII
  password: 'secret123',          // 🔴 SECRET
  creditCard: '1234-5678-9012',   // 🔴 SENSITIVE
});
```

### Log Rotation
```javascript
// Rotate logs to prevent disk space issues
import pino from 'pino';
import pinoRollingFile from 'pino-rolling-file';

const transport = pinoRollingFile({
  dir: './logs',
  maxSize: '10M',
  maxFiles: 10,
});

const logger = pino(transport);
```

### Log Retention
- Keep logs for 30 days max
- Encrypt archived logs
- Delete after retention period

## 7. Environment-Specific Settings

### Development
```bash
# .env.development
NODE_ENV=development
LOG_LEVEL=debug
HEADLESS=false  # See browser
DEBUG_FORMS=true
MAX_APPLICATIONS_PER_DAY=5  # Low limit
```

### Staging
```bash
# .env.staging
NODE_ENV=staging
LOG_LEVEL=info
HEADLESS=true
MAX_APPLICATIONS_PER_DAY=25
```

### Production
```bash
# GitHub Secrets
NODE_ENV=production
LOG_LEVEL=warn
HEADLESS=true
MAX_APPLICATIONS_PER_DAY=50
ENABLE_MONITORING=true
```

## 8. Incident Response

### If credentials are exposed:

1. **Immediate Actions:**
   - Revoke credentials in LinkedIn/Google
   - Rotate GitHub Secrets
   - Delete any local `.env` files

2. **Investigation:**
   - Check logs for unauthorized access
   - Audit git history for exposures
   - Review deployed versions

3. **Remediation:**
   - Update code to remove hardcoded values
   - Use `git filter-branch` to remove from history
   - Force push (if necessary)

4. **Prevent Future:**
   - Install `git-secrets` hooks
   - Review `.gitignore`
   - Add pre-commit linting

## 9. Dependencies Security

### Regular Audits
```bash
# Check for vulnerable dependencies
npm audit

# Fix automatically (if safe)
npm audit fix

# Update dependencies
npm outdated  # See what's outdated
npm update    # Update to latest versions
```

### Dependency Lockfile
```bash
# Always commit package-lock.json
git add package-lock.json
git commit -m "chore: update dependencies"
```

### Trusted Sources Only
- Only install from npm registry
- Avoid packages with many unreviewed dependencies
- Check package popularity & maintenance status

## 10. Compliance & Legal

### LinkedIn Terms of Service
- ⚠️ Automated login may violate ToS
- ⚠️ Screen scraping is prohibited
- ⚠️ Consider LinkedIn API alternatives if available

**Recommendation:** Get legal review before deploying to production.

### Data Privacy (GDPR, CCPA)
- Don't store user data longer than necessary
- Provide opt-out mechanism
- Document data processing practices

## Checklist

Before deploying to production:

- [ ] No `.env` file in git
- [ ] All secrets in GitHub Secrets
- [ ] Zero hardcoded credentials in code
- [ ] Logging doesn't expose sensitive data
- [ ] Input validation on all endpoints
- [ ] Rate limiting enabled
- [ ] HTTPS enforced
- [ ] Error messages don't leak info
- [ ] Dependencies audited (`npm audit`)
- [ ] git-secrets hooks installed
- [ ] `.gitignore` covers all secrets
- [ ] Credentials rotation plan in place
- [ ] Legal review of LinkedIn automation (if needed)

---

## Resources

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [GitHub: Keeping data safe](https://docs.github.com/code-security)
- [Node.js Security Best Practices](https://nodejs.org/en/docs/guides/security/)
- [Google Cloud: Best Practices](https://cloud.google.com/docs/authentication/best-practices-applications)
