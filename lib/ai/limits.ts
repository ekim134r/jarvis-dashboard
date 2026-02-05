type Bucket = {
  count: number;
  resetAt: number;
};

const buckets = new Map<string, Bucket>();

export function checkRateLimit(key: string, rpm: number): boolean {
  if (!rpm || rpm <= 0) return true;
  const now = Date.now();
  const windowMs = 60_000;
  const bucket = buckets.get(key);
  if (!bucket || bucket.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return true;
  }
  if (bucket.count >= rpm) return false;
  bucket.count += 1;
  return true;
}

type BudgetState = {
  tokens: number;
  dayKey: string;
};

const budget = new Map<string, BudgetState>();

function getDayKey() {
  const now = new Date();
  return now.toISOString().slice(0, 10);
}

export function checkTokenBudget(key: string, tokens: number, dailyBudget: number): boolean {
  if (!dailyBudget || dailyBudget <= 0) return true;
  const dayKey = getDayKey();
  const state = budget.get(key);
  if (!state || state.dayKey !== dayKey) {
    budget.set(key, { tokens, dayKey });
    return tokens <= dailyBudget;
  }
  state.tokens += tokens;
  return state.tokens <= dailyBudget;
}

export function estimateTokens(text: string) {
  if (!text) return 0;
  return Math.max(1, Math.ceil(text.length / 4));
}
