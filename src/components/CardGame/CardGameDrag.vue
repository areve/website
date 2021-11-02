<script lang="ts">
type DTDragEvent = DragEvent & { dataTransfer?: DataTransfer };
import { defineComponent, ref } from "vue";
import { CardDraggedInfo } from "./lib/CardGameTypes";
import { h } from "vue";

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
    tag: {
      type: String,
      required: false,
      default: 'div'
    },
  },
  setup() {
    return {
      dragging: ref(false),
    };
  },
  render() {
    return h(
      this.tag,
      {
        draggable: true,
        onDragstart: this.pickup,
        onDragend: this.drop,
        class: [{ dragging: this.dragging }],
      },
      this.$slots.default && this.$slots.default()
    );
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
