import { watchSyncEffect, type Ref } from "vue";

type StateCollection = { [key: string]: Ref };

const states: StateCollection = {};

export function usePersistentState(key: string, state: Ref) {
  states[key] = state;

  const loadedValue = window.localStorage.getItem(key);
  if (loadedValue) state.value = JSON.parse(loadedValue);

  watchSyncEffect(() => window.localStorage.setItem(key, JSON.stringify(state.value)));
}
