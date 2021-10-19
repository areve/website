import {
  white, black, parseRef, toRef, colorOf, pieceAt,
  colorAt, blackAt, whiteAt, emptyAt, moveBy,
  moveTo, pieceHasMoved, findPiece,
  parseMove, moveToString, movesAreEqual, applyMove,
  refsAreEqual
} from './chess-core'

function getMovesInDirection (board: any, from: any, diff: any, singleStep?: any) {
  const moves = [] as any
  const {x: dx, y: dy} = parseRef(diff)
  const color = colorAt(board, from)
  let {x: ix, y: iy} = parseRef(from)
  while (true) {
    ix = ix + dx
    iy = iy + dy
    if (ix > 7 || iy > 7 || ix < 0 || iy < 0) break
    if (canLandOn(board, color, [ix, iy])) moves.push(moveTo(from, [ix, iy]))
    if (singleStep) break
    if (!canPassThrough(board, [ix, iy])) break
  }
  return moves
}

function canLandOn (board: any, color: any, ref: any) {
  return emptyAt(board, ref) || colorAt(board, ref) !== color
}

function canPassThrough (board: any, ref: any) {
  return emptyAt(board, ref)
}

function getMovesFrom (board: any, log: any, ref: any) {
  const moves = [] as any
  moves.push(...getWhitePawnThreats(board, log, ref))
  moves.push(...getWhitePawnMoves(board, ref))
  moves.push(...getBlackPawnThreats(board, log, ref))
  moves.push(...getBlackPawnMoves(board, ref))
  moves.push(...getRookThreats(board, ref))
  moves.push(...getQueenThreats(board, ref))
  moves.push(...getBishopThreats(board, ref))
  moves.push(...getKnightThreats(board, ref))
  moves.push(...getKingThreats(board, ref))
  moves.push(...getKingMoves(board, log, ref))
  return moves
}

function getThreatsFrom (board: any, log: any, ref: any) {
  const moves = [] as any
  moves.push(...getWhitePawnThreats(board, log, ref))
  moves.push(...getBlackPawnThreats(board, log, ref))
  moves.push(...getRookThreats(board, ref))
  moves.push(...getQueenThreats(board, ref))
  moves.push(...getBishopThreats(board, ref))
  moves.push(...getKnightThreats(board, ref))
  moves.push(...getKingThreats(board, ref))
  return moves
}

function getWhitePawnThreats (board: any, log: any, from: any) {
  const moves = [] as any as any
  const piece = pieceAt(board, from)
  if (piece !== 'P') return moves

  const {x, y} = parseRef(from)

  if (x > 0 && blackAt(board, [x - 1, y + 1])) {
    if (y === 6) {
      moves.push(moveBy(from, [-1, 1], 'Q'))
      moves.push(moveBy(from, [-1, 1], 'R'))
      moves.push(moveBy(from, [-1, 1], 'B'))
      moves.push(moveBy(from, [-1, 1], 'N'))
    } else {
      moves.push(moveBy(from, [-1, 1]))
    }
  }
  if (x < 7 && blackAt(board, [x + 1, y + 1])) {
    if (y === 6) {
      moves.push(moveBy(from, [1, 1], 'Q'))
      moves.push(moveBy(from, [1, 1], 'R'))
      moves.push(moveBy(from, [1, 1], 'B'))
      moves.push(moveBy(from, [1, 1], 'N'))
    } else {
      moves.push(moveBy(from, [1, 1]))
    }
  }

  if (log && log.length) {
    const lastMove = log[log.length - 1]
    const enPassantRightMove = moveBy([x + 1, y + 2], [0, -2])
    const enPassantLeftMove = moveBy([x - 1, y + 2], [0, -2])
    if (pieceAt(board, [x + 1, y]) === 'p' &&
        movesAreEqual(lastMove, enPassantRightMove)) {
      moves.push(moveBy(from, [1, 1]))
    }
    if (pieceAt(board, [x - 1, y]) === 'p' &&
        movesAreEqual(lastMove, enPassantLeftMove)) {
      moves.push(moveBy(from, [-1, 1]))
    }
  }

  return moves
}

function getWhitePawnMoves (board: any, from: any) {
  const moves = [] as any
  const piece = pieceAt(board, from)
  if (piece !== 'P') return moves
  const {x, y} = parseRef(from)

  if (emptyAt(board, [x, y + 1])) {
    if (y === 6) {
      moves.push(moveBy(from, [0, 1], 'Q'))
      moves.push(moveBy(from, [0, 1], 'R'))
      moves.push(moveBy(from, [0, 1], 'B'))
      moves.push(moveBy(from, [0, 1], 'N'))
    } else {
      moves.push(moveBy(from, [0, 1]))
    }
  }

  if (y === 1 &&
      emptyAt(board, [x, y + 1]) &&
      emptyAt(board, [x, y + 2])) {
    moves.push(moveBy(from, [0, 2]))
  }

  return moves
}

function getBlackPawnThreats (board: any, log: any, from: any) {
  const moves = [] as any
  const piece = pieceAt(board, from)
  if (piece !== 'p') return moves

  const {x, y} = parseRef(from)

  if (x > 0 && whiteAt(board, [x - 1, y - 1])) {
    if (y === 1) {
      moves.push(moveBy(from, [-1, -1], 'Q'))
      moves.push(moveBy(from, [-1, -1], 'R'))
      moves.push(moveBy(from, [-1, -1], 'B'))
      moves.push(moveBy(from, [-1, -1], 'N'))
    } else {
      moves.push(moveBy(from, [-1, -1]))
    }
  }
  if (x < 7 && whiteAt(board, [x + 1, y - 1])) {
    if (y === 1) {
      moves.push(moveBy(from, [1, -1], 'Q'))
      moves.push(moveBy(from, [1, -1], 'R'))
      moves.push(moveBy(from, [1, -1], 'B'))
      moves.push(moveBy(from, [1, -1], 'N'))
    } else {
      moves.push(moveBy(from, [1, -1]))
    }
  }

  if (log && log.length) {
    const lastMove = log[log.length - 1]
    const enPassantRightMove = moveBy([x + 1, y - 2], [0, 2])
    const enPassantLeftMove = moveBy([x - 1, y - 2], [0, 2])
    if (pieceAt(board, [x + 1, y]) === 'P' &&
        movesAreEqual(lastMove, enPassantRightMove)) {
      moves.push(moveBy(from, [1, -1]))
    }
    if (pieceAt(board, [x - 1, y]) === 'P' &&
    movesAreEqual(lastMove, enPassantLeftMove)) {
      moves.push(moveBy(from, [-1, -1]))
    }
  }

  return moves
}

function getBlackPawnMoves (board: any, from: any) {
  const moves = [] as any
  const piece = pieceAt(board, from)
  if (piece !== 'p') return moves

  const {x, y} = parseRef(from)

  if (emptyAt(board, [x, y - 1])) {
    if (y === 1) {
      moves.push(moveBy(from, [0, -1], 'Q'))
      moves.push(moveBy(from, [0, -1], 'R'))
      moves.push(moveBy(from, [0, -1], 'B'))
      moves.push(moveBy(from, [0, -1], 'N'))
    } else {
      moves.push(moveBy(from, [0, -1]))
    }
  }

  if (y === 6 &&
      emptyAt(board, [x, y - 1]) &&
      emptyAt(board, [x, y - 2])) {
    moves.push(moveBy(from, [0, -2]))
  }

  return moves
}

function getRookThreats (board: any, from: any) {
  const moves = [] as any
  const piece = pieceAt(board, from)
  if (piece !== 'r' && piece !== 'R') return moves
  moves.push(...getMovesInDirection(board, from, [1, 0]))
  moves.push(...getMovesInDirection(board, from, [-1, 0]))
  moves.push(...getMovesInDirection(board, from, [0, 1]))
  moves.push(...getMovesInDirection(board, from, [0, -1]))
  return moves
}

function getQueenThreats (board: any, from: any) {
  const moves = [] as any
  const piece = pieceAt(board, from)
  if (piece !== 'q' && piece !== 'Q') return moves
  moves.push(...getMovesInDirection(board, from, [1, 0]))
  moves.push(...getMovesInDirection(board, from, [-1, 0]))
  moves.push(...getMovesInDirection(board, from, [0, 1]))
  moves.push(...getMovesInDirection(board, from, [0, -1]))
  moves.push(...getMovesInDirection(board, from, [1, 1]))
  moves.push(...getMovesInDirection(board, from, [-1, -1]))
  moves.push(...getMovesInDirection(board, from, [1, -1]))
  moves.push(...getMovesInDirection(board, from, [-1, 1]))
  return moves
}

function getBishopThreats (board: any, from: any) {
  const moves = [] as any
  const piece = pieceAt(board, from)
  if (piece !== 'b' && piece !== 'B') return moves
  moves.push(...getMovesInDirection(board, from, [1, 1]))
  moves.push(...getMovesInDirection(board, from, [-1, -1]))
  moves.push(...getMovesInDirection(board, from, [1, -1]))
  moves.push(...getMovesInDirection(board, from, [-1, 1]))
  return moves
}

function getKnightThreats (board: any, from: any) {
  const moves = [] as any
  const piece = pieceAt(board, from)
  if (piece !== 'n' && piece !== 'N') return moves
  moves.push(...getMovesInDirection(board, from, [2, 1], true))
  moves.push(...getMovesInDirection(board, from, [2, -1], true))
  moves.push(...getMovesInDirection(board, from, [-2, 1], true))
  moves.push(...getMovesInDirection(board, from, [-2, -1], true))
  moves.push(...getMovesInDirection(board, from, [1, 2], true))
  moves.push(...getMovesInDirection(board, from, [1, -2], true))
  moves.push(...getMovesInDirection(board, from, [-1, 2], true))
  moves.push(...getMovesInDirection(board, from, [-1, -2], true))
  return moves
}

function getKingThreats (board: any, from: any) {
  const moves = [] as any
  const piece = pieceAt(board, from)
  if (piece !== 'k' && piece !== 'K') return moves
  moves.push(...getMovesInDirection(board, from, [0, 1], true))
  moves.push(...getMovesInDirection(board, from, [0, -1], true))
  moves.push(...getMovesInDirection(board, from, [1, 0], true))
  moves.push(...getMovesInDirection(board, from, [-1, 0], true))
  moves.push(...getMovesInDirection(board, from, [1, 1], true))
  moves.push(...getMovesInDirection(board, from, [1, -1], true))
  moves.push(...getMovesInDirection(board, from, [-1, 1], true))
  moves.push(...getMovesInDirection(board, from, [-1, -1], true))

  return moves
}

function getKingMoves (board: any, log: any, from: any) {
  const moves = [] as any
  const piece = pieceAt(board, from)
  if (piece !== 'k' && piece !== 'K') return moves

  const color = colorOf(piece)
  const opponentColor = color === black ? white : black

  if (!isThreatenedByColor(board, from, opponentColor)) {
    if (color === white) {
      if (!pieceHasMoved(board, log, 'e1', 'K')) {
        if (!pieceHasMoved(board, log, 'h1', 'R') &&
            emptyAt(board, [5, 0]) &&
            emptyAt(board, [6, 0]) &&
            !isThreatenedByColor(board, [5, 0], opponentColor) &&
            !isThreatenedByColor(board, [6, 0], opponentColor)) {
          moves.push(...getMovesInDirection(board, from, [2, 0], true))
        }

        if (!pieceHasMoved(board, log, 'a1', 'R') &&
            emptyAt(board, [1, 0]) &&
            emptyAt(board, [2, 0]) &&
            emptyAt(board, [3, 0]) &&
            !isThreatenedByColor(board, [2, 0], opponentColor) &&
            !isThreatenedByColor(board, [3, 0], opponentColor)) {
          moves.push(...getMovesInDirection(board, from, [-2, 0], true))
        }
      }
    } else {
      if (!pieceHasMoved(board, log, 'e8', 'k')) {
        if (!pieceHasMoved(board, log, 'h8', 'r') &&
            emptyAt(board, [5, 7]) &&
            emptyAt(board, [6, 7]) &&
            !isThreatenedByColor(board, [5, 7], opponentColor) &&
            !isThreatenedByColor(board, [6, 7], opponentColor)) {
          moves.push(...getMovesInDirection(board, from, [2, 0], true))
        }

        if (!pieceHasMoved(board, log, 'a8', 'r') &&
            emptyAt(board, [1, 7]) &&
            emptyAt(board, [2, 7]) &&
            emptyAt(board, [3, 7]) &&
            !isThreatenedByColor(board, [2, 7], opponentColor) &&
            !isThreatenedByColor(board, [3, 7], opponentColor)) {
          moves.push(...getMovesInDirection(board, from, [-2, 0], true))
        }
      }
    }
  }

  return moves
}

function filterMovesIntoCheck (board: any, movesToTry: any) {
  const moves = [] as any
  movesToTry.forEach((move: any) => {
    if (!isMoveIntoCheck(board, move)) moves.push(move)
  })
  return moves
}

function isMoveIntoCheck (board: any, moveRef: any) {
  const move = parseMove(moveRef)
  const boardAfter = applyMove(board, move)
  const color = colorAt(board, move.from)
  return isInCheck(boardAfter, color)
}

function isThreatenedByColor (board: any, ref: any, color: any) {
  const moves = [] as any
  for (let ix = 0; ix <= 7; ix++) {
    for (let iy = 0; iy <= 7; iy++) {
      if (colorAt(board, [ix, iy]) === color) {
        moves.push(...getThreatsFrom(board, [], [ix, iy]))
      }
    }
  }

  return !!moves.find((x: any) => refsAreEqual(x.to, ref))
}

function threatsByPieceTo (board: any, piece: any, ref: any) {
  const moves = [] as any
  for (let ix = 0; ix <= 7; ix++) {
    for (let iy = 0; iy <= 7; iy++) {
      if (pieceAt(board, [ix, iy]) === piece) {
        moves.push(...getThreatsFrom(board, [], [ix, iy]))
      }
    }
  }

  return moves.filter((x: any) => refsAreEqual(x.to, ref))
}

function isInCheck (board: any, color: any) {
  const king = findPiece(board, color === black ? 'k' : 'K')
  // this is to support boards without a king, primarily for tests (perhaps fix the tests?)
  if (king) {
    const opponentColor = color === black ? white : black
    return isThreatenedByColor(board, king, opponentColor)
  } else {
    return false
  }
}

function canMoveOnTurn (board: any, log:any, moveRef: any) {
  const move = parseMove(moveRef)
  const color = colorAt(board, move.from)
  const turn = log.length % 2 ? black : white
  if (color !== turn) return false
  return canMove(board, log, move)
}

function canMove (board: any, log:any, moveRef: any) {
  const move = parseMove(moveRef)
  const moves = getMovesFrom(board, log, move.from)
  const allowedMoves = filterMovesIntoCheck(board, moves)
  return !!allowedMoves.find((x:any) => movesAreEqual(x, move))
}

function getPossibleMoves (board: any, log: any) {
  const color = log.length % 2 ? black : white
  return getPossibleMovesFor(board, color, log)
}

function getPossibleMovesFor (board: any, color: any, log: any) {
  const moves = [] as any
  for (let ix = 0; ix <= 7; ix++) {
    for (let iy = 0; iy <= 7; iy++) {
      if (!emptyAt(board, [ix, iy]) && colorAt(board, [ix, iy]) === color) {
        moves.push(...getMovesFrom(board, log, [ix, iy]))
      }
    }
  }

  const allowedMoves = filterMovesIntoCheck(board, moves)
  return allowedMoves
}

function allPiecesSorted (board: any) {
  return board.join('').replace(/\W/g, '').split('').sort().join('')
}

function analyse (board: any) {
  const blackInCheck = isInCheck(board, black)
  const whiteInCheck = isInCheck(board, white)
  if (blackInCheck && whiteInCheck) return 'Invalid - both in check'
  if (blackInCheck) {
    if (getPossibleMovesFor(board, black, []).length) {
      return 'Black is in check'
    } else {
      return 'Black is checkmated'
    }
  }
  if (whiteInCheck) {
    if (getPossibleMovesFor(board, white, []).length) {
      return 'White is in check'
    } else {
      return 'White is checkmated'
    }
  }

  if (!getPossibleMovesFor(board, black, []).length) {
    return 'Black cannot move'
  }
  if (!getPossibleMovesFor(board, white, []).length) {
    return 'White cannot move'
  }

  if (allPiecesSorted(board) === 'Kk') {
    return 'Stalemate - only kings'
  }

  return null
}

function isPawnPromotion (board: any, moveRef: any) {
  const move = parseMove(moveRef)
  if (pieceAt(board, move.from) === 'P' && move.to.y === 7) {
    return true
  }
  if (pieceAt(board, move.from) === 'p' && move.to.y === 0) {
    return true
  }

  return false
}

export {
  canMoveOnTurn,
  canMove,
  isInCheck,
  applyMove,
  analyse,
  getPossibleMoves,
  toRef,
  parseRef,
  isPawnPromotion,
  moveToString,
  threatsByPieceTo
}
