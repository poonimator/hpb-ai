"use client";

import Link from "next/link";
import { Shield, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function PrivacyPolicyPage() {
    return (
        <div className="min-h-screen pb-16">
            {/* Hero Header */}
            <div className="relative flex flex-col items-center justify-center mb-12 pt-8 text-center max-w-4xl mx-auto w-full px-4 md:px-6">
                <div className="flex flex-col items-center">
                    <div className="h-16 w-16 bg-primary rounded-md flex items-center justify-center mb-4">
                        <Shield className="h-8 w-8 text-primary-foreground" />
                    </div>
                    <h1 className="text-3xl font-bold text-foreground">
                        Privacy Statement
                    </h1>
                    <p className="text-muted-foreground mt-2">
                        Last updated: January 2026
                    </p>
                </div>
            </div>

            {/* Content */}
            <div className="max-w-4xl mx-auto px-4 md:px-6">
                <div className="bg-card border border-border rounded-md p-8 md:p-12">

                    <div className="prose max-w-none">
                        <h2 className="text-xl font-bold text-foreground mb-4">1. Introduction</h2>
                        <p className="text-muted-foreground mb-6">
                            This Privacy Statement describes how HPB AI Research Tool ("the Application") collects, uses, and
                            protects information processed through the Application. This Application is operated by the
                            Health Promotion Board (HPB) Singapore for internal training purposes.
                        </p>

                        <h2 className="text-xl font-bold text-foreground mb-4">2. Information We Collect</h2>
                        <p className="text-muted-foreground mb-4">
                            The Application processes the following types of information:
                        </p>

                        <h3 className="text-lg font-semibold text-foreground mb-2">2.1 User-Provided Content</h3>
                        <ul className="list-disc list-inside text-muted-foreground mb-4 space-y-2">
                            <li>Research project details and moderator guides</li>
                            <li>Persona documents uploaded to the Knowledge Base</li>
                            <li>Chat messages during interview simulations</li>
                            <li>Feedback ratings and issue reports</li>
                        </ul>

                        <h3 className="text-lg font-semibold text-foreground mb-2">2.2 Automatically Collected Data</h3>
                        <ul className="list-disc list-inside text-muted-foreground mb-6 space-y-2">
                            <li>Audit logs of user actions (create, update, delete operations)</li>
                            <li>AI generation metadata (model used, latency, prompt/response hashes)</li>
                            <li>Session timestamps and duration</li>
                        </ul>

                        <h2 className="text-xl font-bold text-foreground mb-4">3. How We Use Information</h2>
                        <p className="text-muted-foreground mb-4">
                            Information processed through the Application is used for:
                        </p>
                        <ul className="list-disc list-inside text-muted-foreground mb-6 space-y-2">
                            <li><strong>Training Delivery:</strong> Providing AI-powered interview simulations and coaching feedback</li>
                            <li><strong>Quality Improvement:</strong> Analyzing feedback to improve AI safety and accuracy</li>
                            <li><strong>Compliance & Audit:</strong> Maintaining logs for security monitoring and compliance verification</li>
                            <li><strong>Research Context:</strong> Grounding AI responses in uploaded project materials</li>
                        </ul>

                        <h2 className="text-xl font-bold text-foreground mb-4">4. Data Storage and Security</h2>
                        <p className="text-muted-foreground mb-4">
                            We implement appropriate security measures to protect your information:
                        </p>
                        <ul className="list-disc list-inside text-muted-foreground mb-6 space-y-2">
                            <li>Data is stored in a local SQLite database on HPB-controlled infrastructure</li>
                            <li>AI processing is performed via secure API connections to OpenAI Enterprise</li>
                            <li>All AI prompts and responses are hashed for audit purposes (content is not externally stored)</li>
                            <li>Access is restricted to authorized HPB personnel only</li>
                            <li>Regular security reviews are conducted in accordance with IM8 requirements</li>
                        </ul>

                        <h2 className="text-xl font-bold text-foreground mb-4">5. Third-Party Services</h2>
                        <p className="text-muted-foreground mb-4">
                            The Application integrates with the following third-party AI service:
                        </p>
                        <ul className="list-disc list-inside text-muted-foreground mb-6 space-y-2">
                            <li><strong>OpenAI Enterprise:</strong> Powers the AI simulation and coaching features. Prompts and responses
                                are processed according to OpenAI's Enterprise data handling policies, which prohibit training on customer data.</li>
                        </ul>
                        <p className="text-muted-foreground mb-6">
                            Users should not input data classified above the permitted security level when using AI features.
                        </p>

                        <h2 className="text-xl font-bold text-foreground mb-4">6. Data Retention</h2>
                        <p className="text-muted-foreground mb-6">
                            Data is retained in accordance with HPB's records management policies:
                        </p>
                        <ul className="list-disc list-inside text-muted-foreground mb-6 space-y-2">
                            <li>Training simulation data is retained for the duration of the project plus a reasonable review period</li>
                            <li>Audit logs are retained according to security and compliance requirements</li>
                            <li>Users may request deletion of their project data by contacting their supervisor</li>
                        </ul>

                        <h2 className="text-xl font-bold text-foreground mb-4">7. User Rights</h2>
                        <p className="text-muted-foreground mb-4">
                            As a user of this Application, you have the following rights regarding your data:
                        </p>
                        <ul className="list-disc list-inside text-muted-foreground mb-6 space-y-2">
                            <li><strong>Access:</strong> Request information about data associated with your projects</li>
                            <li><strong>Correction:</strong> Request corrections to inaccurate project data</li>
                            <li><strong>Deletion:</strong> Request deletion of project data when no longer needed</li>
                            <li><strong>Complaint:</strong> Raise concerns about data handling through appropriate channels</li>
                        </ul>

                        <h2 className="text-xl font-bold text-foreground mb-4">8. AI-Specific Privacy Considerations</h2>
                        <p className="text-muted-foreground mb-4">
                            When using AI features, please be aware:
                        </p>
                        <ul className="list-disc list-inside text-muted-foreground mb-6 space-y-2">
                            <li>AI-generated personas are fictional and do not represent real individuals</li>
                            <li>Do not input actual participant data or PII into the simulation</li>
                            <li>AI responses are not recorded by the third-party provider for training purposes</li>
                            <li>Prompt content is logged locally for audit and quality improvement only</li>
                        </ul>

                        <h2 className="text-xl font-bold text-foreground mb-4">9. Cookies and Local Storage</h2>
                        <p className="text-muted-foreground mb-6">
                            This Application may use browser cookies and local storage for:
                        </p>
                        <ul className="list-disc list-inside text-muted-foreground mb-6 space-y-2">
                            <li>Session management and authentication (when implemented)</li>
                            <li>Storing user preferences and UI state</li>
                            <li>Performance optimization</li>
                        </ul>

                        <h2 className="text-xl font-bold text-foreground mb-4">10. Changes to This Statement</h2>
                        <p className="text-muted-foreground mb-6">
                            HPB may update this Privacy Statement from time to time to reflect changes in our practices
                            or for legal, operational, or regulatory reasons. The "Last updated" date at the top of this
                            page indicates when this Statement was last revised.
                        </p>

                        <h2 className="text-xl font-bold text-foreground mb-4">11. Contact Us</h2>
                        <p className="text-muted-foreground mb-6">
                            If you have questions about this Privacy Statement or our data practices, please contact:
                        </p>
                        <ul className="list-disc list-inside text-muted-foreground mb-6 space-y-2">
                            <li>Your immediate supervisor</li>
                            <li>HPB Data Protection Officer</li>
                            <li>HPB Digital Transformation Team</li>
                        </ul>

                        <div className="mt-8 pt-6 border-t border-border">
                            <p className="text-sm text-muted-foreground italic">
                                This Privacy Statement should be read in conjunction with HPB's overall privacy policies
                                and the Application's Terms of Use.
                            </p>
                        </div>
                    </div>

                    <div className="mt-8 flex justify-center">
                        <Link href="/dashboard">
                            <Button className="rounded-md">
                                <ArrowLeft className="h-4 w-4 mr-2" />
                                Back to Dashboard
                            </Button>
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}
// Created by Swapnil Bapat © 2026
