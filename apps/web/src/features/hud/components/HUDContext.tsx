// hud/HUDContext.tsx
import React, {
  createContext,
  useContext,
  useMemo,
  useReducer,
  useEffect,
  useRef,
  ReactNode,
  Dispatch,
} from "react";

import type { Application, Container } from "pixi.js";
import type { Entity } from "@/features/gamestate/world";
//
// Types
//
export type EntityId = string;

export type Resources = {
  gold: number;
  wood: number;
  stone: number;
  [k: string]: number; // extensible
};

export type CommandHistory = {
  command: string;
  output: string;
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
  selectedAction: "Move" | null;   // current command mode (M to set Move)
  resources: Resources;
  panels: HUDPanels;
  // Misc ephemeral HUD data
  hoveredEntity: Entity | null;
  tooltip?: string | null;
  // Terminal state
  isTerminalOpen: boolean;
  currentCommand: string;
  commandHistory: CommandHistory[];
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
  resources: { gold: 0, wood: 0, stone: 0 },
  panels: {
    minimapOpen: true,
    inventoryOpen: false,
    productionOpen: false,
    techTreeOpen: false,
  },
  hoveredEntity: null,
  tooltip: null,
  isTerminalOpen: true,
  currentCommand: "",
  commandHistory: [
    { command: "", output: "BitWars Terminal v1.0.0\nType 'help' for available commands.\n" },
  ],
  app: null,
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
  | { type: "RES_SET"; patch: Partial<Resources> }                // set/patch resource values
  | { type: "RES_DELTA"; delta: Partial<Resources> }              // increment/decrement resources
  | { type: "PANEL_SET"; key: keyof HUDPanels; value: boolean }
  | { type: "PANEL_TOGGLE"; key: keyof HUDPanels }
  | { type: "HOVER_SET"; entity: Entity | null }
  | { type: "TOOLTIP_SET"; text: string | null }
  | { type: "APP_SET"; app: Application }
  | { type: "CAMERA_SET"; camera: Container }
  // Terminal actions
  | { type: "TERMINAL_SET_OPEN"; open: boolean }
  | { type: "TERMINAL_TOGGLE" }
  | { type: "TERMINAL_SET_INPUT"; value: string }
  | { type: "TERMINAL_PUSH_HISTORY"; entry: CommandHistory }
  | { type: "HYDRATE"; state: HUDState };                         // for persistence restore

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
      return { ...state, selectedAction: action.value };

    case "RES_SET": {
      const next: Resources = { ...state.resources };
      for (const [k, v] of Object.entries(action.patch)) {
        if (typeof v === "number") {
          next[k] = v;
        }
      }
      return { ...state, resources: next };
    }
    case "RES_DELTA": {
      const next: Resources = { ...state.resources };
      for (const [k, v] of Object.entries(action.delta)) {
        next[k] = (next[k] ?? 0) + (v ?? 0);
      }
      return { ...state, resources: next };
    }

    case "PANEL_SET":
      return { ...state, panels: { ...state.panels, [action.key]: action.value } };

    case "PANEL_TOGGLE":
      return { ...state, panels: { ...state.panels, [action.key]: !state.panels[action.key] } };

    case "HOVER_SET":
      return { ...state, hoveredEntity: action.entity };

    case "TOOLTIP_SET":
      return { ...state, tooltip: action.text };

    case "TERMINAL_SET_OPEN":
      return { ...state, isTerminalOpen: action.open };

    case "TERMINAL_TOGGLE":
      return { ...state, isTerminalOpen: !state.isTerminalOpen };

    case "TERMINAL_SET_INPUT":
      return { ...state, currentCommand: action.value };

    case "TERMINAL_PUSH_HISTORY":
      return { ...state, commandHistory: [...state.commandHistory, action.entry] };

    case "HYDRATE":
      // Rebuild Set from plain array if coming from JSON
      return {
        ...action.state,
        selectedSet: new Set(action.state.selectedEntities),
      };

    case "APP_SET":
      return { ...state, app: action.app };

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
    setResources: (patch: Partial<Resources>) => void;
    deltaResources: (delta: Partial<Resources>) => void;
    setPanel: (key: keyof HUDPanels, value: boolean) => void;
    togglePanel: (key: keyof HUDPanels) => void;
    setHovered: (entity: Entity | null) => void;
    setTooltip: (text: string | null) => void;
    // Terminal
    setTerminalOpen: (open: boolean) => void;
    toggleTerminal: () => void;
    setTerminalInput: (value: string) => void;
    pushCommandHistory: (entry: CommandHistory) => void;
    setApp: (app: Application) => void;
    setCamera: (camera: Container) => void;
  };
  selectors: {
    hasSelection: boolean;
    selectionCount: number;
    isSelected: (id: EntityId) => boolean;
    selectedAction: HUDState["selectedAction"];
    selectedEntities: EntityId[];
    firstSelectedId: EntityId | null;
    isPanelOpen: (key: keyof HUDPanels) => boolean;
    getResource: (key: keyof Resources) => number;
    // Terminal
    isTerminalOpen: boolean;
    currentCommand: string;
    commandHistory: CommandHistory[];
    camera: Container | null;
    hoveredEntity: Entity | null
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
  persistKey?: string; // e.g., "bitwars_hud"
  persist?: boolean;   // default false
};

export function HUDProvider({ children, persistKey = "hud", persist = false }: HUDProviderProps) {
  const [state, dispatch] = useReducer(reducer, defaultState);

  // Refs that we expose via context (not stored in state, not persisted)
  const terminalRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // (Optional) Load from sessionStorage once
  useEffect(() => {
    if (!persist) return;
    try {
      const raw = sessionStorage.getItem(persistKey);
      if (raw) {
        const parsed = JSON.parse(raw) as HUDState;
        dispatch({ type: "HYDRATE", state: parsed });
      }
    } catch {
      // ignore bad payloads
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [persist, persistKey]);

  // (Optional) Save to sessionStorage on changes
  useEffect(() => {
    if (!persist) return;
    const serializable: HUDState = {
      ...state,
      selectedSet: undefined as any, // omit; we rebuild from selectedEntities
    };
    // Reinsert selectedSet as array’s Set reconstruction will happen in HYDRATE
    const toSave = { ...serializable, selectedSet: undefined };
    sessionStorage.setItem(persistKey, JSON.stringify({ ...toSave, selectedSet: undefined }));
  }, [state, persist, persistKey]);

  // Action creators
  const actions = useMemo(
    () => ({
      setSelection: (ids: EntityId[]) => dispatch({ type: "SELECT_SET", ids }),
      addSelection: (ids: EntityId[]) => dispatch({ type: "SELECT_ADD", ids }),
      removeSelection: (ids: EntityId[]) => dispatch({ type: "SELECT_REMOVE", ids }),
      clearSelection: () => dispatch({ type: "SELECT_CLEAR" }),
      setSelectedAction: (value: HUDState["selectedAction"]) => dispatch({ type: "ACTION_SET", value }),

      setResources: (patch: Partial<Resources>) => dispatch({ type: "RES_SET", patch }),
      deltaResources: (delta: Partial<Resources>) => dispatch({ type: "RES_DELTA", delta }),

      setPanel: (key: keyof HUDPanels, value: boolean) => dispatch({ type: "PANEL_SET", key, value }),
      togglePanel: (key: keyof HUDPanels) => dispatch({ type: "PANEL_TOGGLE", key }),

      setHovered: (entity: Entity | null) => dispatch({ type: "HOVER_SET", entity }),
      setTooltip: (text: string | null) => dispatch({ type: "TOOLTIP_SET", text }),
      setApp: (app: Application) => dispatch({ type: "APP_SET", app }),
      setCamera: (camera: Container) => dispatch({ type: "CAMERA_SET", camera }),

      // Terminal
      setTerminalOpen: (open: boolean) => dispatch({ type: "TERMINAL_SET_OPEN", open }),
      toggleTerminal: () => dispatch({ type: "TERMINAL_TOGGLE" }),
      setTerminalInput: (value: string) => dispatch({ type: "TERMINAL_SET_INPUT", value }),
      pushCommandHistory: (entry: CommandHistory) => dispatch({ type: "TERMINAL_PUSH_HISTORY", entry }),
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
      selectedEntities: state.selectedEntities,
      firstSelectedId: state.selectedEntities.length > 0 ? state.selectedEntities[0]! : null,
      isPanelOpen: (key: keyof HUDPanels) => !!state.panels[key],
      getResource: (key: keyof Resources) => state.resources[key] ?? 0,
      // Terminal
      isTerminalOpen: state.isTerminalOpen,
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
      state.selectedEntities,
      state.panels,
      state.resources,
      state.isTerminalOpen,
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
