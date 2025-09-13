export function sseFormat({ event, id, data, comment }: { event?: string; id?: string; data?: any; comment?: string; }): string {
  if (comment) {
    return `: ${comment}\n\n`;
  }
  let out = "";
  if (event) out += `event: ${event}\n`;
  if (id) out += `id: ${id}\n`;
  if (data !== undefined) out += `data: ${JSON.stringify(data)}\n`;
  return out + "\n";
}