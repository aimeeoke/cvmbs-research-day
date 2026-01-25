import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default async function Home() {
  // Test the Supabase connection
  let connectionStatus: "success" | "error" = "error";
  let errorMessage = "";
  let eventCount = 0;

  try {
    const supabase = await createClient();

    // Try to query the events table
    const { data, error } = await supabase
      .from("events")
      .select("*");

    if (error) {
      errorMessage = error.message;
    } else {
      connectionStatus = "success";
      eventCount = data?.length || 0;
    }
  } catch (err) {
    errorMessage = err instanceof Error ? err.message : "Unknown error";
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-green-50 to-white p-8">
      <div className="max-w-2xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-4xl font-bold text-green-800">
            CVMBS Research Day
          </h1>
          <p className="text-gray-600">
            Conference Management Platform
          </p>
        </div>

        {/* Connection Status Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-3">
              Supabase Connection
              {connectionStatus === "success" ? (
                <Badge className="bg-green-600">Connected</Badge>
              ) : (
                <Badge variant="destructive">Error</Badge>
              )}
            </CardTitle>
            <CardDescription>
              Testing database connectivity
            </CardDescription>
          </CardHeader>
          <CardContent>
            {connectionStatus === "success" ? (
              <div className="space-y-2 text-sm">
                <p className="text-green-700">
                  Successfully connected to Supabase!
                </p>
                <p className="text-gray-600">
                  Events in database: <strong>{eventCount}</strong>
                </p>
                <p className="text-gray-500 text-xs mt-4">
                  Your database is ready. No events exist yet - we&apos;ll create one when you set up the 2026 event.
                </p>
              </div>
            ) : (
              <div className="space-y-2 text-sm">
                <p className="text-red-700">
                  Could not connect to Supabase
                </p>
                <p className="text-gray-600 font-mono text-xs bg-gray-100 p-2 rounded">
                  {errorMessage}
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Next Steps Card */}
        <Card>
          <CardHeader>
            <CardTitle>V2 Platform Status</CardTitle>
            <CardDescription>
              What&apos;s ready and what&apos;s coming
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 text-sm">
              <div className="flex items-center gap-2">
                <span className="text-green-600">✓</span>
                <span>Next.js 14 + TypeScript + Tailwind</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-green-600">✓</span>
                <span>Supabase database connection</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-green-600">✓</span>
                <span>Database schema (8 tables + RLS)</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-green-600">✓</span>
                <span>shadcn/ui components</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-yellow-600">○</span>
                <span className="text-gray-500">Authentication (magic links)</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-yellow-600">○</span>
                <span className="text-gray-500">Submission system</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-yellow-600">○</span>
                <span className="text-gray-500">Judge registration</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-yellow-600">○</span>
                <span className="text-gray-500">Scoring system</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
