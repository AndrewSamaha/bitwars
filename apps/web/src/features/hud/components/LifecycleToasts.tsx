"use client";

import { AlertTriangle, X } from "lucide-react";
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import {
  dispatchCenterCameraOnEntity,
  MINIMUM_DISTANCE_VIOLATION_EVENT,
  type MinimumDistanceViolationDetail,
} from "@/features/gamestate/events";

type Toast = MinimumDistanceViolationDetail & { id: number; entering?: boolean; leaving?: boolean; leavingTop?: number };

export default function LifecycleToasts() {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const nextId = useRef(0);
  const toastRefs = useRef(new Map<number, HTMLDivElement>());
  const previousTops = useRef(new Map<number, number>());
  const leavingIds = useRef(new Set<number>());

  const capturePositions = useCallback(() => {
    previousTops.current = new Map(
      Array.from(toastRefs.current, ([id, element]) => [id, element.getBoundingClientRect().top]),
    );
  }, []);

  const dismiss = useCallback((id: number) => {
    if (leavingIds.current.has(id)) return;
    leavingIds.current.add(id);
    capturePositions();
    const leavingTop = toastRefs.current.get(id)?.offsetTop;
    setToasts((current) => current.map((toast) => (toast.id === id ? { ...toast, leaving: true, leavingTop } : toast)));
    window.setTimeout(() => {
      setToasts((current) => current.filter((toast) => toast.id !== id));
      leavingIds.current.delete(id);
    }, 350);
  }, [capturePositions]);

  useLayoutEffect(() => {
    for (const toast of toasts) {
      if (toast.leaving) continue;
      const previousTop = previousTops.current.get(toast.id);
      const element = toastRefs.current.get(toast.id);
      if (previousTop === undefined || !element) continue;
      const delta = previousTop - element.getBoundingClientRect().top;
      if (delta) element.animate([{ transform: `translateY(${delta}px)` }, { transform: "translateY(0)" }], { duration: 350, easing: "ease-out" });
    }
    previousTops.current.clear();
  }, [toasts]);

  useEffect(() => {
    const onMinimumDistanceViolation = (event: Event) => {
      const detail = (event as CustomEvent<MinimumDistanceViolationDetail>).detail;
      if (!detail) return;
      const toast = { ...detail, id: nextId.current++, entering: true };
      setToasts((current) => [...current.slice(-2), toast]);
      window.requestAnimationFrame(() => {
        setToasts((current) => current.map((item) => (item.id === toast.id ? { ...item, entering: false } : item)));
      });
      window.setTimeout(() => dismiss(toast.id), 6_000);
    };
    window.addEventListener(MINIMUM_DISTANCE_VIOLATION_EVENT, onMinimumDistanceViolation);
    return () => window.removeEventListener(MINIMUM_DISTANCE_VIOLATION_EVENT, onMinimumDistanceViolation);
  }, [dismiss]);

  if (toasts.length === 0) return null;
  return (
    <div aria-live="polite" className="fixed right-3 top-[220px] z-[60] flex w-80 flex-col">
      {toasts.map((toast) => (
        <div
          className={`inset-x-0 transition-[opacity,transform] duration-[350ms] ease-out ${toast.leaving ? "pointer-events-none absolute z-0" : "relative z-10 mb-2"} ${toast.entering || toast.leaving ? "translate-y-2 opacity-0" : "translate-y-0 opacity-100"}`}
          key={toast.id}
          ref={(element) => {
            if (element) toastRefs.current.set(toast.id, element);
            else toastRefs.current.delete(toast.id);
          }}
          style={toast.leaving ? { top: toast.leavingTop } : undefined}
        >
          <div className="flex gap-2 rounded border border-amber-400/60 bg-slate-950/95 p-3 text-sm text-slate-100 shadow-xl">
            <AlertTriangle aria-hidden className="mt-0.5 size-4 shrink-0 text-amber-300" />
            <button
              className="min-w-0 flex-1 text-left"
              onClick={() => {
                dispatchCenterCameraOnEntity(toast.blockingEntityId);
                dismiss(toast.id);
              }}
              type="button"
            >
              <p className="font-medium">Collection blocked</p>
              <p className="mt-1 text-xs text-slate-300">
                Collector {toast.collectorEntityId} is {Math.round(toast.actualDistance)} units from collector {toast.blockingEntityId}; {Math.round(toast.requiredDistance)} required. Click to focus it.
              </p>
            </button>
            <button aria-label="Dismiss" className="self-start text-slate-400 hover:text-white" onClick={() => dismiss(toast.id)} type="button">
              <X aria-hidden className="size-4" />
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
