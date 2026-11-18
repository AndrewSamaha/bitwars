import type { ReactNode } from "react";
import { dispatchCenterCameraOnEntity } from "@/features/gamestate/events";
import type { EntityMessageLink } from "../messageLog";

export function EntityLinkedText({ text, links = [], enabled = true, onFocus }: {
  text: string;
  links?: readonly EntityMessageLink[];
  enabled?: boolean;
  onFocus?: () => void;
}) {
  let offset = 0;
  const parts: ReactNode[] = [];
  for (const link of links) {
    parts.push(text.slice(offset, link.start));
    parts.push(
      <button
        key={link.start}
        type="button"
        className="cursor-pointer text-inherit no-underline hover:text-cyan-100 hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-cyan-300"
        title={`Focus entity ${link.entityId}`}
        onClick={(event) => {
          event.stopPropagation();
          if (enabled) {
            dispatchCenterCameraOnEntity(link.entityId);
            onFocus?.();
          }
        }}
      >{text.slice(link.start, link.end)}</button>,
    );
    offset = link.end;
  }
  parts.push(text.slice(offset));
  return <>{parts}</>;
}
