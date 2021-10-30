import { createStore } from "vuex";
import { CardGame, CardGameState } from "./components/CardGame/CardGame.store";

export interface RootState {
  CardGame: CardGameState;
}

export const store = createStore({
  modules: {
    CardGame,
  },
});
