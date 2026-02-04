# Changelog - n8n Workflows

All notable changes to n8n workflows will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.1.0] - 2026-02-15 (PLANNED)

### Added
- New workflow: `trigger-automation.json` - Webhook trigger for automated applications
- RAG integration node for intelligent form filling
- Captcha detection handler node
- Manual review queue node

### Changed
- Improved HTML parsing in job description extraction
- Better error handling for network timeouts
- Enhanced Telegram notification with application status

### Fixed
- Handle missing company field in job details
- Prevent duplicate applications to same job

### Security
- Masked credentials in logs
- Added rate limiting check before triggering

---

## [1.0.0] - 2026-02-04 (CURRENT)

### Added
- Initial workflow: `collect-jobs.v1.0.json`
- Daily schedule trigger (5pm)
- Google Drive integration to fetch resume
- PDF text extraction from resume
- Google Sheets integration for filter criteria
- LinkedIn job search URL builder
- Job link extraction from LinkedIn search
- Job details parsing (title, company, location, description)
- Google Gemini AI agent for job matching & cover letter generation
- Score filtering (threshold: 50)
- Google Sheets job storage
- Telegram notifications for high-scoring jobs

### Features
- **Job Collection:** Automated scraping of LinkedIn jobs
- **AI Matching:** Resume-to-job matching with scoring (0-100)
- **Cover Letter:** AI-generated cover letters based on job fit
- **Notifications:** Real-time Telegram alerts for good matches
- **Data Storage:** Persistent job records in Google Sheets

### Configuration
- Score filter threshold: adjustable (default: 50)
- Execution: Daily at 5pm
- Resume source: Google Drive PDF
- Filter criteria: Keyword, location, experience level, remote, job type, easy apply

---

## Migration Guide

### From v1.0.0 → v1.1.0

1. **New nodes to configure:**
   - Captcha Detection: Configure error message patterns
   - Manual Review Queue: Link to Google Sheets "ManualReview" tab
   - RAG Matcher: Update with your own question-answer database

2. **Updated nodes:**
   - AI Agent: New prompt includes RAG responses
   - Score Filter: Might have different output structure

3. **Steps:**
   ```
   1. Backup current workflow (export JSON)
   2. Delete old nodes
   3. Import new workflow
   4. Reconfigure API keys
   5. Test on dev environment
   6. Deploy to production
   ```

---

## Known Issues

### v1.0.0
- ❌ No automated application (manual only)
- ❌ No captcha handling
- ❌ Form fields not auto-filled

### v1.1.0 (when released)
- ⚠️ Captcha detection requires manual intervention
- ⚠️ 70%+ accuracy on RAG matching (adjust threshold as needed)
- ⚠️ LinkedIn may block bot detection → implement delays

---

## Maintenance

### Weekly
- [ ] Review job schema changes from LinkedIn
- [ ] Update selectors if HTML changed
- [ ] Monitor Telegram notifications for errors

### Monthly
- [ ] Update dependencies (n8n, OpenAI, etc)
- [ ] Review RAG database accuracy
- [ ] Backup workflow configurations

### Quarterly
- [ ] Audit security (credentials, API keys)
- [ ] Performance optimization
- [ ] Feature requests collection

---

## Contributing

To propose changes to workflows:

1. Create branch: `feature/workflow-improvement`
2. Export modified workflow to JSON
3. Create PR with detailed description
4. Include test results
5. Merge after approval

---

## Version History

| Version | Date | Status | Node Count |
|---------|------|--------|------------|
| 1.0.0 | 2026-02-04 | ✅ Active | 20 |
| 1.1.0 | 2026-02-15 | 🚧 Planned | 28 |

---

## Support

For workflow issues:
- Check logs in n8n UI
- Export workflow and compare with version in GitHub
- Open issue on GitHub with workflow export + error message
