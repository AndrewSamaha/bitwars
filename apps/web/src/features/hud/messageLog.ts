export type MessageLogEntry = {
  title: string;
  message: string;
  timestamp: number;
  focusEntityId?: string;
  focusLabel?: string;
};

export function appendMessageLog(entries: readonly MessageLogEntry[], entry: MessageLogEntry): MessageLogEntry[] {
  return [...entries.slice(-99), entry];
}
