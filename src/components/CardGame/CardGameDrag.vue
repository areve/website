<template>
  <li
    @dragstart="pickup"
    @dragend="drop"
    draggable="true"
    :class="{ dragging: this.dragging }"
  >
    <slot />
  </li>
</template>

<script lang="ts">
type DTDragEvent = DragEvent & { dataTransfer?: DataTransfer };
import { defineComponent, ref } from "vue";
import { CardDraggedInfo } from "./lib/CardGameTypes";

export default defineComponent({
  name: "CardGameDrag",
  props: {
    cardGroupId: {
      type: String,
      required: true,
    },
    cardId: {
      type: String,
      required: true,
    },
  },
  setup() {
    return {
      dragging: ref(false),
    };
  },
  methods: {
    drop() {
      this.dragging = false;
    },
    pickup(e: DTDragEvent) {
      this.dragging = true;
      const data: CardDraggedInfo = {
        cardId: this.cardId,
        fromCardGroupId: this.cardGroupId,
      };
      e.dataTransfer.effectAllowed = "move";
      e.dataTransfer.dropEffect = "move";
      e.dataTransfer.setData("data", JSON.stringify(data));
    },
  },
});
</script>

<style scoped>
.dragging {
  opacity: 0.1;
}
</style>
