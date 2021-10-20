
<template>
  <section>
    <h1>Chess</h1>

    <p>
      Chess using a vue chessboard component. There is validation that allows
      only moves according to rules. The computer only plays random moves. The
      game log does not show check or checkmate.
    </p>

    <p>
      Writing this program was an exercise in
      <abbr title="Test Driven Development">TDD</abbr> and Functional
      Programming using <a href="https://facebook.github.io/jest/">Jest</a>.
    </p>

    <h2>
      <span v-if="!status">{{ turn }} to play</span>
      <span v-if="status">{{ status }}</span>
    </h2>

    <chess-board
      :highlight="highlight"
      :selected="selected"
      :board="boardRender"
      @clickSquare="clickSquare"
    />
    <div
      :aria-hidden="!showPromoteToDialog"
      :class="{ show: showPromoteToDialog }"
      class="modal"
      tabindex="-1"
      role="dialog"
    >
      <fieldset>
        <div class="promote-dialog">
          <p>Promote to?</p>
          <button type="button" @click="promoteTo('Q')">&#9813;</button>
          <wbr />
          <button type="button" @click="promoteTo('R')">&#9814;</button>
          <wbr />
          <button type="button" @click="promoteTo('B')">&#9815;</button>
          <wbr />
          <button type="button" @click="promoteTo('N')">&#9816;</button>
        </div>
        <button
          class="negative"
          type="button"
          data-dismiss="modal"
          aria-label="Close"
          @click="promoteTo()"
        >
          &times;
        </button>
      </fieldset>
    </div>

    <fieldset>
      <label>
        <input v-model="aiPlaysBlack" type="checkbox" @change="actNow" />
        Computer plays black
      </label>

      <label>
        <input v-model="aiPlaysWhite" type="checkbox" @change="actNow" />
        Computer plays white
      </label>

      <label>
        <input v-model="autoRestart" type="checkbox" @change="actNow" />
        Start new game automatically
      </label>

      <label>
        <input v-model="turnDelay" type="checkbox" @change="actNow" />
        Turn delay
      </label>
    </fieldset>
    <fieldset>
      <label for="move">Move</label>
      <input
        id="move"
        v-model="move"
        type="text"
        placeholder="Move e.g. e2-e4"
      />
      <button type="button" @click="go(move)">Go</button>
      <button type="button" @click="reset()">Reset</button>
    </fieldset>
    <pre>{{ boardString }}</pre>
    <p>Move {{ moveCount }}</p>
    <p>Game log: {{ gameLog }}</p>
  </section>
</template>

<script lang="ts">
import ChessBoard from "./ChessBoard.vue";
import * as chess from "./lib/chess";

import { defineComponent } from "vue";
export default defineComponent({
  name: "Chess",
  components: { ChessBoard },
  data() {
    return {
      move: "",
      board: [] as any,
      selected: null,
      log: [] as any,
      humanLog: [] as any,
      playRandom: false,
      status: "" as any,
      aiPlaysBlack: false,
      aiPlaysWhite: false,
      autoRestart: false,
      turnDelay: false,
      gameOver: false,
      showPromoteToDialog: false,
      timeout: null as any,
    };
  },
  computed: {
    moveCount() {
      return ~~(this.log.length / 2) + 1;
    },
    boardRender() {
      return this.board.map((x) => x.replace(/\./g, " ").split(""));
    },
    boardString() {
      return this.board.join("\n");
    },
    gameLog() {
      const result = [];
      let i = 0;
      while (this.humanLog.length > i) {
        const white = this.humanLog[i];
        const black = this.humanLog.length > i + 1 ? this.humanLog[i + 1] : "";
        const turn = ~~(i / 2) + 1;
        result.push(`${turn}. ${white} ${black}\n`);
        i += 2;
      }
      return result.join("");
    },
    turn() {
      return this.log.length % 2 ? "black" : "white";
    },
    highlight() {
      const result = [];
      if (this.log.length) {
        const last = chess.parseMove(this.log[this.log.length - 1]);
        result.push(last.from);
        result.push(last.to);
      }
      return result;
    },
  },
  mounted() {
    this.reset();
  },
  methods: {
    clickSquare(ref: any) {
      if (this.selected === null) {
        this.move = chess.toRef(ref) + "-";
        this.selected = ref;
      } else {
        this.move = this.move + chess.toRef(ref);
        if (chess.isPawnPromotion(this.board, this.move)) {
          this.showPromoteToDialog = true;
        } else {
          this.go(this.move);
        }
      }
    },
    promoteTo(piece: any) {
      this.showPromoteToDialog = false;
      if (piece) {
        this.move = this.move + "=" + piece;
        this.go(this.move);
      } else {
        this.move = "";
        this.selected = null;
      }
    },
    go(moveRef: any) {
      const move = chess.parseMove(moveRef);
      if (chess.canMoveOnTurn(this.board, this.log, move)) {
        this.humanLog.push(
          chess.logMove(this.board, move) ||
            chess.moveToString(move).toUpperCase()
        );
        this.board = chess.applyMove(this.board, move);
        this.log.push(move);
        this.status = chess.analyse(this.board);
        if (/^Stalemate/.test(this.status)) {
          this.gameOver = true;
        }
      }
      this.move = "";
      this.selected = null;
      clearTimeout(this.timeout);
      this.timeout = setTimeout(
        () => {
          this.act();
        },
        this.turnDelay ? 1000 : 0
      );
    },
    reset() {
      this.board = [
        "rnbqkbnr",
        "pppppppp",
        "........",
        "........",
        "........",
        "........",
        "PPPPPPPP",
        "RNBQKBNR",
      ];
      this.log = [];
      this.humanLog = [];
      this.status = null;
      this.gameOver = false;
      this.act();
    },
    act() {
      if (!this.gameOver) {
        if (
          (this.turn === "white" && this.aiPlaysWhite) ||
          (this.turn === "black" && this.aiPlaysBlack)
        ) {
          const move = chess.chooseMove(this.board, this.log);
          if (move === null) {
            this.gameOver = true;
          } else {
            this.go(move);
          }
        }
      }

      if (this.gameOver && this.autoRestart) {
        const delay = /^Stalemate/.test(this.status) ? 1000 : 10000;
        clearTimeout(this.timeout);
        this.timeout = setTimeout(() => {
          if (!this.autoRestart) return;
          this.reset();
        }, delay);
      }
    },
    actNow() {
      clearTimeout(this.timeout);
      this.act();
    },
  },
});
</script>

<style scoped>
.modal {
  visibility: hidden;
  position: fixed;
  top: -9999px;
  left: 0;
  opacity: 0;
  width: 100%;
  height: 100%;
  transition: opacity 0.3s;
  z-index: 100;
}
.modal > * {
  background-color: white;
  position: relative;
  padding: 1em;
  display: table;
  top: 25%;
  margin: auto auto;
  width: fit-content;
}

.modal:before {
  content: " ";
  position: fixed;
  left: 0;
  top: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.5);
}

.modal.show {
  top: 0;
  visibility: visible;
  opacity: 1;
}

.modal [aria-label="Close"] {
  float: right;
  position: absolute;
  top: 1em;
  right: 1em;
}
</style>
