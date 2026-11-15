import type { MessageKind } from "./messages";

export type MessageLogEntry = {
  kind: MessageKind;
  title: string;
  message: string;
  timestamp: number;
  focusEntityId?: string;
  focusLabel?: string;
};

export function appendMessageLog(entries: readonly MessageLogEntry[], entry: MessageLogEntry): MessageLogEntry[] {
  return [...entries.slice(-99), entry];
}
