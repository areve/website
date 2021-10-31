<template>
  <section>
    <h1>Card Game</h1>
    <p>This work in progress may become a multiplayer card game.</p>
    <ol>
      <li>Make cards drag and droppable</li>
      <li>User Google firebase</li>
      <li>User Google config</li>
    </ol>
    <button type="button" @click="increment">next {{ count }}</button>
    <button type="button" @click="reset">reset</button>
    <!-- <h2>Players</h2>
    <ul>
      <li
        v-for="player in players"
        :key="player.id"
        class="player"
        @drop="moveCard($event, player.id)"
        @dragover.prevent
        @ ="dragenter($event, player.id)"
      >
        <h3>{{ player.name }}</h3>
        <div
          v-for="card in player.cards"
          :key="card.id"
          draggable="true"
          class="card"
          :class="{ dragging: card.dragging }"
          @dragstart="pickupCard($event, card, player.id)"
          @dragend="dropCard($event, card)"
        >
          {{ card.id }}
        </div>
      </li>
    </ul> -->
    <h2>Stacks</h2>
    <ul class="stacks">
      <li
        v-for="stack in stacks"
        :key="stack.id"
        class="stack"
        @drop="moveCard($event, stack.id)"
        @dragover.prevent
      >
        <h3>{{ stack.id }}</h3>
        <ul class="cards">
        <li
          v-for="card in stack.cards"
          :key="card.id"
          draggable="true"
          class="card"
          :class="{ dragging: card.dragging }"
          @dragstart="pickupCard($event, card, stack.id)"
          @dragend="dropCard($event, card)"
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

export default defineComponent({
  name: "CardGame",
  setup() {
    return {};
  },
  computed: {
    ...mapGetters({
      count: "CardGame/count",
      players: "CardGame/players",
      stacks: "CardGame/stacks",
    }),
  },
  methods: {
    increment() {
      this.$store.commit("CardGame/increment");
    },
    dropCard(e: DTDragEvent, card: any) {
      card.dragging = false;
    },
    pickupCard(e: DTDragEvent, card: any, StackId: any) {
      console.log("pickupCard", e);

      card.dragging = true;
      e.dataTransfer.effectAllowed = "move";
      e.dataTransfer.dropEffect = "move";
      e.dataTransfer.setData("card-id", card.id);
      e.dataTransfer.setData("from-stack-id", StackId);
    },
    moveCard(e: DTDragEvent, toStackId: string) {
      const fromStackId = e.dataTransfer.getData("from-stack-id");
      const cardId = e.dataTransfer.getData("card-id");
      this.$store.commit("CardGame/moveCard", {
        fromStackId,
        cardId,
        toStackId,
      });
    },
    ...mapActions({
      reset: "CardGame/reset",
    }),
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
ul.cards ,
ul.stacks {
  padding-left: 0;
}
.stack {
  border: 1px solid #ccc;
  box-shadow: 0.25em 0.25em 0.5em rgba(0, 0, 0, 0.3);
  padding: 0.25em 0.5em;
  margin: 0.5em;
  border-radius: 0.5em;
  list-style: none;
}
</style>
