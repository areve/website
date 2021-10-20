import * as validate from '@/components/Chess/lib/chess-validate'

describe('Black Bishop', () => {
  const log = [] as any[];
  const board = [
    '........',
    '.r...r..',
    '........',
    '...b....',
    '........',
    '.R...R..',
    '........',
    '........']

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

  it('it cannot move right', () => {
    expect(validate.canMove(board, log, 'd5-e5')).toBe(false)
  })

  it('it cannot move left', () => {
    expect(validate.canMove(board, log, 'd5-c5')).toBe(false)
  })

  it('it cannot move up', () => {
    expect(validate.canMove(board, log, 'd5-d6')).toBe(false)
  })

  it('it cannot move down', () => {
    expect(validate.canMove(board, log, 'd5-d4')).toBe(false)
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
})

describe('White Bishop', () => {
  const log = [] as any[];
  const board = [
    '........',
    '.R...R..',
    '........',
    '...B....',
    '........',
    '.r...r..',
    '........',
    '........']

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

  it('it cannot move right', () => {
    expect(validate.canMove(board, log, 'd5-e5')).toBe(false)
  })

  it('it cannot move left', () => {
    expect(validate.canMove(board, log, 'd5-c5')).toBe(false)
  })

  it('it cannot move up', () => {
    expect(validate.canMove(board, log, 'd5-d6')).toBe(false)
  })

  it('it cannot move down', () => {
    expect(validate.canMove(board, log, 'd5-d4')).toBe(false)
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

  it('it cannot move into check', () => {
    const board = [
      '........',
      '........',
      '...K....',
      '...B....',
      '........',
      '........',
      '...r....',
      '........']
    expect(validate.canMove(board, log, 'd5-e6')).toBe(false)
  })
})
