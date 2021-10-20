import * as validate from '@/components/Chess/lib/chess-validate'

describe('Apply Movement', () => {
  it('Black pawn moves forward', () => {
    const board = [
      'rnbqkbnr',
      'pppppppp',
      '........',
      '........',
      '........',
      '........',
      'PPPPPPPP',
      'RNBQKBNR']
    expect(validate.applyMove(board, 'a7-a6')).toEqual([
      'rnbqkbnr',
      '.ppppppp',
      'p.......',
      '........',
      '........',
      '........',
      'PPPPPPPP',
      'RNBQKBNR']
    )
  })

  describe('Pawn promotion', () => {
    const board = [
      '........',
      'P.......',
      '........',
      '........',
      '........',
      '........',
      '.......p',
      '........']

    it('white pawn is promoted to queen', () => {
      expect(validate.applyMove(board, 'a7-a8=Q')).toEqual([
        'Q.......',
        '........',
        '........',
        '........',
        '........',
        '........',
        '.......p',
        '........']
      )
    })

    it('white pawn is promoted to bishop', () => {
      expect(validate.applyMove(board, 'a7-a8=B')).toEqual([
        'B.......',
        '........',
        '........',
        '........',
        '........',
        '........',
        '.......p',
        '........']
      )
    })

    it('black pawn is promoted to knight', () => {
      expect(validate.applyMove(board, 'h2-h1=N')).toEqual([
        '........',
        'P.......',
        '........',
        '........',
        '........',
        '........',
        '........',
        '.......n']
      )
    })

    it('black pawn is promoted to rook', () => {
      expect(validate.applyMove(board, 'h2-h1=R')).toEqual([
        '........',
        'P.......',
        '........',
        '........',
        '........',
        '........',
        '........',
        '.......r']
      )
    })

    it('possible moves for promotion includes all types', () => {
      const log = [] as any[]
      const board = [
        '........',
        'P.......',
        '........',
        '........',
        '........',
        '........',
        '........',
        '........']
      expect(validate.getPossibleMoves(board, log).map((x: any) => validate.moveToString(x))).toEqual([
        'a7-a8=Q',
        'a7-a8=R',
        'a7-a8=B',
        'a7-a8=N'
      ])
    })

    it('possible moves when taking right for promotion includes all types', () => {
      const log = [] as any[]
      const board = [
        'rr......',
        'P.......',
        '........',
        '........',
        '........',
        '........',
        '........',
        '........']
      expect(validate.getPossibleMoves(board, log).map((x: any) => validate.moveToString(x))).toEqual([
        'a7-b8=Q',
        'a7-b8=R',
        'a7-b8=B',
        'a7-b8=N'
      ])
    })
    it('possible moves when taking left for promotion includes all types', () => {
      const log = [] as any[]
      const board = [
        'rr......',
        '.P......',
        '........',
        '........',
        '........',
        '........',
        '........',
        '........']
      expect(validate.getPossibleMoves(board, log).map((x: any) => validate.moveToString(x))).toEqual([
        'b7-a8=Q',
        'b7-a8=R',
        'b7-a8=B',
        'b7-a8=N'
      ])
    })

    it('possible moves for promotion includes all types', () => {
      const log = ['a1-a2']
      const board = [
        '........',
        '........',
        '........',
        '........',
        '........',
        '........',
        '.......p',
        '........']
      expect(validate.getPossibleMoves(board, log).map((x: any) => validate.moveToString(x))).toEqual([
        'h2-h1=Q',
        'h2-h1=R',
        'h2-h1=B',
        'h2-h1=N'
      ])
    })

    it('possible moves when taking left for promotion includes all types', () => {
      const log = ['a1-a2']
      const board = [
        '........',
        '........',
        '........',
        '........',
        '........',
        '........',
        '.......p',
        '......RR']
      expect(validate.getPossibleMoves(board, log).map((x: any) => validate.moveToString(x))).toEqual([
        'h2-g1=Q',
        'h2-g1=R',
        'h2-g1=B',
        'h2-g1=N'
      ])
    })

    it('possible moves when taking right for promotion includes all types', () => {
      const log = ['a1-a2']
      const board = [
        '........',
        '........',
        '........',
        '........',
        '........',
        '........',
        '......p.',
        '......RR']
      expect(validate.getPossibleMoves(board, log).map((x: any) => validate.moveToString(x))).toEqual([
        'g2-h1=Q',
        'g2-h1=R',
        'g2-h1=B',
        'g2-h1=N'
      ])
    })
  })

  describe('En-passant', () => {
    const board = [
      'rnbqkbnr',
      'pp.ppp.p',
      '........',
      '.Pp.....',
      '.....Pp.',
      '........',
      'P.PPP.PP',
      'RNBQKBNR']

    it('black takes white pawn', () => {
      expect(validate.applyMove(board, 'g4-f3')).toEqual([
        'rnbqkbnr',
        'pp.ppp.p',
        '........',
        '.Pp.....',
        '........',
        '.....p..',
        'P.PPP.PP',
        'RNBQKBNR']
      )
    })

    it('white takes black pawn', () => {
      expect(validate.applyMove(board, 'b5-c6')).toEqual([
        'rnbqkbnr',
        'pp.ppp.p',
        '..P.....',
        '........',
        '.....Pp.',
        '........',
        'P.PPP.PP',
        'RNBQKBNR']
      )
    })
  })

  describe('White pawn promotion', () => {
    const board = [
      '........',
      '.PR.....',
      'P.......',
      '........',
      '........',
      '........',
      '........',
      '........']
    it('true when pawn reaches the last rank', () => {
      expect(validate.isPawnPromotion(board, 'b7-b8')).toBe(true)
    })

    it('false when pawn does not reach the last rank', () => {
      expect(validate.isPawnPromotion(board, 'a6-a7')).toBe(false)
    })

    it('false when a rook reaches the last rank', () => {
      expect(validate.isPawnPromotion(board, 'c7-c8')).toBe(false)
    })
  })

  describe('Black pawn promotion', () => {
    const board = [
      '........',
      '........',
      '........',
      '........',
      '........',
      'p.......',
      '.pr.....',
      '........']
    it('true when pawn reaches the last rank', () => {
      expect(validate.isPawnPromotion(board, 'b2-b1')).toBe(true)
    })

    it('false when pawn does not reach the last rank', () => {
      expect(validate.isPawnPromotion(board, 'a3-a2')).toBe(false)
    })

    it('false when a rook reaches the last rank', () => {
      expect(validate.isPawnPromotion(board, 'c2-c1')).toBe(false)
    })
  })
})
