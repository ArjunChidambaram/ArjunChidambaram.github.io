import type { Sheet } from "@/components/explainers/CheatSheet";

import { ML_SHEETS } from "./ml";
import { SQL_SHEETS } from "./sql";
import { STATS_SHEETS } from "./stats";

/** Cheat sheets keyed by the post's `explainer` id. */
export const CHEATSHEETS: Record<string, Sheet> = Object.fromEntries([...SQL_SHEETS, ...ML_SHEETS, ...STATS_SHEETS].map((s) => [s.id, s]));
