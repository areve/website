import {
  canMoveOnTurn,
  canMove,
  isInCheck,
  applyMove,
  analyse,
  getPossibleMoves,
  toRef,
  parseRef,
  isPawnPromotion,
  threatsByPieceTo
} from './chess-validate'

import {
  parseMove,
  moveToString,
  movesAreEqual,
  pieceAt,
  emptyAt
} from './chess-core'

function chooseMove (board: any, log: any) {
  const moves = getPossibleMoves(board, log)
  if (!moves.length) return null
  const move = moves[~~(Math.random() * moves.length)]
  return move
}

function logMove (board: any, moveRef: any) {
  const move = parseMove(moveRef) 
  const piece = pieceAt(board, move.from)
  const capture = emptyAt(board, move.to) ? '' : 'x'

  if (piece === 'P' || piece === 'p') {
    const promotionSuffix = move.promoteTo ? '=' + move.promoteTo : ''
    if (move.from.x === move.to.x) {
      return toRef(move.to) + promotionSuffix
    } else {
      const enPassantSuffix = capture === '' ? 'e.p.' : ''
      return toRef(move.from)![0] + 'x' + toRef(move.to) + promotionSuffix + enPassantSuffix
    }
  }

  if (piece === 'k') {
    if (movesAreEqual(move, 'e8-g8')) return 'O-O'
    if (movesAreEqual(move, 'e8-c8')) return 'O-O-O'
  } else if (piece === 'K') {
    if (movesAreEqual(move, 'e1-g1')) return 'O-O'
    if (movesAreEqual(move, 'e1-c1')) return 'O-O-O'
  }

  const ambiguities = threatsByPieceTo(board, piece, move.to)
  const rankAmbiguities = ambiguities.filter((x: any) => x.from.y === move.from.y)
  const fileAmbiguities = ambiguities.filter((x: any) => x.from.x === move.from.x)

  let disambiguate
  if (fileAmbiguities.length > 1) {
    if (rankAmbiguities.length > 1) {
      disambiguate = toRef(move.from)
    } else {
      disambiguate = toRef(move.from)![1]
    }
  } else {
    if (ambiguities.length > 1) {
      disambiguate = toRef(move.from)![0]
    } else {
      disambiguate = ''
    }
  }

  return piece.toUpperCase() + disambiguate + capture + toRef(move.to)
}

export {
  canMoveOnTurn,
  canMove,
  isInCheck,
  applyMove,
  logMove,
  analyse,
  getPossibleMoves,
  toRef,
  parseRef,
  chooseMove,
  isPawnPromotion,
  parseMove,
  moveToString
}
