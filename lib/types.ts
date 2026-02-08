export type Priority = "P0" | "P1" | "P2" | "P3";
export type Level = "Low" | "Medium" | "High";

export type EncryptedString = string;

export type ChecklistItem = {
  id: string;
  text: string;
  done: boolean;
};

export type LinkItem = {
  id: string;
  label: string;
  url: string;
};

export type Task = {
  id: string;
  title: string;
  columnId: string;
  priority: Priority;
  projectId?: string;
  tags: string[];
  description: string;
  owner?: "Mika" | "Jarvis";
  nextAction: string; // Added nextAction
  swarmRequired?: boolean;
  processingMode?: "realtime" | "batch";
  batchJobId?: string;
  notes: string;
  sensitiveNotes: EncryptedString;
  privateNumbers?: EncryptedString;
  checklist: ChecklistItem[];
  definitionOfDone: ChecklistItem[];
  links: LinkItem[];
  estimateHours?: number;
  dueDate?: string;
  dependencies?: string[];
  impact?: Level;
  effort?: Level;
  confidence?: number;
  createdAt: string;
  updatedAt: string;
};

export type Column = {
  id: string;
  title: string;
  key?: string;
  order: number;
};

export type Project = {
  id: string;
  title: string;
  key: string;
  description?: string;
  repos: string[];
  domains: string[];
  guidelinesPath?: string;
  heartbeatProfile?: "default" | "luminos" | "ops";
  createdAt: string;
  updatedAt: string;
};

export type Tag = {
  id: string;
  label: string;
  color: string;
};

export type Script = {
  id: string;
  name: string;
  description: string;
  command: string;
  tags: string[];
  favorite: boolean;
  createdAt: string;
  updatedAt: string;
};

export type PreferenceDecision = "left" | "right" | "skip" | "unset";

export type Preference = {
  id: string;
  prompt: string;
  leftLabel: string;
  rightLabel: string;
  tags: string[];
  decision: PreferenceDecision;
  confidence: number;
  notes: string;
  createdAt: string;
  updatedAt: string;
};

export type ExperimentStatus =
  | "Idea"
  | "Queued"
  | "Running"
  | "Analyzing"
  | "Complete";

export type ExperimentResult =
  | "Pending"
  | "Positive"
  | "Negative"
  | "Inconclusive";

export type Experiment = {
  id: string;
  title: string;
  hypothesis: string;
  metric: string;
  status: ExperimentStatus;
  result: ExperimentResult;
  startDate?: string;
  endDate?: string;
  owner?: string;
  notes: string;
  tags: string[];
  createdAt: string;
  updatedAt: string;
};

export type AgentStatus = "active" | "idle" | "stopped" | "error";

export type DeploymentStatus = "success" | "building" | "failed";

export type Deployment = {
  id: string;
  environment: "production" | "preview";
  url: string;
  status: DeploymentStatus;
  timestamp: string;
};

export type AgentActivityType = "task" | "system" | "error";

export type AgentActivity = {
  id: string;
  type: AgentActivityType;
  message: string;
  timestamp: string;
};

export type AgentRunType = "subagent" | "exec" | "deploy";

export type AgentRun = {
  id: string;
  type: AgentRunType;
  model: string;
  status: "running" | "success" | "failed";
  startedAt: string;
  shortLog: string; // The last ~40 lines or summary
};

export type AgentMetrics = {
  tokensUsedDaily: number;
  tokensUsedWeekly: number; // 7-day rolling
  messagesCount: number;
  toolCallsCount: number;
  totalCost: number;
  uptime: number; // in seconds
  requestsProcessed: number;
};

export type AgentState = {
  status: AgentStatus;
  gatewayStatus: "ok" | "warn" | "down";
  metrics: AgentMetrics;
  lastDeploy: Deployment;
  activeRuns: number; // Count of currently active jobs
  recentRuns: AgentRun[];
  lastActive: string;
};

export type VpsStatus = {
  health?: string;
  uptimeSec?: number;
  [key: string]: unknown;
};

export type ChatRole = "system" | "user" | "assistant";

export type ChatMessage = {
  id: string;
  role: ChatRole;
  content: string;
  model?: string;
  createdAt: string;
};

export type ChatThread = {
  id: string;
  title: string;
  messages: ChatMessage[];
  createdAt: string;
  updatedAt: string;
};

export type WebhookEvent = {
  id: string;
  source: string;
  type: string;
  payload: unknown;
  receivedAt: string;
};

export type UsageEvent = {
  id: string;
  kind: "chat" | "batch" | "tool";
  tokens: number;
  model?: string;
  taskIds: string[];
  tool?: string;
  createdAt: string;
};

export type UsageAlert = {
  id: string;
  level: "warn" | "critical";
  message: string;
  createdAt: string;
};

export type RoutineCacheEntry = {
  id: string;
  key: string;
  value: string;
  ttlSeconds?: number;
  createdAt: string;
};

export type LabQuestionType = "short" | "long" | "single" | "multi" | "scale" | "tinder";

export type LabQuestion = {
  id: string;
  label: string;
  type: LabQuestionType;
  required: boolean;
  helper?: string;
  options?: string[];
};

export type LabAssetRequest = {
  id: string;
  label: string;
  type: "image" | "icon" | "video" | "copy" | "data" | "other";
  required?: boolean;
  notes?: string;
  uploadedFileName?: string;
  uploadedAt?: string;
};

export type LabFramework = {
  id: string;
  title: string;
  goal: string;
  context: string;
  screenType: string;
  outputFormat: string;
  outputLength: string;
  aiTemplate: string;
  questions: LabQuestion[];
  assetRequests: LabAssetRequest[];
  createdAt: string;
  updatedAt: string;
};

export type LabAnswerValue = string | string[] | number;

export type LabSession = {
  id: string;
  frameworkId: string;
  title: string;
  answers: Record<string, LabAnswerValue>;
  notes: string;
  createdAt: string;
};

export type LabResearchPrompt = {
  id: string;
  title: string;
  objective: string;
  outputFormat: string;
  outputLength: string;
  prompt: string;
  response: string;
  createdAt: string;
};

export type AgentSlot = {
  updatedAt: string;
  state: unknown;
} | null;

export type AgentSlots = {
  jarvis: AgentSlot;
  claw: AgentSlot;
};

export type BridgeLetterStatus = "queued" | "claimed" | "done" | "failed";

export type BridgeLetter = {
  id: string;
  from: "jarvis" | "claw";
  to: "jarvis" | "claw";
  title: string;
  payload: string;
  status: BridgeLetterStatus;
  claimedBy?: string;
  createdAt: string;
  updatedAt: string;
};

export type NotificationLevel = "info" | "warn" | "critical";

export type Notification = {
  id: string;
  level: NotificationLevel;
  source: string;
  type: string;
  title: string;
  body?: string;
  read: boolean;
  createdAt: string;
};

export type Database = {
  tasks: Task[];
  columns: Column[];
  projects?: Project[];
  ui?: { activeProjectId?: string };
  tags: Tag[];
  scripts: Script[];
  preferences: Preference[];
  experiments: Experiment[];
  agent: AgentState;
  agents?: AgentSlots;
  letters?: BridgeLetter[];
  chatThreads: ChatThread[];
  webhookEvents: WebhookEvent[];
  usageEvents: UsageEvent[];
  usageAlerts: UsageAlert[];
  notifications?: Notification[];
  routineCache: RoutineCacheEntry[];
  labFrameworks: LabFramework[];
  labSessions: LabSession[];
  labResearchPrompts: LabResearchPrompt[];
};
