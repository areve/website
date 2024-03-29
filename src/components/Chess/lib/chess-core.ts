const black = 'black'
const white = 'white'

function movesAreEqual (moveRefA: any, moveRefB: any) {
  return moveToString(parseMove(moveRefA)) === moveToString(parseMove(moveRefB))
}

function moveToString (moveRef: any) {
  const move = parseMove(moveRef)
  const promoteSuffix = move.promoteTo ? '=' + move.promoteTo : ''
  return toRef(move.from) + '-' + toRef(move.to) + promoteSuffix
}

function parseMove (moveRef: any) {
  if (typeof moveRef === 'string') {
    const [both, promoteTo] = moveRef.split('=')
    const [from, to] = both.split('-')
    const result = { from: parseRef(from), to: parseRef(to) } as any
    if (promoteTo) {
      result.promoteTo = promoteTo
    }
    return result
  } else {
    return moveRef
  }
}

function moveBy (from: any, diff: any, promoteTo?: any) {
  const {x, y} = parseRef(from)
  const {x: dx, y: dy} = parseRef(diff)
  const result = {
    from: parseRef(from),
    to: parseRef([x + dx, y + dy])
  } as any
  if (promoteTo) result.promoteTo = promoteTo
  return result
}

function moveTo (from: any, to: any) {
  return {
    from: parseRef(from),
    to: parseRef(to)
  }
}

function parseRef (ref: any) {
  if (typeof ref === 'string') {
    const alphaToNumeric = {
      a: 0, b: 1, c: 2, d: 3, e: 4, f: 5, g: 6, h: 7
    } as any
    return { x: alphaToNumeric[ref[0]], y: ref[1] as any - 1 }
  } else if (Array.isArray(ref)) {
    return {x: ref[0], y: ref[1]}
  } else {
    return ref
  }
}

function refsAreEqual (refA: any, refB: any) {
  const a = parseRef(refA)
  const b = parseRef(refB)
  return toRef(a) === toRef(b)
}

function toRef (ref: any) {
  if (ref === null) return null
  const numericToAlpha = 'abcdefgh'
  const {x, y} = parseRef(ref)
  return numericToAlpha[x] + (y + 1)
}

function colorOf (piece: any) {
  const blackPieces = 'rnbkqp'
  const whitePieces = 'RNBKQP'
  if (blackPieces.indexOf(piece) !== -1) return black
  if (whitePieces.indexOf(piece) !== -1) return white
  return piece
}

function pieceAt (board: any, ref: any) {
  const {x, y} = parseRef(ref)
  return board[7 - y][x]
}

function colorAt (board: any, ref: any) {
  return colorOf(pieceAt(board, ref))
}

function blackAt (board: any, ref: any) {
  return colorAt(board, ref) === black
}

function whiteAt (board: any, ref: any) {
  return colorAt(board, ref) === white
}

function emptyAt (board: any, ref: any) {
  return pieceAt(board, ref) === '.'
}

function pieceHasMoved (board: any, log: any, ref: any, piece: any) {
  return !(pieceAt(board, ref) === piece && !log.find((x: any) => refsAreEqual(x, ref)))
}

function setPieceAt (board: any, ref: any, value: any) {
  const boardAfter = board.slice(0)
  let {x, y} = parseRef(ref)

  const row = boardAfter[7 - y]
  boardAfter[7 - y] = row.substr(0, x) + value + row.substr(x + 1)

  return boardAfter
}

function findPiece (board: any, piece: any) {
  for (let x = 0; x <= 7; x++) {
    for (let y = 0; y <= 7; y++) {
      if (pieceAt(board, [x, y]) === piece) return {x, y}
    }
  }
}

function applyMove (board: any, moveRef: any) {
  const move = parseMove(moveRef)
  const piece = pieceAt(board, move.from)
  let boardAfter = setPieceAt(board, move.from, '.')
  boardAfter = setPieceAt(boardAfter, move.to, piece)

  if (piece === 'k') {
    if (movesAreEqual(move, 'e8-g8')) {
      boardAfter = setPieceAt(boardAfter, 'h8', '.')
      boardAfter = setPieceAt(boardAfter, 'f8', 'r')
    } else if (movesAreEqual(move, 'e8-c8')) {
      boardAfter = setPieceAt(boardAfter, 'a8', '.')
      boardAfter = setPieceAt(boardAfter, 'd8', 'r')
    }
  } else if (piece === 'K') {
    if (movesAreEqual(move, 'e1-g1')) {
      boardAfter = setPieceAt(boardAfter, 'h1', '.')
      boardAfter = setPieceAt(boardAfter, 'f1', 'R')
    } else if (movesAreEqual(move, 'e1-c1')) {
      boardAfter = setPieceAt(boardAfter, 'a1', '.')
      boardAfter = setPieceAt(boardAfter, 'd1', 'R')
    }
  } else if (piece === 'p') {
    const {x: x1} = parseRef(move.from)
    const {x: x2, y: y2} = parseRef(move.to)
    if (x1 !== x2 && emptyAt(board, move.to)) {
      boardAfter = setPieceAt(boardAfter, [x2, y2 + 1], '.')
    } else if (y2 === 0) {
      boardAfter = setPieceAt(boardAfter, [x2, y2], move.promoteTo.toLowerCase())
    }
  } else if (piece === 'P') {
    const {x: x1} = parseRef(move.from)
    const {x: x2, y: y2} = parseRef(move.to)
    if (x1 !== x2 && emptyAt(board, move.to)) {
      boardAfter = setPieceAt(boardAfter, [x2, y2 - 1], '.')
    } else if (y2 === 7) {
      boardAfter = setPieceAt(boardAfter, [x2, y2], move.promoteTo)
    }
  }
  return boardAfter
}

export {
  white, black, parseRef, toRef, colorOf, pieceAt,
  colorAt, blackAt, whiteAt, emptyAt, moveBy,
  moveTo, pieceHasMoved, setPieceAt, findPiece,
  parseMove, moveToString, movesAreEqual, applyMove, refsAreEqual
}
