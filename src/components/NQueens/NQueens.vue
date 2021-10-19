
<template>
  <section>
    <h1>n-Queens</h1>
    <p>n-Queens is a well known puzzle. This program will solve it but it will get exponentially slower with bigger boards. It works by randomly placing queens in an unprotected space and if there are no more spaces it starts again. Is it possible to write a program that does not slow down exponentially as board size increases?</p>

    <label
      for="input-size">Board size</label>
    <input
      id="input-size"
      v-model="size"
      type="text"
      placeholder="4 to 16 are good numbers"
      aria-label="Board size"
      @keyup.enter="solve">

    <button
      type="button"
      @click="solve">Solve</button>

    <chess-board
      :board="board" />

    <ul>
      <li>attempts: {{ attempts.length }}</li>
    </ul>

    <pre>{{ log }}</pre>

    <p>queens placed : unprotected spaces before queens placed</p>
    <ul>
      <li
        v-for="attempt in attempts"
        :key="attempt.$id">
        {{ attempt.spaces.length + attempt.ok - 1 }}
        :
        {{ attempt.spaces }}
      </li>
    </ul>

  </section>
</template>

<script lang="ts">

import ChessBoard from "./ChessBoard.vue";
import { defineComponent } from "vue";

export default defineComponent({
  name: "NQueens",
  components: { ChessBoard },
  data() {
    return {
      size: 8,
      board: null as any,
      log: "",
      scans: null as any,
      attempts: [] as any,
      message: "sdfsdf"
    };
  },
  mounted() {
    this.solve();
  },
  methods: {
    solve() {
      this.attempts = [];
      this.scans = [];
      var tryRandomSolutionsUntilOneIsFound = () => {
        if (!this.tryOneRandomSolution()) {
          setTimeout(tryRandomSolutionsUntilOneIsFound, 0);
        }
      };
      tryRandomSolutionsUntilOneIsFound();
    },
    tryOneRandomSolution() {
      var posList = [];
      var spaceList = [];
      this.createBoard();
      this.log = "";
      let ok = 1;
      for (var i = 0; i < this.size; i++) {
        let { pos, spaces } = this.randomWhiteSpace();
        posList.push(pos);
        spaceList.push(spaces);
        if (pos) {
          ok &= this.addQueen(pos);
          this.log +=
            "queen: " + pos.x + "," + pos.y + " spaces: " + spaces + "\n";
        } else {
          i = this.size;
          ok = 0;
        }
      }
      this.attempts.push({ attempt: posList, spaces: spaceList, ok });
      return ok;
    },
    randomWhiteSpace() {
      var max = this.size * this.size;
      var spaces = [];
      for (var i = 0; i < max; i++) {
        var x = i % this.size;
        var y = Math.floor(i / this.size);
        if (this.board[y][x] === " ") {
          spaces.push({ x, y });
        }
      }
      var r = ~~(Math.random() * spaces.length);
      return { pos: spaces[r], spaces: spaces.length };
    },
    addQueen(pos: any) {
      var x = pos.x;
      var y = pos.y;
      if (this.board[y][x] === "!") {
        return 0;
      }
      var result = 1;
      for (let i = 0; i < this.size; i++) {
        if (i !== x) {
          result &= this.addThreat(i, y);
        }
      }
      for (let i = 0; i < this.size; i++) {
        if (i !== y) {
          result &= this.addThreat(x, i);
        }
      }
      for (let i = 1; i < this.size; i++) {
        var xx = (x + i) % this.size;
        var yy = (y + i) % this.size;
        if ((xx > x && yy > y) || (xx < x && yy < y))
          result &= this.addThreat(xx, yy);
      }
      for (let i = 1; i < this.size; i++) {
        var xx = (this.size + x - i) % this.size;
        var yy = (y + i) % this.size;
        if ((xx < x && yy > y) || (xx > x && yy < y))
          result &= this.addThreat(xx, yy);
      }
      if (this.board[y][x] === " ") {
        this.board[y][x] = "q";
      } else {
        this.board[y][x] = "X";
        result = 0;
      }
      return result;
    },
    addThreat(x: any, y: any) {
      if (this.board[y][x] === " " || this.board[y][x] === "/") {
        this.board[y][x] = "/";
        return 1;
      }
      this.board[y][x] = "X";
      return 0;
    },
    createBoard() {
      var board = [] as any;
      for (var y = 0; y < this.size; y++) {
        board.push([]);
        for (var x = 0; x < this.size; x++) {
          board[y].push(" ");
        }
      }
      this.board = board;
    }
  }
});
</script>

<style scoped>
</style>
