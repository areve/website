import { createStore } from "vuex";
import { CardGame } from "./components/CardGame/CardGameStore";
import { CardGameState } from "./components/CardGame/CardGameState";

export interface RootState {
  CardGame: CardGameState;
}

export const store = createStore({
  modules: {
    CardGame,
  },
});
