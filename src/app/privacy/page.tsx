import { BackLink } from "@/components/layout/back-link"
import { PageContainer } from "@/components/layout/page-container"
import { PageHeader } from "@/components/layout/page-header"

export default function PrivacyPage() {
  return (
    <PageContainer innerClassName="max-w-[720px] pt-6 pb-20">
      <BackLink href="/dashboard" label="Back to Dashboard" />

      <PageHeader
        eyebrow="Legal"
        title="Privacy Statement"
        description="Last updated: April 2026"
      />

      <article className="flex flex-col gap-8 text-body text-foreground">
        <section className="flex flex-col gap-3">
          <h2 className="text-display-3">Introduction</h2>
          <p className="text-body-lg text-muted-foreground">
            This Privacy Statement describes how HPB AI Research Tool (&quot;the Application&quot;) collects, uses, and
            protects information processed through the Application. This Application is operated by the
            Health Promotion Board (HPB) Singapore for internal training purposes.
          </p>
        </section>

        <section className="flex flex-col gap-3">
          <h2 className="text-display-3">Information We Collect</h2>
          <p className="text-body">
            The Application processes the following types of information:
          </p>
          <div className="flex flex-col gap-4">
            <div>
              <h3 className="text-display-3 text-base mb-2">User-Provided Content</h3>
              <ul className="list-disc list-inside text-body space-y-2">
                <li>Research project details and moderator guides</li>
                <li>Persona documents uploaded to the Knowledge Base</li>
                <li>Chat messages during interview simulations</li>
                <li>Feedback ratings and issue reports</li>
              </ul>
            </div>
            <div>
              <h3 className="text-display-3 text-base mb-2">Automatically Collected Data</h3>
              <ul className="list-disc list-inside text-body space-y-2">
                <li>Audit logs of user actions (create, update, delete operations)</li>
                <li>AI generation metadata (model used, latency, prompt/response hashes)</li>
                <li>Session timestamps and duration</li>
              </ul>
            </div>
          </div>
        </section>

        <section className="flex flex-col gap-3">
          <h2 className="text-display-3">How We Use Information</h2>
          <p className="text-body">
            Information processed through the Application is used for:
          </p>
          <ul className="list-disc list-inside text-body space-y-2">
            <li>Training Delivery: Providing AI-powered interview simulations and coaching feedback</li>
            <li>Quality Improvement: Analyzing feedback to improve AI safety and accuracy</li>
            <li>Compliance & Audit: Maintaining logs for security monitoring and compliance verification</li>
            <li>Research Context: Grounding AI responses in uploaded project materials</li>
          </ul>
        </section>

        <section className="flex flex-col gap-3">
          <h2 className="text-display-3">Data Storage and Security</h2>
          <p className="text-body">
            We implement appropriate security measures to protect your information:
          </p>
          <ul className="list-disc list-inside text-body space-y-2">
            <li>Data is stored in a local SQLite database on HPB-controlled infrastructure</li>
            <li>AI processing is performed via secure API connections to OpenAI Enterprise</li>
            <li>All AI prompts and responses are hashed for audit purposes (content is not externally stored)</li>
            <li>Access is restricted to authorized HPB personnel only</li>
            <li>Regular security reviews are conducted in accordance with IM8 requirements</li>
          </ul>
        </section>

        <section className="flex flex-col gap-3">
          <h2 className="text-display-3">Third-Party Services</h2>
          <p className="text-body">
            The Application integrates with the following third-party AI service:
          </p>
          <ul className="list-disc list-inside text-body space-y-2">
            <li>OpenAI Enterprise: Powers the AI simulation and coaching features. Prompts and responses are processed according to OpenAI&apos;s Enterprise data handling policies, which prohibit training on customer data.</li>
          </ul>
          <p className="text-body">
            Users should not input data classified above the permitted security level when using AI features.
          </p>
        </section>

        <section className="flex flex-col gap-3">
          <h2 className="text-display-3">Data Retention</h2>
          <p className="text-body">
            Data is retained in accordance with HPB&apos;s records management policies:
          </p>
          <ul className="list-disc list-inside text-body space-y-2">
            <li>Training simulation data is retained for the duration of the project plus a reasonable review period</li>
            <li>Audit logs are retained according to security and compliance requirements</li>
            <li>Users may request deletion of their project data by contacting their supervisor</li>
          </ul>
        </section>

        <section className="flex flex-col gap-3">
          <h2 className="text-display-3">User Rights</h2>
          <p className="text-body">
            As a user of this Application, you have the following rights regarding your data:
          </p>
          <ul className="list-disc list-inside text-body space-y-2">
            <li>Access: Request information about data associated with your projects</li>
            <li>Correction: Request corrections to inaccurate project data</li>
            <li>Deletion: Request deletion of project data when no longer needed</li>
            <li>Complaint: Raise concerns about data handling through appropriate channels</li>
          </ul>
        </section>

        <section className="flex flex-col gap-3">
          <h2 className="text-display-3">AI-Specific Privacy Considerations</h2>
          <p className="text-body">
            When using AI features, please be aware:
          </p>
          <ul className="list-disc list-inside text-body space-y-2">
            <li>AI-generated personas are fictional and do not represent real individuals</li>
            <li>Do not input actual participant data or PII into the simulation</li>
            <li>AI responses are not recorded by the third-party provider for training purposes</li>
            <li>Prompt content is logged locally for audit and quality improvement only</li>
          </ul>
        </section>

        <section className="flex flex-col gap-3">
          <h2 className="text-display-3">Cookies and Local Storage</h2>
          <p className="text-body">
            This Application may use browser cookies and local storage for:
          </p>
          <ul className="list-disc list-inside text-body space-y-2">
            <li>Session management and authentication (when implemented)</li>
            <li>Storing user preferences and UI state</li>
            <li>Performance optimization</li>
          </ul>
        </section>

        <section className="flex flex-col gap-3">
          <h2 className="text-display-3">Changes to This Statement</h2>
          <p className="text-body">
            HPB may update this Privacy Statement from time to time to reflect changes in our practices
            or for legal, operational, or regulatory reasons. The &ldquo;Last updated&rdquo; date at the top of this
            page indicates when this Statement was last revised.
          </p>
        </section>

        <section className="flex flex-col gap-3">
          <h2 className="text-display-3">Contact Us</h2>
          <p className="text-body">
            If you have questions about this Privacy Statement or our data practices, please contact:
          </p>
          <ul className="list-disc list-inside text-body space-y-2">
            <li>Your immediate supervisor</li>
            <li>HPB Data Protection Officer</li>
            <li>HPB Digital Transformation Team</li>
          </ul>
          <p className="text-body text-muted-foreground italic text-sm mt-4">
            This Privacy Statement should be read in conjunction with HPB&apos;s overall privacy policies
            and the Application&apos;s Terms of Use.
          </p>
        </section>
      </article>
    </PageContainer>
  )
}
