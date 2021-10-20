import * as validate from '@/components/Chess/lib/chess-validate'

describe('Check Validation', () => {
  it('black is in check', () => {
    const board = [
      '...R....',
      '....R...',
      '.....R..',
      '........',
      '....k...',
      '........',
      '........',
      '........']
    expect(validate.isInCheck(board, 'black')).toBe(true)
  })

  it('black is not check', () => {
    const board = [
      '...R....',
      '....R...',
      '.....R..',
      '........',
      '......k.',
      '........',
      '........',
      '........']
    expect(validate.isInCheck(board, 'black')).toBe(false)
  })

  it('white is in check', () => {
    const board = [
      '........',
      '....P...',
      '...K...r',
      '........',
      '........',
      '........',
      '........',
      '........' ]
    expect(validate.isInCheck(board, 'white')).toBe(true)
  })

  it('white is in check', () => {
    const board = [
      '.......q',
      '........',
      '........',
      '........',
      '........',
      '........',
      '........',
      'K.......' ]
    expect(validate.isInCheck(board, 'white')).toBe(true)
  })

  it('black is in check', () => {
    const board = [
      'k.......',
      '........',
      '........',
      '........',
      '........',
      '........',
      '........',
      '.......B' ]
    expect(validate.isInCheck(board, 'black')).toBe(true)
  })

  it('black is not in check', () => {
    const board = [
      '..k.....',
      '........',
      '........',
      '........',
      '........',
      '........',
      '....K...',
      '........']
    expect(validate.isInCheck(board, 'black')).toBe(false)
  })

  it('black king is not in check from a pawn moving forwards', () => {
    const board = [
      '..k.....',
      '..P.....',
      '........',
      '........',
      '........',
      '........',
      '....K...',
      '........']
    expect(validate.isInCheck(board, 'black')).toBe(false)
  })

  it('black king is not in check from a pawn moving forwards two', () => {
    const board = [
      '........',
      '........',
      '........',
      '........',
      '..k.....',
      '........',
      '..P.K...',
      '........']
    expect(validate.isInCheck(board, 'black')).toBe(false)
  })
})
