// User Profile: Persistent facts about the user

type ProfileFact = {
  id: string;
  fact: string;
  category: string;
  confidence: number;
  firstSeen: string;
  lastConfirmed: string;
  occurrences: number;
};

const MEMORY_API_URL = process.env.MEMORY_API_URL || "http://127.0.0.1:9001";

export class UserProfile {
  private cache: ProfileFact[] | null = null;
  private lastFetch: number = 0;
  private cacheTTL: number = 60000; // 1 minute

  async getFacts(category?: string): Promise<string[]> {
    const facts = await this.fetchProfile();
    
    if (category) {
      return facts
        .filter(f => f.category === category && f.confidence >= 0.7)
        .map(f => f.fact);
    }
    
    return facts
      .filter(f => f.confidence >= 0.7)
      .map(f => f.fact);
  }

  async getSummary(): Promise<Record<string, string[]>> {
    const facts = await this.fetchProfile();
    const byCategory: Record<string, string[]> = {};
    
    facts.forEach(f => {
      if (f.confidence >= 0.7) {
        if (!byCategory[f.category]) {
          byCategory[f.category] = [];
        }
        byCategory[f.category].push(f.fact);
      }
    });
    
    return byCategory;
  }

  async addFact(fact: string, category: string = "general", confidence: number = 0.8): Promise<void> {
    await fetch(`${MEMORY_API_URL}/profile/add`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        fact,
        category,
        confidence
      })
    });
    
    // Invalidate cache
    this.cache = null;
  }

  async confirmFact(factId: string): Promise<void> {
    await fetch(`${MEMORY_API_URL}/profile/confirm`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: factId })
    });
    
    // Invalidate cache
    this.cache = null;
  }

  private async fetchProfile(): Promise<ProfileFact[]> {
    const now = Date.now();
    
    if (this.cache && now - this.lastFetch < this.cacheTTL) {
      return this.cache;
    }

    try {
      const res = await fetch(`${MEMORY_API_URL}/profile`);
      const data = await res.json();
      
      this.cache = data.facts || [];
      this.lastFetch = now;

      return this.cache ?? [];
    } catch (err) {
      console.error("[UserProfile] Fetch failed:", err);
      return this.cache ?? [];
    }
  }
}

// Singleton
let profile: UserProfile | null = null;

export function getProfile(): UserProfile {
  if (!profile) {
    profile = new UserProfile();
  }
  return profile;
}

// Categories
export const ProfileCategories = {
  PREFERENCES: "preferences",
  PROJECTS: "projects",
  TECH: "technology",
  WORKSTYLE: "workstyle",
  GOALS: "goals",
  LEARNING: "learning",
  HEALTH: "health",
  GENERAL: "general"
} as const;
