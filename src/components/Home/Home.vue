<template>
  <article>
    <h1>challen.info</h1>
    <p>
      I'm making this site and I'm having a play with Vue3,
      <em>(and loving it)</em>. 
      </p>
      <p>The site contains some of the many experiments I've created
      over years, they were converted to typescript when they were
      added into this Vue3 site, as a result some of the typescript isn't 
      as good as it would be if I had originally coded it typescript. 
      </p>
      <p>I think in an Lean and Agile way, this means that each page is a
      micro project or prototype that is complete in some way - although the
      questions it answers are known only to myself. Less is more, the least
      amount of work to achieve the goal is probably the best way.
    </p>
  </article>
</template>

<script lang="ts">
import { defineComponent } from "vue";
export default defineComponent({
  name: "Home",
  setup: () => ({}),
});
</script>

<style scoped>
</style>
  