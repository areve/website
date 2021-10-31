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
      <li
        v-for="cardGroup in cardGroups"
        :key="cardGroup.id"
        class="cardGroup"
        @drop.stop="moveCard($event, cardGroup.id)"
        @dragover.prevent
      >
        <h3>{{ cardGroup.id }}</h3>
        <ul class="cards">
          <li
            v-for="card in cardGroup.cards"
            :key="card.id"
            draggable="true"
            class="card"
            :class="{ dragging: card.dragging }"
            @dragstart="pickupCard($event, card, cardGroup.id)"
            @dragend="dropCard($event, card)"
            @drop.stop="moveCard($event, cardGroup.id, card.id)"
          >
            {{ card.id }}
          </li>
        </ul>
      </li>
    </ul>
  </section>
</template>

<script lang="ts">
type DTDragEvent = DragEvent & { dataTransfer?: DataTransfer };
import { defineComponent } from "vue";
import { mapGetters, mapActions } from "vuex";
import { GET_CARD_GROUPS, MOVE_CARD } from "./CardGameStore";

export default defineComponent({
  name: "CardGame",
  setup() {
    return {};
  },
  computed: {
    ...mapGetters({
      // count: "CardGame/count",
      // players: "CardGame/players",
      cardGroups: GET_CARD_GROUPS,
    }),
  },
  methods: {
    dropCard(e: DTDragEvent, card: any) {
      card.dragging = false;
    },
    pickupCard(e: DTDragEvent, card: any, cardGroupId: any) {
      card.dragging = true;
      e.dataTransfer.effectAllowed = "move";
      e.dataTransfer.dropEffect = "move";
      e.dataTransfer.setData("card-id", card.id);
      e.dataTransfer.setData("from-card-group-id", cardGroupId);
    },
    moveCard(e: DTDragEvent, toCardGroupId: string, toCardId?: string) {
      const fromCardGroupId = e.dataTransfer.getData("from-card-group-id");
      const cardId = e.dataTransfer.getData("card-id");
      this.$store.commit(MOVE_CARD, {
        fromCardGroupId,
        cardId,
        toCardGroupId,
        toCardId
      });
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
.dragging {
  opacity: 0.1;
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
