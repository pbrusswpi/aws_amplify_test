"use client";
// Persistence boundary for the demo: localStorage-backed store.
// Swap getDB/update for API calls when a backend exists; controllers stay the same.
import { useSyncExternalStore } from "react";
import type { Assignment, Issue, Journal, Paper, Rubric } from "@/entities/types";
import { seedRubric } from "@/entities/seed";

export interface DB { rubrics: Rubric[]; journals: Journal[]; issues: Issue[]; papers: Paper[]; assignments: Assignment[] }
const KEY = "raser-db-v1";
export const EMPTY: DB = { rubrics: [], journals: [], issues: [], papers: [], assignments: [] };
let state: DB = EMPTY;
let loaded = false;
const listeners = new Set<() => void>();

function load() {
  if (loaded || typeof window === "undefined") return;
  loaded = true;
  try {
    const raw = window.localStorage.getItem(KEY);
    state = raw ? (JSON.parse(raw) as DB) : { ...EMPTY, rubrics: [seedRubric()] };
  } catch {
    state = { ...EMPTY, rubrics: [seedRubric()] };
  }
}
export function getDB(): DB { load(); return state; }
/** Apply a pure transformation. If fn throws, nothing is saved. */
export function update(fn: (db: DB) => DB) {
  const next = fn(getDB());
  state = next;
  try { window.localStorage.setItem(KEY, JSON.stringify(next)); } catch { /* storage full or blocked */ }
  listeners.forEach((l) => l());
}
function subscribe(l: () => void) {
  listeners.add(l);
  const onStorage = (e: StorageEvent) => { if (e.key === KEY && e.newValue) { state = JSON.parse(e.newValue); l(); } };
  window.addEventListener("storage", onStorage);
  return () => { listeners.delete(l); window.removeEventListener("storage", onStorage); };
}
export const useDB = () => useSyncExternalStore(subscribe, getDB, () => EMPTY);
export const useReady = () => useSyncExternalStore(() => () => {}, () => true, () => false);
