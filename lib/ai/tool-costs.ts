export type ToolCost = {
  name: string;
  weight: number;
};

const TOOL_COSTS: ToolCost[] = [
  { name: "web", weight: 3 },
  { name: "batch", weight: 2 },
  { name: "db", weight: 2 },
  { name: "local", weight: 1 }
];

export function getToolCosts() {
  return TOOL_COSTS;
}

export function buildToolCostHint() {
  const lines = TOOL_COSTS.map((tool) => `${tool.name}=${tool.weight}`).join(", ");
  return `Tool costs: ${lines}. Avoid high-cost tools unless required.`;
}
