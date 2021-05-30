<template>
  <section>
    <h1>tic-tac-toe</h1>
    <p>
      A game of noughts and crosses the program plays itself with random moves
      without knowing the rules of the game. It gets feedback and the move is
      applied only. What would the game need to do learn how to win given only
      this feedback?
    </p>
    <div class="board">
      <table>
        <tr v-for="row in game.board" :key="row.$id">
          <td v-for="cell in row" :key="cell.$id">
            <span>{{ cell }}</span>
          </td>
        </tr>
      </table>
    </div>
    <button type="button" @click="playForever">Play</button>
    <p>
      Player1 <strong>{{ player1.happiness }}</strong>
    </p>
    <p>
      Player2 <strong>{{ player2.happiness }}</strong>
    </p>
  </section>
</template>

<script lang="ts">
import { defineComponent } from "vue";

type Piece = "o" | "x";

interface Action {
  action: "wait" | "place";
  piece: Piece;
  x: 0 | 1 | 2;
  y: 0 | 1 | 2;
}

interface Player {
  name: "player1" | "player2";
  happiness: number;
  piece: Piece;
  record: { action: Action; feedback: number }[];
}

export default defineComponent({
  name: "tic-tac-toe",
  components: {},
  data() {
    return {
      game: {
        board: undefined! as string[][],
        turn: 0,
        next: undefined! as Piece,
        gameover: false,
        winner: null as string | null,
      },
      player1: {} as Player,
      player2: {} as Player,
      log: undefined! as {
        player: string;
        action: string;
        feedback: number;
      }[],
      destroying: false,
      timeout: null as number | null,
    };
  },
  beforeUnmount() {
    this.destroying = true;
    if (this.timeout) clearTimeout(this.timeout);
  },
  mounted() {
    this.reset();
  },
  methods: {
    reset() {
      this.game = {
        board: [
          [" ", " ", " "],
          [" ", " ", " "],
          [" ", " ", " "],
        ],
        turn: 0,
        next: this.getRandomOption("x", "o"),
        winner: null,
        gameover: false,
      };
      this.player1 = {
        name: "player1",
        happiness: 0,
        piece: "o",
        record: [],
      } as Player;
      this.player2 = {
        name: "player2",
        happiness: 0,
        piece: "x",
        record: [],
      };
      this.log = [];
    },
    playForever(): void {
      this.reset();
      this.play();
      if (!this.destroying) {
        if (this.timeout) clearTimeout(this.timeout);
        this.timeout = setTimeout(this.playForever, 1000);
      }
    },
    play() {
      while (!this.game.gameover) {
        this.playOne(this.player1, this.getBetterAction);
        this.playOne(this.player2, this.getRandomAction);
      }
    },
    playOne(player: Player, method: Function) {
      const action = method(player);
      const feedback = this.applyAction(action, player);
      this.analyse(action, player, feedback);
      this.log.push({ player: player.name, action, feedback });
    },
    analyse(action: Action, player: Player, feedback: number) {
      player.record.push({ action, feedback });
    },
    getRandomOption(...options: any[]) {
      return options[~~(Math.random() * options.length)];
    },
    getBetterAction(player: Player) {
      if (this.game.next !== player.piece) return { action: "wait" };
      if (this.game.board[1][1] === " ")
        return { action: "place", piece: player.piece, x: 1, y: 1 };
      return this.getRandomAction();
    },
    getRandomAction() {
      const action = this.getRandomOption("wait", "place");
      if (action === "place") {
        const piece = this.getRandomOption("o", "x");
        const x = this.getRandomOption(0, 1, 2);
        const y = this.getRandomOption(0, 1, 2);
        return { action, piece, x, y };
      }
      return { action };
    },
    getFeedback(action: Action, player: Player) {
      let feedback = 0;
      if (player.piece !== action.piece) {
        if (action.action === "wait") {
          feedback += 10;
        } else {
          feedback -= 100;
        }
      } else {
        if (action.action === "place") {
          if (action.piece !== this.game.next) {
            feedback -= 100;
          } else {
            if (this.game.board[action.y][action.x] !== " ") {
              feedback -= 100;
            } else {
              feedback += 10;
            }
          }
        }
      }
      return feedback;
    },
    isGameWon() {
      const b = this.game.board;
      if (b[0][0] !== " " && b[0][0] === b[0][1] && b[0][1] === b[0][2])
        return true;
      if (b[1][0] !== " " && b[1][0] === b[1][1] && b[1][1] === b[1][2])
        return true;
      if (b[2][0] !== " " && b[2][0] === b[2][1] && b[2][1] === b[2][2])
        return true;

      if (b[0][0] !== " " && b[0][0] === b[1][0] && b[1][0] === b[2][0])
        return true;
      if (b[0][1] !== " " && b[0][1] === b[1][1] && b[1][1] === b[2][1])
        return true;
      if (b[0][2] !== " " && b[0][2] === b[1][2] && b[1][2] === b[2][2])
        return true;

      if (b[0][0] !== " " && b[0][0] === b[1][1] && b[1][1] === b[2][2])
        return true;
      if (b[0][2] !== " " && b[0][2] === b[1][1] && b[1][1] === b[2][0])
        return true;
      return false;
    },
    applyAction(action: Action, player: Player) {
      let feedback = this.getFeedback(action, player);
      if (feedback > 0) {
        if (action.action === "place") {
          this.game.board[action.y][action.x] = action.piece;
          this.game.next = this.game.next === "o" ? "x" : "o";
          this.game.turn += 1;

          if (this.game.turn === 9) {
            this.game.gameover = true;
          }

          if (this.isGameWon()) {
            this.game.gameover = true;
            this.game.winner = player.name;
            feedback += 10000;
          }
        }
      }

      player.happiness += feedback;
      return feedback;
    },
  },
});
</script>

<style scoped>
.board {
  --square-size: 3em;
  --border-size: 2px;
}

.board table {
  background-color: transparent;
  border-collapse: collapse;
  font-size: 2em;
  width: calc(var(--square-size) * 3 + var(--border-size) * 4);
  box-shadow: none;
}

.board table td {
  border: var(--border-size) solid #000;
  width: var(--square-size);
  height: var(--square-size);
  line-height: calc(var(--square-size) * 0.8);
  padding: 0;
  text-align: center;
}

.board table td span {
  font-size: 2em;
  color: #999;
}

.board table tr {
  background-color: transparent;
}

.board table tr:first-child td {
  border-top-color: transparent;
}
.board table tr:last-child td {
  border-bottom-color: transparent;
}
.board table tr td:last-child {
  border-right-color: transparent;
}
.board table tr td:first-child {
  border-left-color: transparent;
}
</style>
