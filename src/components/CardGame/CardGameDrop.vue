<template>
  <div @drop="onDrop" @dragover.prevent @dragenter.prevent>
    <slot />
  </div>
</template>

<script lang="ts">
type DTDragEvent = DragEvent & { dataTransfer?: DataTransfer };
import { defineComponent } from "vue";
import { CardDraggedInfo, CardDroppedInfo } from "./lib/CardGameTypes";

export default defineComponent({
  name: "CardGameDrop",
  props: {
    cardGroupId: {
      type: String,
     required: true
    },
    cardId: {
      type: String,
     required: false    },
  },
  setup() {
    return {};
  },
  methods: {
    onDrop(e: DTDragEvent) {
      e.stopImmediatePropagation()
      const data: CardDraggedInfo & CardDroppedInfo = JSON.parse(e.dataTransfer.getData("data"));
      data.toCardGroupId = this.cardGroupId
      data.toCardId = this.cardId
      this.$emit("drop", data);
    },
  },
});
</script>

<style scoped>
</style>
