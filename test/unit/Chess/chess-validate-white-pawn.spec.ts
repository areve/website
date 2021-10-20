import * as validate from '@/components/Chess/lib/chess-validate'

describe('White Pawn', () => {
  const log = [] as any[]
  const board = [
    'rnbqkbnr',
    'pppppppp',
    '........',
    '........',
    '........',
    '........',
    'PPPPPPPP',
    'RNBQKBNR']

  it('can move forward 1', () => {
    expect(validate.canMove(board, log, 'a2-a3')).toBe(true)
  })

  it('can move forward 2 from start position', () => {
    expect(validate.canMove(board, log, 'a2-a4')).toBe(true)
  })

  it('cannot move forward 2 from non-start position', () => {
    const board = [
      '........',
      '........',
      '........',
      '........',
      '........',
      'P.......',
      '........',
      '........']
    expect(validate.canMove(board, log, 'a3-a5')).toBe(false)
  })

  it('cannot move forward two over another piece', () => {
    const board = [
      '........',
      '........',
      '........',
      '........',
      '........',
      'B.......',
      'P.......',
      '........']
    expect(validate.canMove(board, log, 'a2-a4')).toBe(false)
  })

  it('can move diagonally right to take', () => {
    const board = [
      '........',
      '........',
      '........',
      '........',
      '....p...',
      '...P....',
      '........',
      '........']
    expect(validate.canMove(board, log, 'd3-e4')).toBe(true)
  })

  it('cannot move diagonally right unless taking', () => {
    expect(validate.canMove(board, log, 'd2-e3')).toBe(false)
  })

  it('can move diagonally left to take', () => {
    const board = [
      '........',
      '........',
      '........',
      '........',
      '..p.....',
      '...P....',
      '........',
      '........']
    expect(validate.canMove(board, log, 'd3-c4')).toBe(true)
  })

  it('cannot move diagonally left unless taking', () => {
    expect(validate.canMove(board, log, 'd2-c3')).toBe(false)
  })

  it('cannot move forward to take', () => {
    const board = [
      '........',
      '........',
      '........',
      '........',
      '...p....',
      '...P....',
      '........',
      '........']
    expect(validate.canMove(board, log, 'd3-d4')).toBe(false)
  })

  it('cannot move forward two to take', () => {
    const board = [
      '........',
      '........',
      '........',
      '........',
      '...p....',
      '........',
      '...P....',
      '........']
    expect(validate.canMove(board, log, 'd2-d4')).toBe(false)
  })

  it('en-passant right not allowed if last move was not the black pawn', () => {
    const board = [
      '........',
      '........',
      '........',
      '..Pp....',
      '........',
      '........',
      '........',
      '........']
    const log = ['d6-d5']
    expect(validate.canMove(board, log, 'c5-d6')).toBe(false)
  })

  it('en-passant right is allowed if last move was the black pawn', () => {
    const board = [
      '........',
      '........',
      '........',
      '..Pp....',
      '........',
      '........',
      '........',
      '........']
    const log = ['d7-d5']
    expect(validate.canMove(board, log, 'c5-d6')).toBe(true)
  })

  it('en-passant left not allowed if last move was not the black pawn', () => {
    const board = [
      '........',
      '........',
      '........',
      '.pP.....',
      '........',
      '........',
      '........',
      '........']
    const log = ['b6-b5']
    expect(validate.canMove(board, log, 'c5-b6')).toBe(false)
  })

  it('en-passant right is not allowed if last move was the black queen', () => {
    const board = [
      '........',
      '........',
      '........',
      '..Pq....',
      '........',
      '........',
      '........',
      '........']
    const log = ['d7-d5']
    expect(validate.canMove(board, log, 'c5-d6')).toBe(false)
  })

  it('en-passant left is not allowed if last move was the black queen', () => {
    const board = [
      '........',
      '........',
      '........',
      '.qP.....',
      '........',
      '........',
      '........',
      '........']
    const log = ['b7-b5']
    expect(validate.canMove(board, log, 'c5-b6')).toBe(false)
  })

  it('en-passant left is allowed if last move was the black pawn', () => {
    const board = [
      '........',
      '........',
      '........',
      '.pP.....',
      '........',
      '........',
      '........',
      '........']
    const log = ['b7-b5']
    expect(validate.canMove(board, log, 'c5-b6')).toBe(true)
  })

  it('it cannot move into check', () => {
    const board = [
      '........',
      '........',
      '...KP..r',
      '........',
      '........',
      '........',
      '........',
      '........']
    expect(validate.canMove(board, log, 'e6-e7')).toBe(false)
  })
})
