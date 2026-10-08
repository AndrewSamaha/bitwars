export type MessageLogEntry = {
  title: string;
  message: string;
  timestamp: number;
};

export function appendMessageLog(entries: readonly MessageLogEntry[], entry: MessageLogEntry): MessageLogEntry[] {
  return [...entries.slice(-99), entry];
}
