import { NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { readDb, writeDb } from "@/lib/db";
import type { ResearchCard } from "@/lib/types";

export const runtime = "nodejs";

type Payload = Partial<ResearchCard>;

const DEFAULT_OUTPUT_SCHEMA = JSON.stringify(
  {
    type: "object",
    additionalProperties: false,
    properties: {
      executive_summary: {
        type: "array",
        items: { type: "string" },
        minItems: 3,
        maxItems: 7
      },
      key_findings: {
        type: "array",
        items: {
          type: "object",
          additionalProperties: false,
          properties: {
            claim: { type: "string" },
            confidence: { type: "number", minimum: 0, maximum: 1 },
            evidence: { type: "array", items: { type: "string" } }
          },
          required: ["claim", "confidence", "evidence"]
        }
      },
      sources: {
        type: "array",
        items: {
          type: "object",
          additionalProperties: false,
          properties: {
            title: { type: "string" },
            url: { type: "string" }
          },
          required: ["title", "url"]
        },
        minItems: 3
      },
      risks_unknowns: { type: "array", items: { type: "string" } },
      next_actions: { type: "array", items: { type: "string" } }
    },
    required: ["executive_summary", "key_findings", "sources", "risks_unknowns", "next_actions"]
  },
  null,
  2
);

export async function GET() {
  const db = await readDb();
  return NextResponse.json(db.researchCards ?? []);
}

export async function POST(request: Request) {
  const payload = (await request.json()) as Payload;
  const title = (payload.title || "").trim();
  if (!title) {
    return NextResponse.json({ error: "title is required" }, { status: 400 });
  }

  const now = new Date().toISOString();
  const card: ResearchCard = {
    id: randomUUID(),
    title,
    background: payload.background ?? "",
    question: payload.question ?? "",
    constraints: payload.constraints ?? "",
    outputSchema: payload.outputSchema ?? DEFAULT_OUTPUT_SCHEMA,
    prompt: payload.prompt ?? "",
    result: payload.result ?? "",
    createdAt: now,
    updatedAt: now
  };

  const db = await readDb();
  if (!Array.isArray(db.researchCards)) db.researchCards = [];
  db.researchCards.unshift(card);
  await writeDb(db);

  return NextResponse.json(card, { status: 201 });
}
