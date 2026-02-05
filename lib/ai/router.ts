export type ModelMode = "flash" | "flash-reasoning" | "pro";
export type ThinkingLevel = "low" | "medium" | "high";

const MODELS: Record<ModelMode, string> = {
  flash: process.env.MOLTBOT_MODEL_FLASH || "gpt-4o-mini",
  "flash-reasoning":
    process.env.MOLTBOT_MODEL_FLASH_REASONING || "gpt-4o-mini",
  pro: process.env.MOLTBOT_MODEL_PRO || "gpt-4o"
};

const THINKING_POLICY: Record<ModelMode, ThinkingLevel> = {
  flash: "low",
  "flash-reasoning": "medium",
  pro: "high"
};

export function applyThinkingPolicy(
  mode: ModelMode,
  requested?: ThinkingLevel
): ThinkingLevel {
  const policy = THINKING_POLICY[mode];
  if (!requested) return policy;
  if (mode === "flash") return "low";
  if (mode === "flash-reasoning" && requested === "high") return "medium";
  return requested;
}

export function resolveModel(mode: ModelMode) {
  return MODELS[mode] || MODELS.flash;
}

export async function routeWithOllama(
  prompt: string,
  modes: ModelMode[] = ["flash", "flash-reasoning", "pro"]
): Promise<ModelMode | null> {
  const host = process.env.OLLAMA_ROUTER_URL;
  const model = process.env.OLLAMA_ROUTER_MODEL || "llama3.1";
  if (!host) return null;

  try {
    const res = await fetch(`${host.replace(/\/$/, "")}/api/generate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model,
        prompt: [
          "You are a routing assistant. Choose the best mode for the user request.",
          `Allowed modes: ${modes.join(", ")}`,
          "Answer with one mode only.",
          "",
          prompt
        ].join("\\n")
      })
    });
    if (!res.ok) return null;
    const data = await res.json();
    const text = String(data?.response || "").trim().toLowerCase();
    if (modes.includes(text as ModelMode)) return text as ModelMode;
    return null;
  } catch {
    return null;
  }
}

export async function resolveModelMode(
  requested: ModelMode | undefined,
  prompt: string
): Promise<ModelMode> {
  if (requested) return requested;
  const routed = await routeWithOllama(prompt);
  if (routed) return routed;
  return "flash";
}
