// Memory Core - Local Supermemory Clone
// Auto-recall + auto-capture with containers and profiles

export {
  recall,
  quickRecall,
  type RecallOptions,
  type RecallResult,
  type Memory
} from "./recall";

export {
  capture,
  remember,
  type CaptureOptions
} from "./capture";

export {
  MemoryPipeline,
  getPipeline,
  resetPipeline,
  detectContainer,
  defaultConfig,
  type MemoryConfig
} from "./pipeline";

export {
  UserProfile,
  getProfile,
  ProfileCategories
} from "./profile";

// Quick access functions
import { getPipeline } from "./pipeline";
import { quickRecall } from "./recall";
import { remember } from "./capture";
import { getProfile } from "./profile";

export const memory = {
  recall: quickRecall,
  remember,
  get pipeline() { return getPipeline(); },
  get profile() { return getProfile(); }
};

export default memory;
