import type { Sheet } from "@/components/explainers/CheatSheet";

import { SQL_SHEETS } from "./sql";

/** Cheat sheets keyed by the post's `explainer` id. */
export const CHEATSHEETS: Record<string, Sheet> = Object.fromEntries([...SQL_SHEETS].map((s) => [s.id, s]));
