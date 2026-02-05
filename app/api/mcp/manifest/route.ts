import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function GET() {
  return NextResponse.json({
    name: "jarvis-mcp",
    version: "0.1.0",
    description: "Single source of truth for tasks, files, and logs.",
    resources: [
      {
        id: "tasks",
        endpoint: "/api/mcp/tasks",
        description: "Tasks, columns, and tags."
      },
      {
        id: "files",
        endpoint: "/api/mcp/files",
        description: "Stable context files surfaced to the agent layer."
      },
      {
        id: "logs",
        endpoint: "/api/mcp/logs",
        description: "Usage events, alerts, and webhook activity."
      }
    ]
  });
}
