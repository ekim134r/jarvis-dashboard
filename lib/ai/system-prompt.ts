import { getStableContext } from "@/lib/ai/prompt-cache";

export async function buildSystemPrompt() {
  const soul = process.env.MOLTBOT_SOUL || "You are Moltbot, a precise execution assistant.";
  const identity = process.env.MOLTBOT_IDENTITY || "Identity: Jarvis Dashboard agent.";
  const user = process.env.MOLTBOT_USER || "User: Owner of this workspace.";
  const tools = process.env.MOLTBOT_TOOLS || "";
  const stableContext = await getStableContext();

  const sections = [
    "### SOUL",
    soul,
    "",
    "### IDENTITY",
    identity,
    "",
    "### USER",
    user
  ];

  if (tools) {
    sections.push("", "### TOOLS", tools);
  }

  if (stableContext) {
    sections.push("", "### STABLE_CONTEXT", stableContext);
  }

  return sections.join("\n");
}
