// import { RootState } from "@/store";
// import { ActionContext } from "vuex";
import { CardGameState } from "./CardGameState";

// type Context = ActionContext<CardGameState, RootState>;

export const CardGame = {
  namespaced: true,
  state: (): CardGameState => ({
    // players: [
    //   {
    //     id: "alex",
    //     name: "alex",
    //     cards: [
    //       {
    //         id: "ace-of-hearts",
    //         faceUp: true,
    //       },
    //     ],
    //   },
    //   {
    //     id: "steve",
    //     name: "steve",
    //     cards: [
    //       {
    //         id: "9-of-spades",
    //         faceUp: true,
    //       },
    //       {
    //         id: "8-of-spades",
    //         faceUp: true,
    //       },
    //     ],
    //   },
    // ],
    cardGroups: [
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
  }),

  actions: {
    // reset({ commit, state }: Context) {
    //   if (state.count === 0) return;
    //   commit("setCount", 0);
    // },
  },

  mutations: {
    // setCount(state: CardGameState, value: number) {
    //   state.count = value;
    // },
    moveCard (state: CardGameState, { fromGroupId, cardId, toGroupId }: { fromGroupId: string, cardId: string, toGroupId: string }) {
      const fromCards = state.cardGroups.find((x) => x.id === fromGroupId)!.cards;
      const toCards = state.cardGroups.find((x) => x.id === toGroupId)!.cards;
      const cardIndex = fromCards.findIndex(x => cardId === x.id)
      const cardToMove = fromCards.splice(cardIndex, 1)[0]
      toCards.unshift(cardToMove)
    }
  },

  getters: {
    // count: (state: any) => state.count,
    // players: (state: any) => state.players,
    cardGroups: (state: any) => state.cardGroups,
  },
};
