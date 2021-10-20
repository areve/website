import * as validate from '@/components/Chess/lib/chess-validate'

describe('Black Pawn', () => {
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
    expect(validate.canMove(board, log, 'a7-a6')).toBe(true)
  })

  it('can move forward 2 from start position', () => {
    expect(validate.canMove(board, log, 'a7-a5')).toBe(true)
  })

  it('cannot move forward 2 from non-start position', () => {
    const board = [
      '........',
      '........',
      'p.......',
      '........',
      '........',
      '........',
      '........',
      '........']
    expect(validate.canMove(board, log, 'a6-a4')).toBe(false)
  })

  it('cannot move forward two over another piece', () => {
    const board = [
      '........',
      'p.......',
      'b.......',
      '........',
      '........',
      '........',
      '........',
      '........']
    expect(validate.canMove(board, log, 'a7-a5')).toBe(false)
  })

  it('can move diagonally left to take', () => {
    const board = [
      '........',
      '........',
      '........',
      '........',
      '....p...',
      '...P....',
      '........',
      '........']
    expect(validate.canMove(board, log, 'e4-d3')).toBe(true)
  })

  it('cannot move diagonally left unless taking', () => {
    expect(validate.canMove(board, log, 'e7-d3')).toBe(false)
  })

  it('can move diagonally right to take', () => {
    const board = [
      '........',
      '........',
      '........',
      '........',
      '..p.....',
      '...P....',
      '........',
      '........']
    expect(validate.canMove(board, log, 'c4-d3')).toBe(true)
  })

  it('cannot move diagonally right unless taking', () => {
    expect(validate.canMove(board, log, 'c7-d6')).toBe(false)
  })

  it('en-passant right not allowed if last move was not the white pawn', () => {
    const board = [
      '........',
      '........',
      '........',
      '........',
      '...pP...',
      '........',
      '........',
      '........']
    const log = ['e3-e4']
    expect(validate.canMove(board, log, 'd4-e3')).toBe(false)
  })

  it('en-passant right is allowed if last move was the white pawn', () => {
    const board = [
      '........',
      '........',
      '........',
      '........',
      '...pP...',
      '........',
      '........',
      '........']
    const log = ['e2-e4']
    expect(validate.canMove(board, log, 'd4-e3')).toBe(true)
  })

  it('en-passant left not allowed if last move was not the white pawn', () => {
    const board = [
      '........',
      '........',
      '........',
      '........',
      '.Pp.....',
      '........',
      '........',
      '........']
    const log = ['b3-b4']
    expect(validate.canMove(board, log, 'c4-b3')).toBe(false)
  })

  it('en-passant left is allowed if last move was the white pawn', () => {
    const board = [
      '........',
      '........',
      '........',
      '........',
      '.Pp.....',
      '........',
      '........',
      '........']
    const log = ['b2-b4']
    expect(validate.canMove(board, log, 'c4-b3')).toBe(true)
  })

  it('en-passant right is not allowed if last move was the white pawn', () => {
    const board = [
      '........',
      '........',
      '........',
      '........',
      '...pQ...',
      '........',
      '........',
      '........']
    const log = ['e2-e4']
    expect(validate.canMove(board, log, 'd4-e3')).toBe(false)
  })

  it('en-passant left is not allowed if last move was the white pawn', () => {
    const board = [
      '........',
      '........',
      '........',
      '........',
      '.Qp.....',
      '........',
      '........',
      '........']
    const log = ['b2-b4']
    expect(validate.canMove(board, log, 'c4-b3')).toBe(false)
  })

  it('cannot move forward to take', () => {
    const board = [
      '........',
      '...p....',
      '...P....',
      '........',
      '........',
      '........',
      '........',
      '........']
    expect(validate.canMove(board, log, 'd7-d6')).toBe(false)
  })

  it('cannot move forward two to take', () => {
    const board = [
      '........',
      '...p....',
      '........',
      '...P....',
      '........',
      '........',
      '........',
      '........']
    expect(validate.canMove(board, log, 'd7-d5')).toBe(false)
  })
})
