import * as validate from '@/components/Chess/lib/chess-validate'

describe('Black Knight', () => {
  const log = [] as any[]
  const board = [
    '........',
    '........',
    '........',
    '...n....',
    '........',
    '........',
    '........',
    '........']

  it('it can move to an empty space right-up', () => {
    expect(validate.canMove(board, log, 'd5-f6')).toBe(true)
  })

  it('it can move to an empty space right-down', () => {
    expect(validate.canMove(board, log, 'd5-f4')).toBe(true)
  })

  it('it can move to an empty space left-up', () => {
    expect(validate.canMove(board, log, 'd5-b6')).toBe(true)
  })

  it('it can move to an empty space left-down', () => {
    expect(validate.canMove(board, log, 'd5-b4')).toBe(true)
  })

  it('it can move to an empty space up-right', () => {
    expect(validate.canMove(board, log, 'd5-e7')).toBe(true)
  })

  it('it can move to an empty space down-right', () => {
    expect(validate.canMove(board, log, 'd5-e3')).toBe(true)
  })

  it('it can move to an empty space up-left', () => {
    expect(validate.canMove(board, log, 'd5-c7')).toBe(true)
  })

  it('it can move to an empty space down-left', () => {
    expect(validate.canMove(board, log, 'd5-c3')).toBe(true)
  })

  it('it cannot move just anywhere', () => {
    expect(validate.canMove(board, log, 'd5-f5')).toBe(false)
  })

  it('it cannot move twice in the same direction', () => {
    expect(validate.canMove(board, log, 'd5-h7')).toBe(false)
  })
})

describe('White Knight', () => {
  const log = [] as any[]as any[]
  const board = [
    '........',
    '........',
    '.....b..',
    '...N....',
    '.....B..',
    '........',
    '........',
    '........']

  it('it can move to an occupied space of opposite color', () => {
    expect(validate.canMove(board, log, 'd5-f6')).toBe(true)
  })

  it('it cannot move to an occupied space of same color', () => {
    expect(validate.canMove(board, log, 'd5-f4')).toBe(false)
  })

  it('it cannot move into check', () => {
    const board = [
      '........',
      '........',
      '...K....',
      '...N....',
      '........',
      '........',
      '...r....',
      '........']
    expect(validate.canMove(board, log, 'd5-f6')).toBe(false)
  })
})
