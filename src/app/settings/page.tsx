"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
    Settings as SettingsIcon,
    Database,
    Key,
    Sparkles
} from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { PageContainer } from "@/components/layout/page-container";
import { toast } from "sonner";

export default function SettingsPage() {
    const seedDatabase = async () => {
        try {
            const res = await fetch("/api/seed");
            const data = await res.json();
            if (data.success) {
                toast.success(`Database seeded successfully! Created ${data.data.personaCount} personas.`);
            } else {
                toast.error(data.error || "Failed to seed database");
            }
        } catch (err) {
            toast.error("Failed to seed database");
            console.error(err);
        }
    };

    return (
        <PageContainer innerClassName="max-w-4xl pt-6 pb-20">
            <PageHeader
                eyebrow="Admin"
                title="Settings"
                description="Configure your HPB MHE AI instance"
            />

            <div className="space-y-6">
                {/* Database Settings */}
                <Card>
                    <CardHeader>
                        <div className="flex items-center gap-2">
                            <Database className="h-5 w-5 text-muted-foreground" />
                            <CardTitle>Database</CardTitle>
                        </div>
                        <CardDescription>
                            Manage your local SQLite database
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4 pb-5">
                        <div className="flex items-center justify-between p-3 bg-muted rounded-md border border-border">
                            <div>
                                <p className="text-sm text-foreground">Database Location</p>
                                <p className="text-xs text-muted-foreground font-mono">./data/app.db</p>
                            </div>
                            <Badge variant="secondary" className="bg-[color:var(--color-interact-muted)] text-[color:var(--color-interact)] border-primary/20">
                                Connected
                            </Badge>
                        </div>

                        <Separator />

                        <div>
                            <h4 className="text-sm font-medium mb-2">Seed Database</h4>
                            <p className="text-xs text-muted-foreground mb-3">
                                Populate the database with sample personas for testing. This is safe to run multiple times.
                            </p>
                            <Button
                                onClick={seedDatabase}
                                variant="outline"
                            >
                                <Sparkles className="h-4 w-4 mr-2" />
                                Seed Sample Personas
                            </Button>
                        </div>
                    </CardContent>
                </Card>

                {/* API Settings */}
                <Card>
                    <CardHeader>
                        <div className="flex items-center gap-2">
                            <Key className="h-5 w-5 text-muted-foreground" />
                            <CardTitle>API Configuration</CardTitle>
                        </div>
                        <CardDescription>
                            External service integrations
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4 pb-5">
                        <div className="flex items-center justify-between p-3 bg-muted rounded-md border border-border">
                            <div>
                                <p className="text-sm text-foreground">OpenAI API</p>
                                <p className="text-xs text-muted-foreground">For AI persona simulation and coaching</p>
                            </div>
                        </div>
                        <p className="text-xs text-muted-foreground">
                            To enable OpenAI API, set <code className="text-foreground bg-muted px-1 rounded border border-border">OPENAI_API_KEY</code> in your <code className="text-foreground bg-muted px-1 rounded border border-border">.env.local</code> file.
                        </p>
                    </CardContent>
                </Card>

                {/* About */}
                <Card>
                    <CardHeader>
                        <div className="flex items-center gap-2">
                            <SettingsIcon className="h-5 w-5 text-muted-foreground" />
                            <CardTitle>About</CardTitle>
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-4 pb-5">
                        <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                                <p className="text-muted-foreground text-xs uppercase tracking-wide">Version</p>
                                <p className="text-foreground font-medium">1.0.0</p>
                            </div>
                            <div>
                                <p className="text-muted-foreground text-xs uppercase tracking-wide">Framework</p>
                                <p className="text-foreground font-medium">Next.js 16 (App Router)</p>
                            </div>
                        </div>

                        <Separator />

                        <div className="p-4 bg-amber-50 border border-amber-200 rounded-md">
                            <p className="text-amber-900 text-sm font-medium mb-1">
                                Internal Tool — HPB Use Only
                            </p>
                            <p className="text-amber-700 text-xs">
                                Rehearsal output is training only and cannot inform synthesis. All sessions are logged for audit purposes.
                            </p>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </PageContainer>
    );
}
// Created by Swapnil Bapat © 2026
