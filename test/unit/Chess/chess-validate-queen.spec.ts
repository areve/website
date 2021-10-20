import * as validate from '@/components/Chess/lib/chess-validate'

describe('Black Queen', () => {
  const log = [] as any[]
  const board = [
    '........',
    '.r.b.r..',
    '........',
    '.b.q.B..',
    '........',
    '.R.B.R..',
    '........',
    '........']

  it('it can move up', () => {
    expect(validate.canMove(board, log, 'd5-d6')).toBe(true)
  })

  it('it can move down', () => {
    expect(validate.canMove(board, log, 'd5-d4')).toBe(true)
  })

  it('it can move right', () => {
    expect(validate.canMove(board, log, 'd5-e5')).toBe(true)
  })

  it('it can move left', () => {
    expect(validate.canMove(board, log, 'd5-c5')).toBe(true)
  })

  it('it cannot move horizontally past another piece', () => {
    expect(validate.canMove(board, log, 'd5-g5')).toBe(false)
  })

  it('it cannot move vertically past another piece', () => {
    expect(validate.canMove(board, log, 'd5-d7')).toBe(false)
  })

  it('it cannot land horizontally on a same color piece', () => {
    expect(validate.canMove(board, log, 'd5-b5')).toBe(false)
  })

  it('it can land horizontally on a different color piece', () => {
    expect(validate.canMove(board, log, 'd5-f5')).toBe(true)
  })

  it('it cannot land vertically on a same color piece', () => {
    expect(validate.canMove(board, log, 'd5-d7')).toBe(false)
  })

  it('it can land vertically on a different color piece', () => {
    expect(validate.canMove(board, log, 'd5-d3')).toBe(true)
  })

  it('it can move diagonally up-right', () => {
    expect(validate.canMove(board, log, 'd5-e6')).toBe(true)
  })

  it('it can move diagonally up-left', () => {
    expect(validate.canMove(board, log, 'd5-c6')).toBe(true)
  })

  it('it can move diagonally down-right', () => {
    expect(validate.canMove(board, log, 'd5-e4')).toBe(true)
  })

  it('it can move diagonally down-left', () => {
    expect(validate.canMove(board, log, 'd5-c4')).toBe(true)
  })

  it('it cannot move diagonally past another piece', () => {
    expect(validate.canMove(board, log, 'd5-g8')).toBe(false)
  })

  it('it cannot land diagonally on a same color piece', () => {
    expect(validate.canMove(board, log, 'd5-f7')).toBe(false)
  })

  it('it can land diagonally on a different color piece', () => {
    expect(validate.canMove(board, log, 'd5-f3')).toBe(true)
  })

  it('it cannot move just anywhere', () => {
    expect(validate.canMove(board, log, 'd5-a1')).toBe(false)
  })
})

describe('White Queen', () => {
  const log = [] as any[]
  const board = [
    '........',
    '.R.B.R..',
    '........',
    '.B.Q.b..',
    '........',
    '.r.b.r..',
    '........',
    '........']

  it('it can move up', () => {
    expect(validate.canMove(board, log, 'd5-d6')).toBe(true)
  })

  it('it can move down', () => {
    expect(validate.canMove(board, log, 'd5-d4')).toBe(true)
  })

  it('it can move right', () => {
    expect(validate.canMove(board, log, 'd5-e5')).toBe(true)
  })

  it('it can move left', () => {
    expect(validate.canMove(board, log, 'd5-c5')).toBe(true)
  })

  it('it cannot move horizontally past another piece', () => {
    expect(validate.canMove(board, log, 'd5-g5')).toBe(false)
  })

  it('it cannot move vertically past another piece', () => {
    expect(validate.canMove(board, log, 'd5-d7')).toBe(false)
  })

  it('it cannot land horizontally on a same color piece', () => {
    expect(validate.canMove(board, log, 'd5-b5')).toBe(false)
  })

  it('it can land horizontally on a different color piece', () => {
    expect(validate.canMove(board, log, 'd5-f5')).toBe(true)
  })

  it('it cannot land vertically on a same color piece', () => {
    expect(validate.canMove(board, log, 'd5-d7')).toBe(false)
  })

  it('it can land vertically on a different color piece', () => {
    expect(validate.canMove(board, log, 'd5-d3')).toBe(true)
  })

  it('it can move diagonally up-right', () => {
    expect(validate.canMove(board, log, 'd5-e6')).toBe(true)
  })

  it('it can move diagonally up-left', () => {
    expect(validate.canMove(board, log, 'd5-c6')).toBe(true)
  })

  it('it can move diagonally down-right', () => {
    expect(validate.canMove(board, log, 'd5-e4')).toBe(true)
  })

  it('it can move diagonally down-left', () => {
    expect(validate.canMove(board, log, 'd5-c4')).toBe(true)
  })

  it('it cannot move diagonally past another piece', () => {
    expect(validate.canMove(board, log, 'd5-g8')).toBe(false)
  })

  it('it cannot land diagonally on a same color piece', () => {
    expect(validate.canMove(board, log, 'd5-f7')).toBe(false)
  })

  it('it can land diagonally on a different color piece', () => {
    expect(validate.canMove(board, log, 'd5-f3')).toBe(true)
  })

  it('it cannot move just anywhere', () => {
    expect(validate.canMove(board, log, 'd5-a1')).toBe(false)
  })

  it('it cannot move into check', () => {
    const board = [
      '........',
      '........',
      '...K....',
      '...Q....',
      '........',
      '........',
      '...r....',
      '........']
    expect(validate.canMove(board, log, 'd5-d6')).toBe(false)
  })
})
