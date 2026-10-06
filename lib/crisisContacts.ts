/**
 * UK crisis contacts (static — not a DB table). Shared by the Crisis screen,
 * the Crisis FAB destinations and the onboarding crisis step, so the numbers
 * can only ever be in one place. Never logged, never personalised (IA §3).
 */
export interface CrisisContact {
  name: string;
  value: string;
  note?: string;
}

export const UK_CRISIS_CONTACTS: readonly CrisisContact[] = [
  { name: "Samaritans", value: "116 123", note: "Free, 24 hours" },
  { name: "Shout", value: "Text 85258", note: "Free, 24 hours" },
  { name: "NHS", value: "111", note: "Urgent advice" },
];
