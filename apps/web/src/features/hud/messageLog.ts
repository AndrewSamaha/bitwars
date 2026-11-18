import type { MessageKind } from "./messages";

export type EntityMessageLink = { start: number; end: number; entityId: string };

export type MessageLogEntry = {
  kind: MessageKind;
  title: string;
  message: string;
  timestamp: number;
  focusEntityId?: string;
  focusLabel?: string;
  entityLinks?: EntityMessageLink[];
};

export function appendMessageLog(entries: readonly MessageLogEntry[], entry: MessageLogEntry): MessageLogEntry[] {
  return [...entries.slice(-99), entry];
}

/** Legacy single-focus entries remain readable; structured spans distinguish identical labels. */
export function messageEntityLinks(entry: Pick<MessageLogEntry, "message" | "entityLinks" | "focusEntityId" | "focusLabel">): EntityMessageLink[] {
  if (entry.entityLinks) return entry.entityLinks;
  if (!entry.focusEntityId || !entry.focusLabel) return [];
  const start = entry.message.indexOf(entry.focusLabel);
  return start < 0 ? [] : [{ start, end: start + entry.focusLabel.length, entityId: entry.focusEntityId }];
}
