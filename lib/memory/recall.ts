// Auto-Recall: Search relevant memories before AI response

export type RecallOptions = {
  query: string;
  container?: string;
  maxResults?: number;
  threshold?: number;
  includeProfile?: boolean;
};

export type Memory = {
  id: string;
  text: string;
  container: string;
  source: string;
  createdAt: string;
  score?: number;
};

export type RecallResult = {
  memories: Memory[];
  profile?: string[];
  contextString: string;
};

const MEMORY_API_URL = process.env.MEMORY_API_URL || "http://127.0.0.1:9001";

export async function recall(options: RecallOptions): Promise<RecallResult> {
  const {
    query,
    container = "work",
    maxResults = 5,
    threshold = 0.7,
    includeProfile = true
  } = options;

  try {
    // Search memories
    const searchRes = await fetch(`${MEMORY_API_URL}/memories/search`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        query,
        container,
        maxResults: maxResults * 2, // Fetch more, filter by threshold
        includeEmbedding: false
      })
    });

    const searchData = await searchRes.json();
    let memories: Memory[] = (searchData.results || [])
      .filter((m: any) => (m.score || 0) >= threshold)
      .slice(0, maxResults);

    // Get profile if requested
    let profile: string[] | undefined;
    if (includeProfile) {
      const profileRes = await fetch(`${MEMORY_API_URL}/profile`);
      const profileData = await profileRes.json();
      profile = profileData.facts || [];
    }

    // Format as context string
    const contextString = formatContext(memories, profile);

    return {
      memories,
      profile,
      contextString
    };
  } catch (err) {
    console.error("[MemoryCore] Recall failed:", err);
    return {
      memories: [],
      contextString: ""
    };
  }
}

function formatContext(memories: Memory[], profile?: string[]): string {
  const parts: string[] = [];

  if (profile && profile.length > 0) {
    parts.push("## User Profile");
    profile.forEach(fact => parts.push(`- ${fact}`));
    parts.push("");
  }

  if (memories.length > 0) {
    parts.push("## Relevant Context");
    memories.forEach((m, i) => {
      parts.push(`${i + 1}. [${m.container}] ${m.text.slice(0, 200)}${m.text.length > 200 ? "..." : ""}`);
    });
  }

  return parts.join("\n");
}

// Quick recall for simple queries
export async function quickRecall(query: string, container?: string): Promise<string> {
  const result = await recall({ query, container, maxResults: 3 });
  return result.contextString;
}
