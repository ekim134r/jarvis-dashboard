import { NextResponse } from "next/server";
import { readDb, writeDb, createTask, createExperiment, createPreference } from "@/lib/db";
import type { Task, Experiment, Preference } from "@/lib/types";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { action, payload } = body;
    const db = await readDb();

    let result = null;
    let message = "";

    switch (action) {
      case "create_task":
        if (!payload.title) throw new Error("Title required");
        // Default to first column if not specified
        const defaultCol = db.columns.find(c => c.order === 0) || db.columns[0];
        const newTask = createTask({
          title: payload.title,
          columnId: payload.columnId || defaultCol.id,
          priority: payload.priority,
          tags: payload.tags,
          description: payload.description,
          swarmRequired: payload.swarmRequired,
          processingMode: payload.processingMode,
          definitionOfDone: payload.definitionOfDone,
          checklist: payload.checklist
        });
        db.tasks.push(newTask);
        result = newTask;
        message = `Task "${newTask.title}" created.`;
        break;

      case "log_experiment":
        if (!payload.title) throw new Error("Title required");
        const newExp = createExperiment({
          title: payload.title,
          hypothesis: payload.hypothesis,
          metric: payload.metric,
          tags: payload.tags,
          notes: payload.notes
        });
        db.experiments.push(newExp);
        result = newExp;
        message = `Experiment "${newExp.title}" logged.`;
        break;

      case "add_preference_card":
        if (!payload.prompt) throw new Error("Prompt required");
        const newPref = createPreference({
          prompt: payload.prompt,
          leftLabel: payload.leftLabel,
          rightLabel: payload.rightLabel,
          tags: payload.tags,
          notes: payload.notes
        });
        db.preferences.push(newPref);
        result = newPref;
        message = `Preference card "${newPref.prompt}" added to deck.`;
        break;
      
      case "list_tasks":
         // Simple filter capability
         result = db.tasks.filter(t => {
            if (payload.priority && t.priority !== payload.priority) return false;
            return true;
         });
         message = `Found ${result.length} tasks.`;
         break;

      default:
        return NextResponse.json(
          { error: `Unknown action: ${action}` },
          { status: 400 }
        );
    }

    await writeDb(db);

    return NextResponse.json({
      success: true,
      message,
      data: result
    });

  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Command execution failed" },
      { status: 500 }
    );
  }
}
