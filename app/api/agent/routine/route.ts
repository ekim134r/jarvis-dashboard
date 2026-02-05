import { NextResponse } from "next/server";
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
import { getRoutineCache, setRoutineCache } from "@/lib/ai/routine-cache";

export const runtime = "nodejs";

type RoutineBody = {
  key?: string;
  message?: string;
  modelMode?: ModelMode;
  thinkingLevel?: ThinkingLevel;
  ttlSeconds?: number;
  forceRefresh?: boolean;
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
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "OPENAI_API_KEY is not configured on the server." },
      { status: 500 }
    );
  }

  try {
    const body = (await request.json()) as RoutineBody;
    const key = (body.key || "").trim();
    const message = (body.message || "").trim();
    if (!key || !message) {
      return NextResponse.json(
        { error: "key and message are required" },
        { status: 400 }
      );
    }

    const cached = await getRoutineCache(key);
    if (cached && !body.forceRefresh) {
      return NextResponse.json({
        ok: true,
        cached: true,
        key,
        value: cached.value,
        createdAt: cached.createdAt
      });
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
            content: `Routine task. Cache key: ${key}. Thinking level: ${thinking}. Mode: ${resolvedMode}. ${toolCostHint}`
          }
        ],
        max_output_tokens: Number(process.env.MOLTBOT_MAX_OUTPUT_TOKENS || 600)
      })
    });

    const data = await response.json();
    if (!response.ok) {
      const failMode = process.env.MOLTBOT_FAIL_MODE || "open";
      if (failMode === "open" && cached) {
        return NextResponse.json({
          ok: true,
          cached: true,
          stale: true,
          key,
          value: cached.value,
          createdAt: cached.createdAt
        });
      }
      return NextResponse.json(
        { error: "LLM request failed", details: data },
        { status: 500 }
      );
    }

    const answer = extractOutputText(data) || "(no response)";
    const ttl =
      typeof body.ttlSeconds === "number"
        ? body.ttlSeconds
        : Number(process.env.MOLTBOT_ROUTINE_TTL_SECONDS || 0) || undefined;
    await setRoutineCache(key, answer, ttl);

    await recordUsageEvent({
      kind: "chat",
      tokens: estimateTokens(systemPrompt + message + answer),
      model,
      taskIds: []
    });

    return NextResponse.json({
      ok: true,
      cached: false,
      key,
      value: answer,
      mode: resolvedMode,
      model,
      thinking
    });
  } catch (error) {
    return NextResponse.json({ error: "Routine request failed." }, { status: 500 });
  }
}
