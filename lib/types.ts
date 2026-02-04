export type Priority = "Low" | "Medium" | "High";
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
  tags: string[];
  description: string;
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

export type Database = {
  tasks: Task[];
  columns: Column[];
  tags: Tag[];
  scripts: Script[];
  preferences: Preference[];
  experiments: Experiment[];
};
