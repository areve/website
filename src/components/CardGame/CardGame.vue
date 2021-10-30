<template>
  <section>
    <h1>Card Game</h1>
    <p>This work in progress may become a multiplayer card game.</p>

    <h2>Players</h2>
    <ul>
      <li v-for="player in players" :key="player.id">
        <h3>{{ player.name }}</h3>
        <ul>
          <li v-for="card in player.hand" :key="card.id">
            {{ card.id }}
          </li>
        </ul>
      </li>
    </ul>
    <h2>Stacks</h2>
    <ul>
      <li v-for="stack in stacks" :key="stack.id">
        <h3>{{ stack.id }}</h3>
        <ul>
          <li v-for="card in stack.cards" :key="card.id">
            {{ card.id }}
          </li>
        </ul>
      </li>
    </ul>
  </section>
</template>

<script lang="ts">
import { defineComponent } from "vue";

export default defineComponent({
  name: "CardGame",
  setup() {
    return {
      players: [
        {
          id: "alex",
          name: "alex",
          hand: [
            {
              id: "ace-of-hearts",
              faceUp: true,
            },
          ],
        },
        {
          id: "steve",
          name: "steve",
          hand: [
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
    };
  },
});
</script>

<style scoped>
</style>
