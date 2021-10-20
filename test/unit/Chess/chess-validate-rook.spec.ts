import * as validate from '@/components/Chess/lib/chess-validate'

describe('Black Rook', () => {
  const log = [] as any[]
  const board = [
    '........',
    '...b....',
    '........',
    '.b.r.B..',
    '........',
    '...B....',
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

  it('it cannot move diagonally', () => {
    expect(validate.canMove(board, log, 'd5-e6')).toBe(false)
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
})

describe('White Rook', () => {
  const log = [] as any[]
  const board = [
    '........',
    '...B....',
    '........',
    '.B.R.b..',
    '........',
    '...b....',
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

  it('it cannot move diagonally', () => {
    expect(validate.canMove(board, log, 'd5-e6')).toBe(false)
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

  it('it cannot move into check', () => {
    const board = [
      '........',
      '........',
      '...K....',
      '...R....',
      '........',
      '........',
      '...r....',
      '........']
    expect(validate.canMove(board, log, 'd5-e5')).toBe(false)
  })
})
