import { NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { readDb, writeDb } from "@/lib/db";
import type { ChatMessage, ChatThread } from "@/lib/types";
import { buildSystemPrompt } from "@/lib/ai/system-prompt";
import {
  applyThinkingPolicy,
  resolveModel,
  resolveModelMode,
  type ModelMode,
  type ThinkingLevel
} from "@/lib/ai/router";
import { checkRateLimit, checkTokenBudget, estimateTokens } from "@/lib/ai/limits";
import { buildToolCostHint } from "@/lib/ai/tool-costs";
import { recordUsageEvent } from "@/lib/ai/telemetry";

export const runtime = "nodejs";

type ChatBody = {
  message?: string;
  threadId?: string;
  modelMode?: ModelMode;
  thinkingLevel?: ThinkingLevel;
};

function getClientKey(request: Request) {
  const forwarded = request.headers.get("x-forwarded-for");
  const ip = forwarded?.split(",")[0]?.trim();
  return ip || "local";
}

function extractOutputText(payload: any) {
  if (!payload) return "";
  if (typeof payload.output_text === "string") return payload.output_text;
  const outputs = payload.output || [];
  const first = outputs[0];
  const content = first?.content || [];
  const text = content.find((item: any) => item.type === "output_text");
  return text?.text || "";
}

export async function POST(request: Request) {
  try {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "OPENAI_API_KEY is not configured on the server." },
        { status: 500 }
      );
    }

    const body = (await request.json()) as ChatBody;
    const message = (body.message || "").trim();
    if (!message) {
      return NextResponse.json({ error: "message is required" }, { status: 400 });
    }

    const rpm = Number(process.env.MOLTBOT_RATE_LIMIT_RPM || 0);
    const dailyBudget = Number(process.env.MOLTBOT_DAILY_TOKEN_BUDGET || 0);
    const clientKey = getClientKey(request);

    if (!checkRateLimit(clientKey, rpm)) {
      return NextResponse.json({ error: "Rate limit exceeded." }, { status: 429 });
    }

    const systemPrompt = await buildSystemPrompt();
    const requestedMode = body.modelMode;
    const resolvedMode = await resolveModelMode(requestedMode, message);
    const model = resolveModel(resolvedMode);
    const thinking = applyThinkingPolicy(resolvedMode, body.thinkingLevel);
    const toolCostHint = buildToolCostHint();

    const estimatedTokens = estimateTokens(systemPrompt + message) + 512;
    if (!checkTokenBudget(clientKey, estimatedTokens, dailyBudget)) {
      return NextResponse.json({ error: "Daily token budget exceeded." }, { status: 429 });
    }

    const response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model,
        input: [
          { role: "system", content: systemPrompt },
          { role: "user", content: message },
          {
            role: "developer",
            content: `Thinking level: ${thinking}. Mode: ${resolvedMode}. ${toolCostHint} Keep replies concise unless asked.`
          }
        ],
        max_output_tokens: Number(process.env.MOLTBOT_MAX_OUTPUT_TOKENS || 600)
      })
    });

    const data = await response.json();
    if (!response.ok) {
      const failMode = process.env.MOLTBOT_FAIL_MODE || "open";
      if (failMode === "open") {
        const fallback: ChatMessage = {
          id: randomUUID(),
          role: "assistant",
          content: "Moltbot is temporarily unavailable. Please retry in a moment.",
          model,
          createdAt: new Date().toISOString()
        };
        return NextResponse.json({
          ok: true,
          threadId: body.threadId || null,
          message: fallback,
          mode: resolvedMode,
          model,
          thinking,
          degraded: true
        });
      }
      return NextResponse.json(
        { error: "LLM request failed", details: data },
        { status: 500 }
      );
    }

    const answer = extractOutputText(data) || "(no response)";
    const now = new Date().toISOString();
    const db = await readDb();

    let thread: ChatThread | undefined = body.threadId
      ? db.chatThreads.find((item) => item.id === body.threadId)
      : undefined;

    if (!thread) {
      thread = {
        id: body.threadId || randomUUID(),
        title: message.slice(0, 48),
        messages: [],
        createdAt: now,
        updatedAt: now
      };
      db.chatThreads.unshift(thread);
    }

    const userMessage: ChatMessage = {
      id: randomUUID(),
      role: "user",
      content: message,
      createdAt: now
    };

    const assistantMessage: ChatMessage = {
      id: randomUUID(),
      role: "assistant",
      content: answer,
      model,
      createdAt: now
    };

    thread.messages.push(userMessage, assistantMessage);
    thread.updatedAt = now;

    await writeDb(db);

    await recordUsageEvent({
      kind: "chat",
      tokens: estimateTokens(systemPrompt + message + answer),
      model,
      taskIds: []
    });

    return NextResponse.json({
      ok: true,
      threadId: thread.id,
      message: assistantMessage,
      mode: resolvedMode,
      model,
      thinking
    });
  } catch (error) {
    return NextResponse.json({ error: "Chat failed." }, { status: 500 });
  }
}

export async function GET() {
  try {
    const db = await readDb();
    return NextResponse.json(db.chatThreads.slice(0, 5));
  } catch {
    return NextResponse.json({ error: "Failed to load chat history" }, { status: 500 });
  }
}
