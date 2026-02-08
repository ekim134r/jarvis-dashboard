import { NextResponse } from "next/server";
import { readDb } from "@/lib/db";
import type { Project } from "@/lib/types";

export async function GET() {
  const db = await readDb();
  const projects = (db.projects ?? []) as Project[];
  return NextResponse.json(projects);
}
