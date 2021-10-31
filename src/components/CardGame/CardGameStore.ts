export interface CardGameState {
  count: number;
  players: Player[];
  stacks: Stack[];
}

import { RootState } from "@/store";
import { ActionContext } from "vuex";
import { Player, Stack } from "./lib/cards";

type Context = ActionContext<CardGameState, RootState>;

export const CardGame = {
  namespaced: true,
  state: (): CardGameState => ({
    players: [
      {
        id: "alex",
        name: "alex",
        cards: [
          {
            id: "ace-of-hearts",
            faceUp: true,
          },
        ],
      },
      {
        id: "steve",
        name: "steve",
        cards: [
          {
            id: "9-of-spades",
            faceUp: true,
          },
          {
            id: "8-of-spades",
            faceUp: true,
          },
        ],
      },
    ],
    stacks: [
      {
        id: "draw",
        faceUp: false,
        cards: [
          {
            id: "2-of-hearts",
            faceUp: true,
          },
          {
            id: "queen-of-hearts",
            faceUp: true,
          },
        ],
      },
      {
        id: "discard",
        faceUp: true,
        cards: [
          {
            id: "3-of-clubs",
            faceUp: true,
          },
          {
            id: "king-of-diamonds",
            faceUp: true,
          },
        ],
      },
    ],
    count: 0,
  }),

  actions: {
    reset({ commit, state }: Context) {
      if (state.count === 0) return;
      commit("setCount", 0);
    },
  },

  mutations: {
    setCount(state: CardGameState, value: number) {
      state.count = value;
    },
    increment(state: CardGameState) {
      state.count++;
    },
    moveCard (state: CardGameState, { fromStackId, cardId, toStackId }: { fromStackId: string, cardId: string, toStackId: string }) {
      const fromCards = state.stacks.find((x) => x.id === fromStackId)!.cards;
      const toCards = state.stacks.find((x) => x.id === toStackId)!.cards;
      const cardIndex = fromCards.findIndex(x => cardId === x.id)
      const cardToMove = fromCards.splice(cardIndex, 1)[0]
      toCards.unshift(cardToMove)
    }
  },

  getters: {
    count: (state: any) => state.count,
    players: (state: any) => state.players,
    stacks: (state: any) => state.stacks,
  },
};
