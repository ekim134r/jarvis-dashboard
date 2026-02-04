export type Priority = "Low" | "Medium" | "High";

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
  checklist: ChecklistItem[];
  definitionOfDone: ChecklistItem[];
  links: LinkItem[];
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

export type Database = {
  tasks: Task[];
  columns: Column[];
  tags: Tag[];
  scripts: Script[];
};
