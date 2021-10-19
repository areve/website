import * as chess from '@/components/Chess/chess'

describe('move logging', () => {
  describe('Castling', () => {
    const board = [
      'r...k..r',
      'pppppppp',
      '........',
      '........',
      '........',
      '........',
      'PPPPPPPP',
      'R...K..R']
    it('black castle right', () => {
      expect(chess.logMove(board, 'e8-g8')).toEqual('O-O')
    })

    it('white castle right', () => {
      expect(chess.logMove(board, 'e1-g1')).toEqual('O-O')
    })

    it('black castle left', () => {
      expect(chess.logMove(board, 'e8-c8')).toEqual('O-O-O')
    })

    it('white castle left', () => {
      expect(chess.logMove(board, 'e1-c1')).toEqual('O-O-O')
    })
  })

  describe('Pawn moves', () => {
    const board = [
      'rnbqkbnr',
      'ppppp.p.',
      '.......P',
      '....Pp..',
      '........',
      '.......p',
      'PPPPPPP.',
      'RNBQKBNR']
    it('white pawn forward', () => {
      expect(chess.logMove(board, 'a2-a3')).toEqual('a3')
    })

    it('white pawn forward two', () => {
      expect(chess.logMove(board, 'a2-a4')).toEqual('a4')
    })

    it('black pawn forward', () => {
      expect(chess.logMove(board, 'a7-a6')).toEqual('a6')
    })

    it('black pawn forward two', () => {
      expect(chess.logMove(board, 'a7-a5')).toEqual('a5')
    })

    it('black pawn captures', () => {
      expect(chess.logMove(board, 'g7-h6')).toEqual('gxh6')
    })

    it('white pawn captures', () => {
      expect(chess.logMove(board, 'g2-h3')).toEqual('gxh3')
    })

    it('white pawn en-passant', () => {
      expect(chess.logMove(board, 'e5-f6')).toEqual('exf6e.p.')
    })

    it('white pawn promoted to rook', () => {
      const board = [
        '........',
        '......P.',
        '........',
        '........',
        '........',
        '........',
        '........',
        'k.K.....']
      expect(chess.logMove(board, 'g7-g8=R')).toEqual('g8=R')
    })

    it('white pawn promoted to bishop by taking', () => {
      const board = [
        '.......r',
        '......P.',
        '........',
        '........',
        '........',
        '........',
        '........',
        'k.K.....']
      expect(chess.logMove(board, 'g7-h8=B')).toEqual('gxh8=B')
    })
  })

  describe('Knight moves', () => {
    const board = [
      'rnbqkb.r',
      'pppppppp',
      'N.......',
      '........',
      '........',
      'n.......',
      'PPPPPPPP',
      'RNBQKB.R']
    it('white knight move', () => {
      expect(chess.logMove(board, 'b1-c3')).toEqual('Nc3')
    })

    it('black knight move', () => {
      expect(chess.logMove(board, 'b8-c6')).toEqual('Nc6')
    })

    it('knight move captures', () => {
      expect(chess.logMove(board, 'b8-a6')).toEqual('Nxa6')
    })

    it('black knight ambiguous capture', () => {
      const board = [
        '........',
        '.n...n..',
        '...R....',
        '.n...n..',
        '........',
        '........',
        '........',
        '........']
      expect(chess.logMove(board, 'b7-d6')).toEqual('Nb7xd6')
    })
  })

  describe('Bishop moves', () => {
    const board = [
      'rnbqkb.r',
      'ppp.pppp',
      '........',
      '...p.N..',
      '...P.n..',
      '........',
      'PPP.PPPP',
      'RNBQKB.R']
    it('white bishop move', () => {
      expect(chess.logMove(board, 'c1-e3')).toEqual('Be3')
    })

    it('black bishop move', () => {
      expect(chess.logMove(board, 'c8-e6')).toEqual('Be6')
    })

    it('black bishop captures', () => {
      expect(chess.logMove(board, 'c8-f5')).toEqual('Bxf5')
    })

    it('black bishop ambiguous capture', () => {
      const board = [
        '........',
        '..b.....',
        '...R....',
        '..b.....',
        '........',
        '........',
        '........',
        '........']
      expect(chess.logMove(board, 'c5-d6')).toEqual('B5xd6')
    })
  })

  describe('Queen moves', () => {
    const board = [
      'rnbqkb.r',
      'ppp.Nppp',
      '........',
      '...p....',
      '...P....',
      '........',
      'PPP.nPPP',
      'RNBQKB.R']
    it('white queen move', () => {
      expect(chess.logMove(board, 'd1-d3')).toEqual('Qd3')
    })

    it('black queen move', () => {
      expect(chess.logMove(board, 'd8-d6')).toEqual('Qd6')
    })

    it('black queen captures', () => {
      expect(chess.logMove(board, 'd8-e7')).toEqual('Qxe7')
    })

    it('black queen ambiguous move with three queens', () => {
      const board = [
        '........',
        '..q.q...',
        '........',
        '....q...',
        '........',
        '........',
        '........',
        '........']
      expect(chess.logMove(board, 'e7-d6')).toEqual('Qe7d6')
    })

    it('black queen ambiguous move different file and rank', () => {
      const board = [
        '........',
        '..q.....',
        '........',
        '....q...',
        '........',
        '........',
        '........',
        '........']
      expect(chess.logMove(board, 'e5-d6')).toEqual('Qed6')
    })

    it('black queen ambiguous move different rank', () => {
      const board = [
        '........',
        '....q...',
        '........',
        '....q...',
        '........',
        '........',
        '........',
        '........']
      expect(chess.logMove(board, 'e5-d6')).toEqual('Q5d6')
    })

    it('black queen ambiguous capture different file', () => {
      const board = [
        '........',
        '..q.q...',
        '...R....',
        '........',
        '........',
        '........',
        '........',
        '........']
      expect(chess.logMove(board, 'e7-d6')).toEqual('Qexd6')
    })

    it('black queen ambiguous capture different rank', () => {
      const board = [
        '........',
        '....q...',
        '...R....',
        '....q...',
        '........',
        '........',
        '........',
        '........']
      expect(chess.logMove(board, 'e5-d6')).toEqual('Q5xd6')
    })
  })

  describe('King moves', () => {
    const board = [
      'rnbqkb.r',
      'ppp.Nppp',
      '........',
      '...p....',
      '...P....',
      '........',
      'PPP.nPPP',
      'RNBQKB.R']
    it('white king move', () => {
      expect(chess.logMove(board, 'e1-d2')).toEqual('Kd2')
    })

    it('black king move', () => {
      expect(chess.logMove(board, 'e8-d7')).toEqual('Kd7')
    })

    it('black king captures', () => {
      expect(chess.logMove(board, 'e8-e7')).toEqual('Kxe7')
    })
  })

  describe('Rook moves', () => {
    const board = [
      'rnbqkb.r',
      '.pppppp.',
      '.......N',
      'p......P',
      'P......p',
      '.......n',
      '.PPPPPP.',
      'RNBQKB.R']
    it('white rook move', () => {
      expect(chess.logMove(board, 'a1-a3')).toEqual('Ra3')
    })

    it('black rook move', () => {
      expect(chess.logMove(board, 'a8-a6')).toEqual('Ra6')
    })

    it('black rook captures', () => {
      expect(chess.logMove(board, 'h8-h6')).toEqual('Rxh6')
    })

    it('black rook ambiguous move with two rooks', () => {
      const board = [
        '........',
        '..r.r...',
        '........',
        '........',
        '........',
        '........',
        '........',
        '........']
      expect(chess.logMove(board, 'c7-d7')).toEqual('Rcd7')
    })

    it.skip('black rook checks opponent', () => { // proposed feature
      const board = [
        '........',
        '..r.....',
        '........',
        '........',
        '........',
        '....K...',
        '........',
        '....k...']
      expect(chess.logMove(board, 'c7-e7')).toEqual('Re7+')
    })

    it.skip('black rook checkmates opponent', () => { // proposed feature
      const board = [
        '........',
        '..r.....',
        '...q.r..',
        '........',
        '........',
        '....K...',
        '........',
        '....k...']
      expect(chess.logMove(board, 'c7-e7')).toEqual('Re7#')
    })
  })
})
