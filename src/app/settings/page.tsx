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

export default function SettingsPage() {
    const seedDatabase = async () => {
        try {
            const res = await fetch("/api/seed");
            const data = await res.json();
            if (data.success) {
                alert(`Database seeded successfully! Created ${data.data.personaCount} personas.`);
            } else {
                alert(data.error || "Failed to seed database");
            }
        } catch (err) {
            alert("Failed to seed database");
            console.error(err);
        }
    };

    return (
        <div className="py-8">
            <div className="max-w-4xl space-y-6">

                {/* Header */}
                <div className="flex items-center gap-4 mb-2">
                    <div className="w-10 h-10 bg-foreground rounded-lg flex items-center justify-center">
                        <SettingsIcon className="h-5 w-5 text-background" />
                    </div>
                    <div>
                        <h1 className="text-3xl font-semibold tracking-tight">
                            Settings
                        </h1>
                        <p className="text-sm text-muted-foreground">
                            Configure your HPB MHE AI instance
                        </p>
                    </div>
                </div>

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
                            <Badge variant="secondary" className="text-primary border-primary/20" style={{ backgroundColor: 'var(--color-interact-muted)', color: 'var(--color-interact)' }}>
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
                                <p className="text-xs text-muted-foreground">For AI persona simulation and coaching (gpt-5.2)</p>
                            </div>
                            <Badge variant="secondary" className="bg-amber-50 text-amber-700 border-amber-200">
                                Using Mock
                            </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground">
                            To enable real OpenAI API, set <code className="text-foreground bg-muted px-1 rounded border border-border">OPENAI_API_KEY</code> in your <code className="text-foreground bg-muted px-1 rounded border border-border">.env.local</code> file.
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
                                <p className="text-muted-foreground text-xs uppercase tracking-wide">Environment</p>
                                <p className="text-foreground font-medium">Development</p>
                            </div>
                            <div>
                                <p className="text-muted-foreground text-xs uppercase tracking-wide">Framework</p>
                                <p className="text-foreground font-medium">Next.js 16 (App Router)</p>
                            </div>
                            <div>
                                <p className="text-muted-foreground text-xs uppercase tracking-wide">UI</p>
                                <p className="text-foreground font-medium">Shadcn + Tailwind</p>
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
        </div>
    );
}
// Created by Swapnil Bapat © 2026
