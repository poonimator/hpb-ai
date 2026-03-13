# HPB Dojo & Prism - AI Performance Standards

**Document Classification:** INTERNAL  
**Version:** 1.0  
**Last Updated:** January 2026  

---

## 1. Executive Summary

This document defines the performance standards for AI-generated content within the HPB Dojo & Prism application. These standards ensure that all AI outputs meet acceptable levels of accuracy, safety, and quality for their intended training purposes.

---

## 2. Purpose and Scope

### 2.1 Purpose
To establish measurable criteria for evaluating AI-generated content across all features of the application, including:
- Persona simulation responses
- Live coaching nudges
- Session review feedback
- Question validation

### 2.2 Scope
These standards apply to all AI-generated content produced by the application's integration with OpenAI GPT models.

---

## 3. D.3.1 Accuracy Standards

### 3.1 Definition
Accuracy refers to the degree to which AI-generated content is factually correct, relevant to the context, and grounded in provided source materials.

### 3.2 Standards

| Metric | Target | Measurement Method |
|--------|--------|-------------------|
| Grounding Rate | ≥80% of persona responses should reflect provided persona documents | Spot-check reviews by researchers |
| Context Relevance | ≥90% of responses should be relevant to the interview question | User feedback (thumbs up/down ratio) |
| Hallucination Rate | <10% of responses should contain unverified claims | Spot-check reviews |
| Singapore Cultural Accuracy | ≥95% of responses should reflect Singapore context | Quarterly review by subject matter experts |

### 3.3 Grounding Implementation
The application implements Retrieval-Augmented Generation (RAG) to ensure responses are grounded in:
- Uploaded persona documents
- Project-specific research materials
- Global Knowledge Base content (frameworks, policies)

### 3.4 Verification Procedures
1. **Automated Hash Logging**: All prompts and responses are hashed and logged for audit trails
2. **Source Document Tracking**: Grounding documents used for each response are logged
3. **User Feedback**: Thumbs up/down ratings tracked per response
4. **Monthly Accuracy Reviews**: Sample of 50 responses reviewed for accuracy

---

## 4. D.3.2 Safety Standards

### 4.1 Definition
Safety refers to the prevention of harmful, inappropriate, biased, or unauthorized content in AI outputs.

### 4.2 Standards

| Metric | Target | Measurement Method |
|--------|--------|-------------------|
| Harmful Content Rate | 0% (zero tolerance) | Automated + manual review of flagged content |
| Medical Advice Prevention | 100% compliance | System prompt enforcement + feedback reports |
| Bias Detection | <5% of responses flagged for bias | User reports + quarterly bias audit |
| Authority Claim Prevention | 100% compliance | System prompt enforcement |

### 4.3 Safety Implementation

#### 4.3.1 System Guardrails
All AI requests include mandatory system guardrails:
- Training-only output framing
- Medical advice prohibition
- Authority claim prohibition
- Singapore context enforcement
- Neutral tone requirements
- Harmful content prevention

#### 4.3.2 Content Categories Prohibited
1. Medical diagnoses or treatment recommendations
2. Mental health crisis intervention (beyond referral)
3. Legal or financial advice
4. Discriminatory or biased statements
5. Personal data elicitation beyond persona scope
6. Political or religious controversy
7. Violent or explicit content

### 4.4 Incident Response
1. **Immediate**: Flag reported content for review
2. **24 hours**: Investigate root cause
3. **48 hours**: Implement mitigation if pattern detected
4. **Weekly**: Review all flagged content in safety meeting

---

## 5. D.3.3 Output Quality Standards

### 5.1 Definition
Quality refers to the usefulness, clarity, and pedagogical value of AI-generated content for training purposes.

### 5.2 Standards

| Metric | Target | Measurement Method |
|--------|--------|-------------------|
| Coaching Actionability | ≥85% of coaching feedback should be actionable | User satisfaction surveys |
| Response Naturalness | ≥80% of persona responses rated as realistic | Post-simulation feedback |
| Question Validation Accuracy | ≥90% of flagged issues confirmed valid | Researcher review |
| Feedback Helpfulness | ≥75% positive feedback ratio | Thumbs up/down metrics |

### 5.3 Quality Dimensions

#### 5.3.1 Persona Simulation Quality
- **Consistency**: Responses should maintain persona characteristics throughout session
- **Authenticity**: Language style should match persona demographics
- **Depth**: Responses should provide substantive content for probing
- **Variability**: Mixer settings should produce observable differences

#### 5.3.2 Coaching Feedback Quality
- **Specificity**: Feedback should reference specific moments in conversation
- **Constructiveness**: Suggestions should be improvement-oriented
- **Balance**: Both strengths and areas for improvement should be noted
- **Actionability**: Recommendations should be implementable

### 5.4 Quality Improvement Process
1. **Monthly Review**: Analyze feedback metrics and identify patterns
2. **Prompt Optimization**: Refine prompts based on quality gaps
3. **User Survey**: Quarterly satisfaction assessment
4. **Benchmark Testing**: Annual comparison against quality baselines

---

## 6. Model Performance Monitoring

### 6.1 Technical Metrics

| Metric | Target | Alert Threshold |
|--------|--------|----------------|
| Response Latency | <5 seconds median | >10 seconds |
| Error Rate | <2% of requests | >5% of requests |
| Token Efficiency | <4000 tokens per response | >6000 tokens |
| Uptime | ≥99.5% availability | <98% availability |

### 6.2 Logging and Auditing
All AI interactions are logged with:
- Request timestamp
- Model used
- Prompt hash (SHA-256)
- Response hash (SHA-256)
- Latency (ms)
- Grounding document IDs
- User feedback (when provided)

---

## 7. Feedback Collection and Analysis

### 7.1 Feedback Mechanisms
1. **Thumbs Up/Down**: Quick satisfaction indicator per response
2. **Report Issue**: Detailed problem reporting with categorization:
   - Inaccurate
   - Harmful
   - Biased
   - Inappropriate
   - Other

### 7.2 Feedback Categories Tracked
- Positive feedback rate by feature
- Issue reports by category
- Time-to-resolution for reported issues
- Recurring issue patterns

### 7.3 Reporting
- **Daily**: Automated dashboard refresh
- **Weekly**: Summary report to product team
- **Monthly**: Trend analysis and action items
- **Quarterly**: Executive summary with recommendations

---

## 8. Continuous Improvement

### 8.1 Review Cadence
- **Weekly**: Review flagged content and feedback
- **Monthly**: Analyze metrics and identify improvement areas
- **Quarterly**: Update prompts and guardrails based on learnings
- **Annually**: Full system audit and standard review

### 8.2 Change Management
All prompt or guardrail changes must:
1. Be documented with rationale
2. Pass adversarial testing
3. Be approved by product owner
4. Be logged in change history

---

## 9. Compliance Verification

### 9.1 Self-Assessment
- Monthly checklist completion by product team
- Quarterly metrics review against targets
- Annual third-party audit recommendation

### 9.2 Audit Trail
All compliance-relevant activities are logged in the AuditLog table:
- AI generation events
- User feedback submissions
- Document approvals
- System configuration changes

---

## 10. Appendices

### A. Related Documents
- [Adversarial Testing Documentation](./ADVERSARIAL_TESTING.md)
- [System Guardrails](../src/lib/ai/prompts/system_guardrails.md)
- [Terms of Use](../src/app/terms/page.tsx)
- [Privacy Statement](../src/app/privacy/page.tsx)

### B. Change History
| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | Jan 2026 | HPB DX Team | Initial version |

---

*This document is subject to periodic review and updates to reflect evolving best practices and regulatory requirements.*
<!-- Created by Swapnil Bapat © 2026 -->
