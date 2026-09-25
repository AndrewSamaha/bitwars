"use client";

import { AlertTriangle, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import {
  dispatchCenterCameraOnEntity,
  MINIMUM_DISTANCE_VIOLATION_EVENT,
  type MinimumDistanceViolationDetail,
} from "@/features/gamestate/events";

type Toast = MinimumDistanceViolationDetail & { id: number };

export default function LifecycleToasts() {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const nextId = useRef(0);

  useEffect(() => {
    const dismiss = (id: number) => setToasts((current) => current.filter((toast) => toast.id !== id));
    const onMinimumDistanceViolation = (event: Event) => {
      const detail = (event as CustomEvent<MinimumDistanceViolationDetail>).detail;
      if (!detail) return;
      const toast = { ...detail, id: nextId.current++ };
      setToasts((current) => [...current.slice(-2), toast]);
      window.setTimeout(() => dismiss(toast.id), 6_000);
    };
    window.addEventListener(MINIMUM_DISTANCE_VIOLATION_EVENT, onMinimumDistanceViolation);
    return () => window.removeEventListener(MINIMUM_DISTANCE_VIOLATION_EVENT, onMinimumDistanceViolation);
  }, []);

  if (toasts.length === 0) return null;
  return (
    <div aria-live="polite" className="fixed right-3 top-[220px] z-[60] flex w-80 flex-col gap-2">
      {toasts.map((toast) => (
        <div className="rounded border border-amber-400/60 bg-slate-950/95 p-3 text-sm text-slate-100 shadow-xl" key={toast.id}>
          <div className="flex gap-2">
            <AlertTriangle aria-hidden className="mt-0.5 size-4 shrink-0 text-amber-300" />
            <button
              className="min-w-0 flex-1 text-left"
              onClick={() => dispatchCenterCameraOnEntity(toast.blockingEntityId)}
              type="button"
            >
              <p className="font-medium">Collection blocked</p>
              <p className="mt-1 text-xs text-slate-300">
                Collector {toast.collectorEntityId} is {Math.round(toast.actualDistance)} units from collector {toast.blockingEntityId}; {Math.round(toast.requiredDistance)} required. Click to focus it.
              </p>
            </button>
            <button aria-label="Dismiss" className="self-start text-slate-400 hover:text-white" onClick={() => setToasts((current) => current.filter((item) => item.id !== toast.id))} type="button">
              <X aria-hidden className="size-4" />
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
