import { NextResponse } from "next/server";
import { createExperiment, readDb, writeDb } from "@/lib/db";
import type { Experiment } from "@/lib/types";

export const runtime = "nodejs";

export async function GET() {
  const db = await readDb();
  return NextResponse.json(db.experiments);
}

export async function POST(request: Request) {
  const payload = (await request.json()) as Partial<Experiment>;

  if (!payload.title) {
    return NextResponse.json(
      { error: "title is required" },
      { status: 400 }
    );
  }

  const db = await readDb();
  const experiment = createExperiment({
    title: payload.title,
    hypothesis: payload.hypothesis,
    metric: payload.metric,
    status: payload.status,
    result: payload.result,
    startDate: payload.startDate,
    endDate: payload.endDate,
    owner: payload.owner,
    notes: payload.notes,
    tags: payload.tags
  });

  db.experiments.push(experiment);
  await writeDb(db);

  return NextResponse.json(experiment, { status: 201 });
}
