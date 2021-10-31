// import { RootState } from "@/store";
// import { ActionContext } from "vuex";
import { CardGameState } from "./CardGameState";

// type Context = ActionContext<CardGameState, RootState>;

export const MOVE_CARD = 'moveCard'
export const GET_CARD_GROUPS = 'getCardGroups'

export const CardGame = {
  namespaced: false,
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
    [MOVE_CARD](
      state: CardGameState,
      {
        fromCardGroupId,
        cardId,
        toCardGroupId,
        toCardId,
      }: {
        fromCardGroupId: string;
        cardId: string;
        toCardGroupId: string;
        toCardId: string;
      }
    ) {
      const fromCards = state.cardGroups.find(
        (x) => x.id === fromCardGroupId
      )!.cards;
      const toCards = state.cardGroups.find((x) => x.id === toCardGroupId)!.cards;
      const fromCardIndex = fromCards.findIndex((x) => cardId === x.id);
      const toCardIndex = toCards.findIndex((x) => toCardId === x.id);
      const cardToMove = fromCards.splice(fromCardIndex, 1)[0];
      toCards.splice(toCardIndex, 0, cardToMove);
    },
  },

  getters: {
    // count: (state: any) => state.count,
    // players: (state: any) => state.players,
    [GET_CARD_GROUPS]: (state: any) => state.cardGroups,
  },
};
