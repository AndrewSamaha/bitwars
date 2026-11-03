// hud/HUDContext.tsx
import React, {
  createContext,
  useContext,
  useMemo,
  useReducer,
  useEffect,
  useRef,
  useState,
  ReactNode,
  Dispatch,
} from "react";

import type { Application, Container } from "pixi.js";
import type { Entity } from "@/features/gamestate/world";
import { appendMessageLog, type MessageLogEntry } from "@/features/hud/messageLog";
import type { TerminalOutputLink } from "@/features/hud/terminal/commands";
//
// Types
//
export type EntityId = string;

export type CommandHistory = {
  command: string;
  output: string;
  links?: TerminalOutputLink[];
};

export type HUDPanels = {
  minimapOpen: boolean;
  inventoryOpen: boolean;
  productionOpen: boolean;
  techTreeOpen: boolean;
  [k: string]: boolean; // extensible
};

export type HUDState = {
  selectedEntities: EntityId[];     // ordered array if you care about last-selected
  selectedSet: Set<EntityId>;       // fast membership checks
  selectedAction: "Assign" | "Escort" | "Sentry" | "Convoy" | "Move" | "Repair" | { kind: "Deliver" | "Transport" | "Resupply"; resourceTypeIds: string[]; donorId?: string } | null;
  isMeasuring: boolean;
  panels: HUDPanels;
  // Misc ephemeral HUD data
  hoveredEntity: Entity | null;
  tooltip?: string | null;
  // Terminal state
  isTerminalOpen: boolean;
  isTerminalWide: boolean;
  currentCommand: string;
  commandHistory: CommandHistory[];
  messageLog: MessageLogEntry[];
  // PixiJS Stuff
  app: Application | null;
  camera: Container | null;
};

//
// Initial State
//
const defaultState: HUDState = {
  selectedEntities: [],
  selectedSet: new Set(),
  selectedAction: null,
  isMeasuring: false,
  panels: {
    minimapOpen: true,
    inventoryOpen: false,
    productionOpen: false,
    techTreeOpen: false,
  },
  hoveredEntity: null,
  tooltip: null,
  isTerminalOpen: true,
  isTerminalWide: false,
  currentCommand: "",
  commandHistory: [
    { command: "", output: "BitWars Terminal v1.0.0\nType 'help' for available commands.\n" },
  ],
  app: null,
  messageLog: [],
  camera: null,
};

//
// Actions
//
type Action =
  | { type: "SELECT_SET"; ids: EntityId[] }                       // replace selection
  | { type: "SELECT_ADD"; ids: EntityId[] }                       // add to selection
  | { type: "SELECT_REMOVE"; ids: EntityId[] }                    // remove from selection
  | { type: "SELECT_CLEAR" }
  | { type: "ACTION_SET"; value: HUDState["selectedAction"] }
  | { type: "MEASURE_SET"; value: boolean }
  | { type: "PANEL_SET"; key: keyof HUDPanels; value: boolean }
  | { type: "PANEL_TOGGLE"; key: keyof HUDPanels }
  | { type: "HOVER_SET"; entity: Entity | null }
  | { type: "TOOLTIP_SET"; text: string | null }
  | { type: "APP_SET"; app: Application | null }
  | { type: "APP_CLEAR"; app: Application }
  | { type: "CAMERA_SET"; camera: Container | null }
  // Terminal actions
  | { type: "TERMINAL_RESTORE"; open: boolean; wide: boolean }
  | { type: "TERMINAL_SET_OPEN"; open: boolean }
  | { type: "TERMINAL_TOGGLE" }
  | { type: "TERMINAL_TOGGLE_WIDTH" }
  | { type: "TERMINAL_SET_INPUT"; value: string }
  | { type: "TERMINAL_PUSH_HISTORY"; entry: CommandHistory }
  | { type: "MESSAGE_LOG_PUSH"; entry: MessageLogEntry };

//
// Reducer
//
function reducer(state: HUDState, action: Action): HUDState {
  switch (action.type) {
    case "SELECT_SET": {
      const unique = dedupe(action.ids);
      return { ...state, selectedEntities: unique, selectedSet: new Set(unique) };
    }
    case "SELECT_ADD": {
      const set = new Set(state.selectedSet);
      action.ids.forEach((id) => set.add(id));
      const arr = state.selectedEntities.concat(action.ids.filter(id => !state.selectedSet.has(id)));
      return { ...state, selectedEntities: arr, selectedSet: set };
    }
    case "SELECT_REMOVE": {
      const remove = new Set(action.ids);
      const arr = state.selectedEntities.filter(id => !remove.has(id));
      return { ...state, selectedEntities: arr, selectedSet: new Set(arr) };
    }
    case "SELECT_CLEAR":
      return { ...state, selectedEntities: [], selectedSet: new Set() };

    case "ACTION_SET":
      return { ...state, selectedAction: action.value, isMeasuring: action.value ? false : state.isMeasuring };

    case "MEASURE_SET":
      return { ...state, isMeasuring: action.value, selectedAction: action.value ? null : state.selectedAction };

    case "PANEL_SET":
      return { ...state, panels: { ...state.panels, [action.key]: action.value } };

    case "PANEL_TOGGLE":
      return { ...state, panels: { ...state.panels, [action.key]: !state.panels[action.key] } };

    case "HOVER_SET":
      return { ...state, hoveredEntity: action.entity };

    case "TOOLTIP_SET":
      return { ...state, tooltip: action.text };

    case "TERMINAL_RESTORE":
      return { ...state, isTerminalOpen: action.open, isTerminalWide: action.open && action.wide };

    case "TERMINAL_SET_OPEN":
      return { ...state, isTerminalOpen: action.open, isTerminalWide: action.open ? state.isTerminalWide : false };

    case "TERMINAL_TOGGLE":
      return { ...state, isTerminalOpen: !state.isTerminalOpen, isTerminalWide: false };

    case "TERMINAL_TOGGLE_WIDTH":
      return state.isTerminalOpen ? { ...state, isTerminalWide: !state.isTerminalWide } : state;

    case "TERMINAL_SET_INPUT":
      return { ...state, currentCommand: action.value };

    case "TERMINAL_PUSH_HISTORY":
      return { ...state, commandHistory: [...state.commandHistory, action.entry] };

    case "MESSAGE_LOG_PUSH":
      return { ...state, messageLog: appendMessageLog(state.messageLog, action.entry) };

    case "APP_SET":
      return { ...state, app: action.app };

    case "APP_CLEAR":
      return state.app === action.app ? { ...state, app: null, camera: null, hoveredEntity: null } : state;

    case "CAMERA_SET":
      return { ...state, camera: action.camera };

    default:
      return state;
  }
}

function dedupe(ids: EntityId[]): EntityId[] {
  const set = new Set<EntityId>();
  const out: EntityId[] = [];
  for (const id of ids) {
    if (!set.has(id)) {
      set.add(id);
      out.push(id);
    }
  }
  return out;
}

//
// Context
//
type HUDContextValue = {
  state: HUDState;
  dispatch: Dispatch<Action>;
  // Niceties: action creators & selectors
  actions: {
    setSelection: (ids: EntityId[]) => void;
    addSelection: (ids: EntityId[]) => void;
    removeSelection: (ids: EntityId[]) => void;
    clearSelection: () => void;
    setSelectedAction: (value: HUDState["selectedAction"]) => void;
    setMeasuring: (value: boolean) => void;
    setPanel: (key: keyof HUDPanels, value: boolean) => void;
    togglePanel: (key: keyof HUDPanels) => void;
    setHovered: (entity: Entity | null) => void;
    setTooltip: (text: string | null) => void;
    // Terminal
    setTerminalOpen: (open: boolean) => void;
    toggleTerminal: () => void;
    toggleTerminalWidth: () => void;
    setTerminalInput: (value: string) => void;
    pushCommandHistory: (entry: CommandHistory) => void;
    pushMessageLog: (entry: MessageLogEntry) => void;
    setApp: (app: Application | null) => void;
    clearApp: (app: Application) => void;
    setCamera: (camera: Container | null) => void;
  };
  selectors: {
    hasSelection: boolean;
    selectionCount: number;
    isSelected: (id: EntityId) => boolean;
    selectedAction: HUDState["selectedAction"];
    isMeasuring: boolean;
    selectedEntities: EntityId[];
    firstSelectedId: EntityId | null;
    isPanelOpen: (key: keyof HUDPanels) => boolean;
    // Terminal
    isTerminalOpen: boolean;
    isTerminalWide: boolean;
    currentCommand: string;
    commandHistory: CommandHistory[];
    camera: Container | null;
    hoveredEntity: Entity | null;
    app: Application | null;
  };
  // Terminal refs (not persisted)
  refs: {
    terminalRef: React.RefObject<HTMLDivElement | null>;
    inputRef: React.RefObject<HTMLInputElement | null>;
  };
};

const HUDContext = createContext<HUDContextValue | null>(null);

//
// Provider (with optional persistence)
//
type HUDProviderProps = {
  children: ReactNode;
  persistKey?: string;
  persist?: boolean; // Terminal layout only; defaults to true.
};

export function HUDProvider({ children, persistKey = "bitwars:terminal", persist = true }: HUDProviderProps) {
  const [state, dispatch] = useReducer(reducer, defaultState);
  const [terminalRestored, setTerminalRestored] = useState(false);

  // Refs that we expose via context (not stored in state, not persisted)
  const terminalRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Restore after hydration, before allowing the initial defaults to be saved.
  useEffect(() => {
    if (persist) {
      try {
        const saved = JSON.parse(sessionStorage.getItem(persistKey) ?? "null");
        if (saved && typeof saved.isTerminalOpen === "boolean" && typeof saved.isTerminalWide === "boolean") {
          dispatch({
            type: "TERMINAL_RESTORE",
            open: saved.isTerminalOpen,
            wide: saved.isTerminalWide,
          });
        }
      } catch {
        // Keep the default layout when storage is corrupt or unavailable.
      }
    }
    setTerminalRestored(true);
  }, [persist, persistKey]);

  useEffect(() => {
    if (!persist || !terminalRestored) return;
    try {
      sessionStorage.setItem(persistKey, JSON.stringify({
        isTerminalOpen: state.isTerminalOpen,
        isTerminalWide: state.isTerminalWide,
      }));
    } catch {
      // Terminal controls still work when browser storage is unavailable.
    }
  }, [state.isTerminalOpen, state.isTerminalWide, terminalRestored, persist, persistKey]);

  // Action creators
  const actions = useMemo(
    () => ({
      setSelection: (ids: EntityId[]) => dispatch({ type: "SELECT_SET", ids }),
      addSelection: (ids: EntityId[]) => dispatch({ type: "SELECT_ADD", ids }),
      removeSelection: (ids: EntityId[]) => dispatch({ type: "SELECT_REMOVE", ids }),
      clearSelection: () => dispatch({ type: "SELECT_CLEAR" }),
      setSelectedAction: (value: HUDState["selectedAction"]) => dispatch({ type: "ACTION_SET", value }),
      setMeasuring: (value: boolean) => dispatch({ type: "MEASURE_SET", value }),

      setPanel: (key: keyof HUDPanels, value: boolean) => dispatch({ type: "PANEL_SET", key, value }),
      togglePanel: (key: keyof HUDPanels) => dispatch({ type: "PANEL_TOGGLE", key }),

      setHovered: (entity: Entity | null) => dispatch({ type: "HOVER_SET", entity }),
      setTooltip: (text: string | null) => dispatch({ type: "TOOLTIP_SET", text }),
      setApp: (app: Application | null) => dispatch({ type: "APP_SET", app }),
      clearApp: (app: Application) => dispatch({ type: "APP_CLEAR", app }),
      setCamera: (camera: Container | null) => dispatch({ type: "CAMERA_SET", camera }),

      // Terminal
      setTerminalOpen: (open: boolean) => dispatch({ type: "TERMINAL_SET_OPEN", open }),
      toggleTerminal: () => dispatch({ type: "TERMINAL_TOGGLE" }),
      toggleTerminalWidth: () => dispatch({ type: "TERMINAL_TOGGLE_WIDTH" }),
      setTerminalInput: (value: string) => dispatch({ type: "TERMINAL_SET_INPUT", value }),
      pushCommandHistory: (entry: CommandHistory) => dispatch({ type: "TERMINAL_PUSH_HISTORY", entry }),
      pushMessageLog: (entry: MessageLogEntry) => dispatch({ type: "MESSAGE_LOG_PUSH", entry }),
    }),
    []
  );

  // Selectors
  const selectors = useMemo(
    () => ({
      hasSelection: state.selectedEntities.length > 0,
      selectionCount: state.selectedEntities.length,
      isSelected: (id: EntityId) => state.selectedSet.has(id),
      selectedAction: state.selectedAction,
      isMeasuring: state.isMeasuring,
      selectedEntities: state.selectedEntities,
      firstSelectedId: state.selectedEntities.length > 0 ? state.selectedEntities[0]! : null,
      isPanelOpen: (key: keyof HUDPanels) => !!state.panels[key],
      // Terminal
      isTerminalOpen: state.isTerminalOpen,
      isTerminalWide: state.isTerminalWide,
      currentCommand: state.currentCommand,
      commandHistory: state.commandHistory,
      hoveredEntity: state.hoveredEntity,
      app: state.app,
      camera: state.camera,
    }),
    [
      state.selectedEntities.length,
      state.selectedSet,
      state.selectedAction,
      state.isMeasuring,
      state.selectedEntities,
      state.panels,
      state.isTerminalOpen,
      state.isTerminalWide,
      state.currentCommand,
      state.commandHistory,
      state.hoveredEntity,
      state.app,
      state.camera
    ]
  );

  const value = useMemo<HUDContextValue>(
    () => ({ state, dispatch, actions, selectors, refs: { terminalRef, inputRef } }),
    [state, actions, selectors]
  );

  return <HUDContext.Provider value={value}>{children}</HUDContext.Provider>;
}

//
// Hook
//
export function useHUD() {
  const ctx = useContext(HUDContext);
  if (!ctx) {
    throw new Error("useHUD must be used within a HUDProvider");
  }
  return ctx;
}
