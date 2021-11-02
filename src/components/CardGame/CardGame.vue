<template>
  <section>
    <h1>Card Game</h1>
    <p>This work in progress may become a multiplayer card game.</p>
    <ol>
      <li>User Google firebase</li>
      <li>User Google config</li>
      <li>Add players</li>
    </ol>
    <ul class="cardGroups">
      <li v-for="cardGroup in cardGroups" :key="cardGroup.id" class="cardGroup">
        <card-game-drop @drop="moveCard" :cardGroupId="cardGroup.id">
          <h3>{{ cardGroup.id }}</h3>
          <ul class="cards">
            <card-game-drag
              v-for="card in cardGroup.cards"
              :key="card.id"
              :cardId="card.id"
              :cardGroupId="cardGroup.id"
              class="card"
              tag="li"
            >
             <card-game-drop
                @drop="moveCard"
                :cardGroupId="cardGroup.id"
                :cardId="card.id"
              >
                {{ card.id }}
              </card-game-drop>
            </card-game-drag>
          </ul>
        </card-game-drop>
      </li>
    </ul>
  </section>
</template>

<script lang="ts">
import { defineComponent } from "vue";
import { mapGetters } from "vuex";
import { GET_CARD_GROUPS, MOVE_CARD } from "./CardGameStore";
import CardGameDrop from "./CardGameDrop.vue";
import CardGameDrag from "./CardGameDrag.vue";
import { CardDraggedInfo, CardDroppedInfo } from "./lib/CardGameTypes";

export default defineComponent({
  name: "CardGame",
  components: {
    CardGameDrop,
    CardGameDrag,
  },
  setup() {
    return {};
  },
  computed: {
    ...mapGetters({
      cardGroups: GET_CARD_GROUPS,
    }),
  },
  methods: {
    moveCard(cardDraggedInfo: CardDraggedInfo & CardDroppedInfo) {
      this.$store.commit(MOVE_CARD, cardDraggedInfo);
    },
  },
});
</script>

<style scoped>
.card {
  border: 1px solid #ccc;
  box-shadow: 0.25em 0.25em 0.5em rgba(0, 0, 0, 0.3);
  width: 200px;
  margin: 0.5em;
  cursor: move;
  padding: 0.25em 0.5em;
  border-radius: 0.5em;
  list-style: none;
}

ul.cards,
ul.cardGroups {
  padding-left: 0;
}
.cardGroup {
  border: 1px solid #ccc;
  box-shadow: 0.25em 0.25em 0.5em rgba(0, 0, 0, 0.3);
  padding: 0.25em 0.5em;
  margin: 0.5em;
  border-radius: 0.5em;
  list-style: none;
}
</style>
