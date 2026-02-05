import { NextResponse } from "next/server";
import { readDb } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const db = await readDb();
    
    // Calculate high-level metrics for the bot
    const openTasks = db.tasks.filter(t => {
      const col = db.columns.find(c => c.id === t.columnId);
      return col && col.key !== "done";
    });
    
    const highPriorityCount = openTasks.filter(t => t.priority === "P0").length;
    
    // Construct a "Context Window" friendly response
    const state = {
      system: {
        timestamp: new Date().toISOString(),
        version: "1.0.0",
        mode: "production"
      },
      metrics: {
        total_open_tasks: openTasks.length,
        high_priority_load: highPriorityCount,
        weekly_capacity_usage: 0.65, // This would be calculated dynamically in a real scenario
      },
      focus_queue: openTasks
        .filter(t => t.priority === "P0" || t.priority === "P1")
        .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
        .slice(0, 5)
        .map(t => ({ id: t.id, title: t.title, priority: t.priority })),
      active_experiments: db.experiments
        .filter(e => e.status === "Running")
        .map(e => ({ id: e.id, title: e.title, metric: e.metric })),
      recent_signals: [
        { type: "system", message: "Agent interface accessed" }
      ],
      pending_preferences: db.preferences
        .filter(p => p.decision === "unset")
        .map(p => ({ id: p.id, prompt: p.prompt }))
    };

    return NextResponse.json(state);
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch agent state" },
      { status: 500 }
    );
  }
}