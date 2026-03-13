# HPB Dojo & Prism - AI Guardrails Compliance Handover Guide

**Document Classification:** INTERNAL  
**Version:** 1.0  
**Last Updated:** January 2026  

---

## Executive Summary

This document provides a comprehensive breakdown of AI Guardrails compliance requirements, clearly delineating:
- **What Aleph Has Implemented** - Features built into the application
- **What HPB Must Handle Post-Handover** - Items requiring HPB's internal systems, policies, or infrastructure

---

## Legend
- ✅ **ALEPH DONE** - Implemented in codebase
- 🔧 **ALEPH CAN DO** - We can implement before handover
- 🏛️ **HPB REQUIRED** - Must be done by HPB's tech team
- 📋 **DOCUMENTATION** - We provide docs, HPB implements policy

---

# D.1 - ACCOUNTABILITY

## D.1.1 AI Governance Framework

| Requirement | Owner | Status | Notes |
|-------------|-------|--------|-------|
| Establish AI governance committee | 🏛️ HPB | Pending | HPB organizational structure |
| Define roles (AI Owner, Data Steward) | 🏛️ HPB | Pending | HPB to assign personnel |
| Conduct risk assessment | 📋 Both | Partial | We document risks, HPB approves |
| Maintain AI system inventory | 🏛️ HPB | Pending | Enterprise-level tracking |
| Review and approval workflows | 🏛️ HPB | Pending | HPB's internal processes |

### What Aleph Has Done:
- Documented system architecture and AI components
- Identified potential risks in our documentation
- Created audit logging infrastructure

### What HPB Must Do:
- Form AI governance committee
- Assign AI Owner and Data Steward roles
- Conduct formal risk assessment using their frameworks
- Register this tool in their AI systems inventory
- Establish approval workflows for AI changes

---

## D.1.2 Training and Awareness

| Requirement | Owner | Status | Notes |
|-------------|-------|--------|-------|
| User training on AI limitations | 📋 Both | Partial | In-app disclaimers done, formal training by HPB |
| Staff awareness of AI policies | 🏛️ HPB | Pending | Internal training program |
| Developer AI safety training | ✅ Aleph | Done | Our team is trained |

### What Aleph Has Done:
- ✅ In-app disclaimers about AI limitations
- ✅ Terms of Use explaining training-only purpose
- ✅ Clear labeling that content is AI-generated

### What HPB Must Do:
- Conduct user training sessions before deployment
- Include AI awareness in staff onboarding
- Establish ongoing training program

---

# D.2 - DATA

## D.2.1 Data Classification & Handling

| Requirement | Owner | Status | Notes |
|-------------|-------|--------|-------|
| Data classification confirmation UI | ✅ Aleph | Done | Checkbox in upload dialogs |
| IM8 compliance verification | 🏛️ HPB | Pending | Enterprise security team |
| DLP (Data Loss Prevention) | 🏛️ HPB | Pending | Requires HPB infrastructure |
| PII detection/redaction | 🔧 Aleph | Possible | Can add basic patterns, HPB needs enterprise DLP |
| Data retention policies | 📋 Both | Partial | Audit logs implemented, policy by HPB |

### What Aleph Has Done:
- ✅ Data classification confirmation checkbox in all upload dialogs
- ✅ File type validation (TXT, PDF only)
- ✅ File size limits (10MB)
- ✅ Audit logging of all uploads with user/timestamp
- ✅ Privacy Statement explaining data handling

### What Aleph Can Add:
- 🔧 Basic PII pattern detection (NRIC, phone numbers) - warn but not block
- 🔧 Content scanning for obvious sensitive terms

### What HPB Must Do:
- Implement enterprise DLP integration
- Configure data classification enforcement tools
- Establish data retention and deletion schedules
- Conduct regular data audits
- Integrate with HPB's data governance platform

---

## D.2.2 Third-Party Data Sharing (OpenAI)

| Requirement | Owner | Status | Notes |
|-------------|-------|--------|-------|
| Document OpenAI data flows | ✅ Aleph | Done | In Privacy Statement |
| OpenAI API data handling terms | 🏛️ HPB | Pending | Legal/procurement |
| Data processing agreement | 🏛️ HPB | Pending | Contract with OpenAI |
| Data residency compliance | 🏛️ HPB | Pending | May need Singapore region |

### What Aleph Has Done:
- ✅ Documented OpenAI usage in Privacy Statement
- ✅ Zero-retention API usage (no training on data)
- ✅ Minimal data sent (only necessary context)

### What HPB Must Do:
- Review and approve OpenAI's data processing terms
- Negotiate data processing agreement if needed
- Assess data residency requirements
- Consider Singapore-hosted alternative (Azure OpenAI Singapore)
- Document in PDPA compliance records

---

## D.2.3 Knowledge Base Security

| Requirement | Owner | Status | Notes |
|-------------|-------|--------|-------|
| Document approval workflow | ✅ Aleph | Done | Admin approve/reject UI |
| Access control for KB | 🏛️ HPB | Pending | Role-based access by HPB identity |
| Secure file storage | 🏛️ HPB | Pending | Enterprise storage solution |
| Encryption at rest | 🏛️ HPB | Pending | Infrastructure level |

### What Aleph Has Done:
- ✅ DRAFT → APPROVED workflow for all KB documents
- ✅ Admin approval required before documents are used
- ✅ Audit logging of approvals/rejections

### What HPB Must Do:
- Configure role-based access (who can upload, who can approve)
- Set up encrypted storage solution
- Implement backup and recovery procedures
- Regular access reviews

---

# D.3 - MODEL

## D.3.1 Accuracy & Grounding

| Requirement | Owner | Status | Notes |
|-------------|-------|--------|-------|
| RAG implementation for grounding | ✅ Aleph | Done | Personas, research docs grounded |
| Accuracy standards documentation | ✅ Aleph | Done | AI_PERFORMANCE_STANDARDS.md |
| Accuracy monitoring | 📋 Both | Partial | Feedback UI done, HPB monitors |
| Regular accuracy audits | 🏛️ HPB | Pending | HPB to conduct reviews |

### What Aleph Has Done:
- ✅ Retrieval-Augmented Generation (RAG) with Knowledge Base
- ✅ Grounding in uploaded persona documents
- ✅ Grounding document IDs logged per response
- ✅ Accuracy standards documented
- ✅ User feedback collection (thumbs up/down)

### What HPB Must Do:
- Conduct periodic accuracy audits (sample reviews)
- Monitor feedback metrics
- Act on accuracy issues identified

---

## D.3.2 Safety Guardrails

| Requirement | Owner | Status | Notes |
|-------------|-------|--------|-------|
| System prompt guardrails | ✅ Aleph | Done | Comprehensive safety prompts |
| Medical advice prevention | ✅ Aleph | Done | In system prompts |
| Harmful content prevention | ✅ Aleph | Done | In system prompts |
| Authority claim prevention | ✅ Aleph | Done | Training-only framing |
| Singapore context enforcement | ✅ Aleph | Done | In system prompts |
| Report issue functionality | ✅ Aleph | Done | Flagging UI implemented |
| Incident response process | 🏛️ HPB | Pending | HPB's SOC/response team |

### What Aleph Has Done:
- ✅ Comprehensive system prompt guardrails:
  - Training-only framing
  - Medical advice prohibition  
  - Authority claim prevention
  - Harmful content prevention
  - Singapore context enforcement
  - Neutral tone requirements
- ✅ User feedback mechanism (thumbs up/down)
- ✅ Report Issue functionality with categories
- ✅ All reports logged for admin review

### What HPB Must Do:
- Establish incident response process for reported issues
- Define escalation paths for harmful content
- Conduct regular review of flagged content
- Update guardrails based on incidents

---

## D.3.3 Adversarial Testing

| Requirement | Owner | Status | Notes |
|-------------|-------|--------|-------|
| Adversarial test documentation | ✅ Aleph | Done | ADVERSARIAL_TESTING.md |
| Initial test execution | ✅ Aleph | Done | Test cases documented |
| Ongoing adversarial testing | 🏛️ HPB | Pending | Regular re-testing schedule |
| Red team exercises | 🏛️ HPB | Pending | If resources permit |

### What Aleph Has Done:
- ✅ Comprehensive adversarial testing documentation
- ✅ 30+ test cases covering:
  - Prompt injection
  - Harmful content elicitation
  - Medical advice prevention
  - Bias detection
  - Information extraction

### What HPB Must Do:
- Schedule regular adversarial testing (recommend monthly)
- Re-test after any prompt/model changes
- Consider external red team if resources allow

---

## D.3.4 Performance Monitoring

| Requirement | Owner | Status | Notes |
|-------------|-------|--------|-------|
| Response logging | ✅ Aleph | Done | Prompt/response hashes logged |
| Latency tracking | ✅ Aleph | Done | In audit logs |
| Error rate monitoring | 📋 Both | Partial | Logged, HPB needs dashboard |
| Uptime monitoring | 🏛️ HPB | Pending | Infrastructure monitoring |

### What Aleph Has Done:
- ✅ All AI interactions logged with:
  - Timestamp
  - Model used
  - Prompt hash (SHA-256)
  - Response metadata
  - Latency
- ✅ Error logging for failed AI calls

### What HPB Must Do:
- Set up monitoring dashboards
- Configure alerts for error rate spikes
- Infrastructure uptime monitoring
- Regular performance reviews

---

# D.4 - ACCESS CONTROL

## D.4.1 Authentication

| Requirement | Owner | Status | Notes |
|-------------|-------|--------|-------|
| User authentication | 🏛️ HPB | Pending | HPB's SSO/identity provider |
| MFA implementation | 🏛️ HPB | Pending | Enterprise requirement |
| Password policies | 🏛️ HPB | Pending | If not using SSO |

### What HPB Must Do:
- Integrate with HPB's identity provider (Azure AD, Okta, etc.)
- Configure SSO for seamless login
- Implement MFA per government requirements
- Define session timeout policies

---

## D.4.2 Authorization (RBAC)

| Requirement | Owner | Status | Notes |
|-------------|-------|--------|-------|
| Role definitions | 📋 Both | Partial | Suggested roles, HPB finalizes |
| Role-based access control | 🔧 Aleph | Can add | Middleware for role checks |
| Admin vs User separation | 🔧 Aleph | Can add | UI already differentiates |
| Access audit logging | ✅ Aleph | Done | All actions logged |

### Suggested Roles (Aleph Recommendation):
```
┌─────────────────────────────────────────────────────────┐
│ ADMIN          - Full access, KB management, settings  │
│ RESEARCHER     - Create projects, run simulations      │
│ VIEWER         - View-only access to simulations       │
│ KB_APPROVER    - Approve/reject KB documents           │
└─────────────────────────────────────────────────────────┘
```

### What HPB Must Do:
- Finalize role definitions
- Map roles to HPB organizational structure
- Configure role assignments
- Regular access reviews

---

## D.4.3 Network Security

| Requirement | Owner | Status | Notes |
|-------------|-------|--------|-------|
| HTTPS enforcement | 🏛️ HPB | Pending | Production SSL |
| Network segmentation | 🏛️ HPB | Pending | Infrastructure |
| Firewall rules | 🏛️ HPB | Pending | Infrastructure |
| WAF (Web Application Firewall) | 🏛️ HPB | Pending | Edge security |
| API rate limiting | 🔧 Aleph | Can add | Basic rate limits |

### What Aleph Can Do:
- 🔧 Add basic API rate limiting
- Application already uses secure headers

### What HPB Must Do:
- Configure SSL/TLS certificates
- Set up WAF rules
- Configure network segmentation
- Implement IP whitelisting if needed
- DDoS protection

---

# D.5 - DEPLOYMENT

## D.5.1 Infrastructure Security

| Requirement | Owner | Status | Notes |
|-------------|-------|--------|-------|
| Secure hosting environment | 🏛️ HPB | Pending | GCC/private cloud |
| Container security | 🏛️ HPB | Pending | If containerized |
| Secrets management | 🏛️ HPB | Pending | Vault/secrets manager |
| Database security | 🏛️ HPB | Pending | Encryption, access control |

### What Aleph Provides:
- Docker/container-ready application
- Environment variable configuration for secrets
- Database migration scripts

### What HPB Must Do:
- Deploy to approved hosting environment (GCC+, private cloud)
- Configure secrets management (HashiCorp Vault, etc.)
- Set up encrypted database
- Configure backup and disaster recovery
- Regular security patching

---

## D.5.2 CI/CD Security

| Requirement | Owner | Status | Notes |
|-------------|-------|--------|-------|
| Secure build pipeline | 🏛️ HPB | Pending | HPB's CI/CD |
| Dependency scanning | 🔧 Aleph | Can add | npm audit, etc. |
| SAST (Static Analysis) | 🏛️ HPB | Pending | Enterprise tools |
| Container image scanning | 🏛️ HPB | Pending | Registry scanning |

### What Aleph Can Do:
- 🔧 Add dependency vulnerability scanning scripts
- 🔧 Provide security-focused code review

### What HPB Must Do:
- Integrate into secure CI/CD pipeline
- Configure automated security scanning
- Implement deployment approvals

---

# D.6 - OPERATIONS

## D.6.1 Monitoring & Alerting

| Requirement | Owner | Status | Notes |
|-------------|-------|--------|-------|
| Application logging | ✅ Aleph | Done | Comprehensive audit logs |
| Monitoring dashboards | 🏛️ HPB | Pending | Grafana/CloudWatch/etc. |
| Alert configuration | 🏛️ HPB | Pending | HPB's monitoring tools |
| Log aggregation | 🏛️ HPB | Pending | SIEM integration |

### What Aleph Has Done:
- ✅ Comprehensive audit logging to database
- ✅ Structured log format for easy parsing
- ✅ All AI interactions logged

### What HPB Must Do:
- Set up log aggregation (ELK, Splunk, etc.)
- Create monitoring dashboards
- Configure alerts for:
  - Error rate spikes
  - Unusual usage patterns
  - Security events
- Integrate with HPB's SIEM

---

## D.6.2 Incident Response

| Requirement | Owner | Status | Notes |
|-------------|-------|--------|-------|
| Incident reporting mechanism | ✅ Aleph | Done | Report Issue UI |
| Incident response plan | 🏛️ HPB | Pending | HPB's IR process |
| Escalation procedures | 🏛️ HPB | Pending | HPB organizational |
| Post-incident review | 🏛️ HPB | Pending | HPB process |

### What Aleph Has Done:
- ✅ User-facing "Report Issue" functionality
- ✅ Categorized issue reporting
- ✅ All reports logged for review

### What HPB Must Do:
- Define incident response procedures
- Establish escalation paths
- Configure 24/7 response for critical issues
- Document post-incident review process

---

## D.6.3 Change Management

| Requirement | Owner | Status | Notes |
|-------------|-------|--------|-------|
| Change documentation | ✅ Aleph | Done | Git history, docs |
| Change approval process | 🏛️ HPB | Pending | HPB's CAB |
| Rollback procedures | 📋 Both | Partial | Code supports, HPB executes |
| Testing before deployment | 📋 Both | Partial | We test, HPB validates |

### What Aleph Has Done:
- ✅ Version control with Git
- ✅ Documentation of all changes
- ✅ Database migrations for rollback

### What HPB Must Do:
- Integrate into change management process
- Define change approval board
- Schedule maintenance windows
- Test in staging environment before production

---

# SUMMARY: ACTION ITEMS

## Aleph - Before Handover (Can Complete)

| Priority | Item | Effort |
|----------|------|--------|
| ✅ Done | Terms of Use page | - |
| ✅ Done | Privacy Statement page | - |
| ✅ Done | Feedback mechanism (thumbs/report) | - |
| ✅ Done | Data classification confirmation | - |
| ✅ Done | Performance standards documentation | - |
| ✅ Done | Adversarial testing documentation | - |
| ✅ Done | Comprehensive audit logging | - |
| 🔧 Optional | Basic PII pattern detection | Medium |
| 🔧 Optional | API rate limiting | Low |
| 🔧 Optional | Role-based access middleware | Medium |
| 🔧 Optional | Session management | Medium |

## HPB - Post-Handover (Must Complete)

| Priority | Item | Category |
|----------|------|----------|
| 🔴 Critical | SSO/Authentication integration | Access Control |
| 🔴 Critical | Secure hosting (GCC+) | Deployment |
| 🔴 Critical | Database encryption | Data |
| 🔴 Critical | SSL/TLS configuration | Network |
| 🔴 Critical | Secrets management | Security |
| 🟡 High | Role-based access control | Access Control |
| 🟡 High | DLP integration | Data |
| 🟡 High | Monitoring dashboards | Operations |
| 🟡 High | Incident response process | Operations |
| 🟡 High | OpenAI data processing agreement | Legal |
| 🟠 Medium | Regular adversarial testing | Model |
| 🟠 Medium | User training program | Accountability |
| 🟠 Medium | AI governance committee | Accountability |
| 🟠 Medium | Log aggregation/SIEM | Operations |
| 🟢 Lower | Red team exercises | Security |
| 🟢 Lower | External security audit | Security |

---

## Handover Checklist

### Documentation We Provide:
- [ ] This Compliance Handover Guide
- [ ] AI Performance Standards (`docs/AI_PERFORMANCE_STANDARDS.md`)
- [ ] Adversarial Testing Results (`docs/ADVERSARIAL_TESTING.md`)
- [ ] System Architecture Documentation
- [ ] API Documentation
- [ ] Database Schema Documentation
- [ ] Environment Variables Template
- [ ] Deployment Instructions

### Technical Assets We Provide:
- [ ] Complete source code (Git repository)
- [ ] Database migration scripts
- [ ] Dockerfile (if requested)
- [ ] Sample data for testing

### Knowledge Transfer:
- [ ] Walkthrough of AI prompt engineering
- [ ] Explanation of guardrail implementation
- [ ] Demonstration of admin workflows
- [ ] Q&A session with HPB tech team

---

## Contact for Clarification

**Aleph Pte Ltd Development Team**
- Technical questions during handover period
- Clarification on implementation details
- Support for HPB's customizations

---

*This document should be reviewed and updated during the handover process to ensure all items are addressed.*
<!-- Created by Swapnil Bapat © 2026 -->
