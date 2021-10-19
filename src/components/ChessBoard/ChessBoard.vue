<template>
  <div>
    <table>
      <tr v-for="(row, y) in board" :key="y">
        <td
          v-for="(square, x) in row"
          :key="x"
          :class="getHighlight({ x, y: 7 - y })"
          @click="clickSquare({ x, y: 7 - y })"
        >
          <span v-if="square === 'K'" class="piece">&#9812;</span>
          <span v-else-if="square === 'Q'" class="piece">&#9813;</span>
          <span v-else-if="square === 'R'" class="piece">&#9814;</span>
          <span v-else-if="square === 'B'" class="piece">&#9815;</span>
          <span v-else-if="square === 'N'" class="piece">&#9816;</span>
          <span v-else-if="square === 'P'" class="piece">&#9817;</span>
          <span v-else-if="square === 'k'" class="piece">&#9818;</span>
          <span v-else-if="square === 'q'" class="piece">&#9819;</span>
          <span v-else-if="square === 'r'" class="piece">&#9820;</span>
          <span v-else-if="square === 'b'" class="piece">&#9821;</span>
          <span v-else-if="square === 'n'" class="piece">&#9822;</span>
          <span v-else-if="square === 'p'" class="piece">&#9823;</span>
          <span v-else-if="square === '/' || square === ' '" />
          <span v-else class="piece">{{ square }}</span>
        </td>
      </tr>
    </table>
  </div>
</template>

<script>
/* eslint-disable */
export default {
  props: ["board", "highlight", "selected"],
  data() {
    return {};
  },
  methods: {
    clickSquare(ref) {
      this.$emit("clickSquare", ref);
    },
    getHighlight(ref) {
      const result = {};
      if (this.highlight) {
        this.highlight.forEach((coord) => {
          if (coord.x === ref.x && coord.y === ref.y) {
            result.highlight = true;
          }
        });
      }
      if (
        this.selected &&
        this.selected.x === ref.x &&
        this.selected.y === ref.y
      ) {
        result.selected = true;
      }
      return result;
    },
  },
};
</script>

<style scoped>
tr:nth-child(even) td:nth-child(odd),
tr:nth-child(odd) td:nth-child(even) {
  background-color: #ddd;
}
td {
  cursor: pointer;
  border: 2px solid #000;
  background-color: #fff;
  padding: 0.5em;
  width: 3em;
  height: 3em;
}
td.highlight {
  background-color: #fc0;
}
td.selected {
  background-color: #bbf;
}
td.highlight {
  background-color: #fc0;
}
td.selected {
  background-color: #bbf;
}
.piece {
  font-size: 2em;
  position: absolute;
  line-height: 1em;
}
</style>
