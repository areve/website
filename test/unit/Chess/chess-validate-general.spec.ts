import * as validate from '@/components/Chess/lib/chess-validate'

describe('Unknown piece', () => {
  const log = [] as any[]
  it('cannot move if it is an unknown piece', () => {
    const board = [
      '........',
      '........',
      '........',
      '........',
      '........',
      '........',
      '?.......',
      '........']
    expect(validate.canMove(board, log, 'a2-a3')).toBe(false)
  })
})

describe('Turns', () => {
  const log = [] as any[]
  it('can move if it is the correct turn', () => {
    const board = [
      '........',
      '........',
      '........',
      '........',
      '........',
      '........',
      'P.......',
      '........']
    expect(validate.canMoveOnTurn(board, log, 'a2-a3')).toBe(true)
  })

  it('cannot move if it is the incorrect turn', () => {
    const log = ['b2-b3']
    const board = [
      '........',
      '........',
      '........',
      '........',
      '........',
      '........',
      'P.......',
      '........']
    expect(validate.canMoveOnTurn(board, log, 'a2-a3')).toBe(false)
  })
})

describe('ref to string', () => {
  it('ref object to letters', () => {
    expect(validate.toRef({x: 1, y: 2})).toBe('b3')
  })

  it('ref to letters', () => {
    expect(validate.toRef([1, 2])).toBe('b3')
  })

  it('null to null', () => {
    expect(validate.toRef(null)).toBe(null)
  })
})

describe('parseRef', () => {
  it('letters to coords', () => {
    expect(validate.parseRef('b3')).toEqual({x: 1, y: 2})
  })

  it('null to null', () => {
    expect(validate.parseRef(null)).toBe(null)
  })
})
