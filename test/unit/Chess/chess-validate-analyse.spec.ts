import * as validate from '@/components/Chess/lib/chess-validate'

describe('Board Analyse', () => {
  it('black is in check', () => {
    const board = [
      '........',
      '....R...',
      '........',
      '........',
      '....k...',
      '........',
      '..K.....',
      '........']
    expect(validate.analyse(board)).toBe('Black is in check')
  })

  it('white is in check', () => {
    const board = [
      '........',
      '........',
      '..r.....',
      '........',
      '....k...',
      '........',
      '..K.....',
      '........']
    expect(validate.analyse(board)).toBe('White is in check')
  })

  it('black is in check when pawn would be promoted', () => {
    const board = [
      '........',
      '........',
      '........',
      '........',
      '........',
      '........',
      '......p.',
      '.......K']
    expect(validate.analyse(board)).toBe('White is in check')
  })

  it('white is checkmated', () => {
    const board = [
      '........',
      '........',
      '........',
      'P.......',
      '........',
      '....k...',
      '........',
      'r...K...']
    expect(validate.analyse(board)).toBe('White is checkmated')
  })

  it('black is checkmated', () => {
    const board = [
      '........',
      '........',
      '........',
      'p.......',
      '........',
      '....K...',
      '........',
      'R...k...']
    expect(validate.analyse(board)).toBe('Black is checkmated')
  })

  it('black is stalemate', () => {
    const board = [
      '........',
      '........',
      '........',
      '........',
      '........',
      '....KQ..',
      '........',
      '....k...']
    expect(validate.analyse(board)).toBe('Black cannot move')
  })

  it('white is stalemate', () => {
    const board = [
      '........',
      '........',
      '........',
      '........',
      '........',
      '....kq..',
      '........',
      '....K...']
    expect(validate.analyse(board)).toBe('White cannot move')
  })

  it('neither play in check', () => {
    const board = [
      '........',
      '...R....',
      '........',
      '........',
      '....k...',
      '........',
      '..K.....',
      '........']
    expect(validate.analyse(board)).toBe(null)
  })

  it('both in check (invalid)', () => {
    const board = [
      '........',
      '........',
      '..r.R...',
      '........',
      '....k...',
      '........',
      '..K.....',
      '........']
    expect(validate.analyse(board)).toBe('Invalid - both in check')
  })

  it('only kings stalemate white King top', () => {
    const board = [
      '........',
      '........',
      '....K...',
      '........',
      '....k...',
      '........',
      '........',
      '........']
    expect(validate.analyse(board)).toBe('Stalemate - only kings')
  })

  it('only kings stalemate black King top', () => {
    const board = [
      '........',
      '........',
      '....k...',
      '........',
      '....K...',
      '........',
      '........',
      '........']
    expect(validate.analyse(board)).toBe('Stalemate - only kings')
  })
})
