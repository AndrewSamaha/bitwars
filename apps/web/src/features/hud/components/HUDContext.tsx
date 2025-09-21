// hud/HUDContext.tsx
import React, {
  createContext,
  useContext,
  useMemo,
  useReducer,
  useEffect,
  ReactNode,
  Dispatch,
} from "react";

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
  resources: Resources;
  panels: HUDPanels;
  // Misc ephemeral HUD data
  hoveredEntityId?: EntityId | null;
  tooltip?: string | null;
};

//
// Initial State
//
const defaultState: HUDState = {
  selectedEntities: [],
  selectedSet: new Set(),
  resources: { gold: 0, wood: 0, stone: 0 },
  panels: {
    minimapOpen: true,
    inventoryOpen: false,
    productionOpen: false,
    techTreeOpen: false,
  },
  hoveredEntityId: null,
  tooltip: null,
};

//
// Actions
//
type Action =
  | { type: "SELECT_SET"; ids: EntityId[] }                       // replace selection
  | { type: "SELECT_ADD"; ids: EntityId[] }                       // add to selection
  | { type: "SELECT_REMOVE"; ids: EntityId[] }                    // remove from selection
  | { type: "SELECT_CLEAR" }
  | { type: "RES_SET"; patch: Partial<Resources> }                // set/patch resource values
  | { type: "RES_DELTA"; delta: Partial<Resources> }              // increment/decrement resources
  | { type: "PANEL_SET"; key: keyof HUDPanels; value: boolean }
  | { type: "PANEL_TOGGLE"; key: keyof HUDPanels }
  | { type: "HOVER_SET"; id: EntityId | null }
  | { type: "TOOLTIP_SET"; text: string | null }
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
      return { ...state, hoveredEntityId: action.id };

    case "TOOLTIP_SET":
      return { ...state, tooltip: action.text };

    case "HYDRATE":
      // Rebuild Set from plain array if coming from JSON
      return {
        ...action.state,
        selectedSet: new Set(action.state.selectedEntities),
      };

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
    setResources: (patch: Partial<Resources>) => void;
    deltaResources: (delta: Partial<Resources>) => void;
    setPanel: (key: keyof HUDPanels, value: boolean) => void;
    togglePanel: (key: keyof HUDPanels) => void;
    setHovered: (id: EntityId | null) => void;
    setTooltip: (text: string | null) => void;
  };
  selectors: {
    hasSelection: boolean;
    selectionCount: number;
    isSelected: (id: EntityId) => boolean;
    isPanelOpen: (key: keyof HUDPanels) => boolean;
    getResource: (key: keyof Resources) => number;
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

      setResources: (patch: Partial<Resources>) => dispatch({ type: "RES_SET", patch }),
      deltaResources: (delta: Partial<Resources>) => dispatch({ type: "RES_DELTA", delta }),

      setPanel: (key: keyof HUDPanels, value: boolean) => dispatch({ type: "PANEL_SET", key, value }),
      togglePanel: (key: keyof HUDPanels) => dispatch({ type: "PANEL_TOGGLE", key }),

      setHovered: (id: EntityId | null) => dispatch({ type: "HOVER_SET", id }),
      setTooltip: (text: string | null) => dispatch({ type: "TOOLTIP_SET", text }),
    }),
    []
  );

  // Selectors
  const selectors = useMemo(
    () => ({
      hasSelection: state.selectedEntities.length > 0,
      selectionCount: state.selectedEntities.length,
      isSelected: (id: EntityId) => state.selectedSet.has(id),
      isPanelOpen: (key: keyof HUDPanels) => !!state.panels[key],
      getResource: (key: keyof Resources) => state.resources[key] ?? 0,
    }),
    [state.selectedEntities.length, state.selectedSet, state.panels, state.resources]
  );

  const value = useMemo<HUDContextValue>(
    () => ({ state, dispatch, actions, selectors }),
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
