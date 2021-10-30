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
    <h2>Players</h2>
    <ul>
      <li v-for="player in players" :key="player.id">
        <h3>{{ player.name }}</h3>
        <ul>
          <li v-for="card in player.cards" :key="card.id">
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
    ...mapActions({
      reset: "CardGame/reset"
    })
  },
});
</script>

<style scoped>
</style>
