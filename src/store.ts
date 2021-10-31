import { createStore } from "vuex";
import { CardGame, CardGameState } from "./components/CardGame/CardGameStore";

export interface RootState {
  CardGame: CardGameState;
}

export const store = createStore({
  modules: {
    CardGame,
  },
});
