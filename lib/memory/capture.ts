// Auto-Capture: Store conversations after AI response

export type CaptureOptions = {
  userMessage: string;
  aiResponse: string;
  container?: string;
  metadata?: Record<string, any>;
};

type ExtractedFact = {
  text: string;
  confidence: number;
  type: "fact" | "preference" | "task" | "project";
};

const MEMORY_API_URL = process.env.MEMORY_API_URL || "http://127.0.0.1:9001";

export async function capture(options: CaptureOptions): Promise<void> {
  const {
    userMessage,
    aiResponse,
    container = "work",
    metadata = {}
  } = options;

  try {
    // Extract facts from the conversation
    const facts = await extractFacts(userMessage, aiResponse);

    // Store each fact
    await Promise.all(
      facts.map(fact =>
        storeMemory({
          text: fact.text,
          container,
          source: "conversation",
          type: fact.type,
          confidence: fact.confidence,
          metadata: {
            ...metadata,
            userMessage: userMessage.slice(0, 500),
            aiResponse: aiResponse.slice(0, 500)
          }
        })
      )
    );

    // Also store the conversation thread
    await storeConversation({
      userMessage,
      aiResponse,
      container,
      facts,
      metadata
    });

  } catch (err) {
    console.error("[MemoryCore] Capture failed:", err);
  }
}

async function extractFacts(userMsg: string, aiRsp: string): Promise<ExtractedFact[]> {
  const combined = `${userMsg}\n${aiRsp}`;
  const facts: ExtractedFact[] = [];

  // Simple rule-based extraction (replace with LLM-based later)
  
  // Extract preferences ("I want...", "I like...", "I prefer...")
  const preferencePatterns = [
    /(?:i want|i'd like|i would like|i prefer|i need)\s+(.{10,200})/gi,
    /(?:make sure|ensure|always|never)\s+(.{10,200})/gi
  ];
  
  preferencePatterns.forEach(pattern => {
    let match;
    while ((match = pattern.exec(combined)) !== null) {
      facts.push({
        text: match[1].trim(),
        confidence: 0.7,
        type: "preference"
      });
    }
  });

  // Extract tasks/actions ("Build...", "Create...", "Fix...")
  const taskPatterns = [
    /(?:build|create|make|implement|fix|deploy|add)\s+(.{10,200})/gi,
    /(?:todo|task|action item):?\s*(.{10,200})/gi
  ];
  
  taskPatterns.forEach(pattern => {
    let match;
    while ((match = pattern.exec(combined)) !== null) {
      facts.push({
        text: match[1].trim(),
        confidence: 0.6,
        type: "task"
      });
    }
  });

  // Store raw conversation summary if no facts extracted
  if (facts.length === 0 && combined.length > 50) {
    facts.push({
      text: `Conversation: ${userMsg.slice(0, 100)}...`,
      confidence: 0.5,
      type: "fact"
    });
  }

  return facts.slice(0, 5); // Limit to top 5 facts
}

async function storeMemory(data: {
  text: string;
  container: string;
  source: string;
  type: string;
  confidence: number;
  metadata: any;
}): Promise<void> {
  await fetch(`${MEMORY_API_URL}/memories/add`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      text: data.text,
      tags: [data.type, data.source, data.container],
      source: data.source,
      metadata: {
        confidence: data.confidence,
        ...data.metadata
      }
    })
  });
}

async function storeConversation(data: {
  userMessage: string;
  aiResponse: string;
  container: string;
  facts: ExtractedFact[];
  metadata: any;
}): Promise<void> {
  await fetch(`${MEMORY_API_URL}/conversations/add`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      messages: [
        { role: "user", content: data.userMessage },
        { role: "assistant", content: data.aiResponse }
      ],
      summary: data.facts.map(f => f.text).join("; "),
      container: data.container,
      metadata: data.metadata
    })
  }).catch(() => {
    // Conversations endpoint might not exist yet, ignore
  });
}

// Manual remember function (like /remember command)
export async function remember(text: string, container?: string): Promise<void> {
  await storeMemory({
    text,
    container: container || "work",
    source: "manual",
    type: "fact",
    confidence: 1.0,
    metadata: { manual: true }
  });
}
