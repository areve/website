import * as validate from '@/components/Chess/lib/chess-validate'

describe('Black King', () => {
  const log = [] as any[]
  const board = [
    '........',
    '........',
    '........',
    '...k....',
    '........',
    '........',
    '........',
    '........']

  it('it can move up', () => {
    expect(validate.canMove(board, log, 'd5-d6')).toBe(true)
  })

  it('it can move down', () => {
    expect(validate.canMove(board, log, 'd5-d4')).toBe(true)
  })

  it('it can move left', () => {
    expect(validate.canMove(board, log, 'd5-c5')).toBe(true)
  })

  it('it can move right', () => {
    expect(validate.canMove(board, log, 'd5-e5')).toBe(true)
  })

  it('it can move up-left', () => {
    expect(validate.canMove(board, log, 'd5-c6')).toBe(true)
  })

  it('it can move up-right', () => {
    expect(validate.canMove(board, log, 'd5-e6')).toBe(true)
  })

  it('it can move down-left', () => {
    expect(validate.canMove(board, log, 'd5-c4')).toBe(true)
  })

  it('it can move down-right', () => {
    expect(validate.canMove(board, log, 'd5-e4')).toBe(true)
  })

  it('it cannot move twice in the same direction', () => {
    expect(validate.canMove(board, log, 'd5-d7')).toBe(false)
  })

  it('it cannot move into check', () => {
    const board = [
      '........',
      '........',
      '.....R..',
      '...k....',
      '........',
      '........',
      '........',
      '........']
    expect(validate.canMove(board, log, 'd5-d6')).toBe(false)
  })

  describe('Castling', () => {
    let board: any;
    beforeEach(() => {
      board = [
        'r...k..r',
        '........',
        '........',
        '........',
        '........',
        '........',
        '........',
        '........']
    })
    it('it can castle right', () => {
      expect(validate.canMove(board, log, 'e8-g8')).toBe(true)
    })

    it('it cannot castle right if it has ever moved', () => {
      const log = ['e8-f8', 'b2-b3']
      expect(validate.canMove(board, log, 'e8-g8')).toBe(false)
    })

    it('it cannot castle right if the rook has ever moved', () => {
      const log = ['h8-h2', 'b2-b3']
      expect(validate.canMove(board, log, 'e8-g8')).toBe(false)
    })

    it('it cannot castle right if piece at f8', () => {
      const board = [
        'r...kB.r',
        '........',
        '........',
        '........',
        '........',
        '........',
        '........',
        '........']
      expect(validate.canMove(board, log, 'e8-g8')).toBe(false)
    })

    it('it cannot castle right if piece at g8', () => {
      const board = [
        'r...k.Br',
        '........',
        '........',
        '........',
        '........',
        '........',
        '........',
        '........']
      expect(validate.canMove(board, log, 'e8-g8')).toBe(false)
    })

    it('it can castle left', () => {
      expect(validate.canMove(board, log, 'e8-c8')).toBe(true)
    })

    it('it cannot castle left if it has ever moved', () => {
      const log = ['e8-f8', 'b2-b3']
      expect(validate.canMove(board, log, 'e8-c8')).toBe(false)
    })

    it('it cannot castle left if the rook has ever moved', () => {
      const log = ['a8-a2', 'b2-b3']
      expect(validate.canMove(board, log, 'e8-c8')).toBe(false)
    })

    it('it cannot castle left if piece at b8', () => {
      const board = [
        'rB..k..r',
        '........',
        '........',
        '........',
        '........',
        '........',
        '........',
        '........']
      expect(validate.canMove(board, log, 'e8-c8')).toBe(false)
    })

    it('it cannot castle left if piece at c8', () => {
      const board = [
        'r.B.k..r',
        '........',
        '........',
        '........',
        '........',
        '........',
        '........',
        '........']
      expect(validate.canMove(board, log, 'e8-c8')).toBe(false)
    })

    it('it cannot castle left if piece at d8', () => {
      const board = [
        'r..Bk..r',
        '........',
        '........',
        '........',
        '........',
        '........',
        '........',
        '........']
      expect(validate.canMove(board, log, 'e8-c8')).toBe(false)
    })

    it('it cannot castle left from check', () => {
      const board = [
        'r...k..r',
        '........',
        '........',
        '........',
        '....R...',
        '........',
        '........',
        '........']
      expect(validate.canMove(board, log, 'e8-c8')).toBe(false)
    })

    it('it cannot castle left through check', () => {
      const board = [
        'r...k..r',
        '........',
        '........',
        '........',
        '...R....',
        '........',
        '........',
        '........']
      expect(validate.canMove(board, log, 'e8-c8')).toBe(false)
    })

    it('it cannot castle left into check', () => {
      const board = [
        'r...k..r',
        '........',
        '........',
        '........',
        '..R.....',
        '........',
        '........',
        '........']
      expect(validate.canMove(board, log, 'e8-c8')).toBe(false)
    })

    it('it cannot castle right from check', () => {
      const board = [
        'r...k..r',
        '........',
        '........',
        '........',
        '....R...',
        '........',
        '........',
        '........']
      expect(validate.canMove(board, log, 'e8-g8')).toBe(false)
    })

    it('it cannot castle right through check', () => {
      const board = [
        'r...k..r',
        '........',
        '........',
        '........',
        '.....R..',
        '........',
        '........',
        '........']
      expect(validate.canMove(board, log, 'e8-g8')).toBe(false)
    })

    it('it cannot castle right into check', () => {
      const board = [
        'r...k..r',
        '........',
        '........',
        '........',
        '......R.',
        '........',
        '........',
        '........']
      expect(validate.canMove(board, log, 'e8-g8')).toBe(false)
    })
  })
})

describe('White King', () => {
  const log = [] as any[]
  const board = [
    '........',
    '........',
    '........',
    '........',
    '........',
    '........',
    '...r.P..',
    '....K...']

  it('it cannot move to an occupied space of same color', () => {
    expect(validate.canMove(board, log, 'e1-f2')).toBe(false)
  })

  it('it can move to an occupied space of opposite color', () => {
    expect(validate.canMove(board, log, 'e1-d2')).toBe(true)
  })

  describe('Castling', () => {
    let board: any
    beforeEach(() => {
      board = [
        '........',
        '........',
        '........',
        '........',
        '........',
        '........',
        '........',
        'R...K..R']
    })
    it('it can castle right', () => {
      expect(validate.canMove(board, log, 'e1-g1')).toBe(true)
    })

    it('it cannot castle right if it has ever moved', () => {
      const log = ['e1-f1', 'b2-b3']
      expect(validate.canMove(board, log, 'e1-g1')).toBe(false)
    })

    it('it cannot castle right if the rook has ever moved', () => {
      const log = ['h1-h2', 'b2-b3']
      expect(validate.canMove(board, log, 'e1-g1')).toBe(false)
    })

    it('it cannot castle right if piece at f1', () => {
      const board = [
        '........',
        '........',
        '........',
        '........',
        '........',
        '........',
        '........',
        'R...Kb.R']
      expect(validate.canMove(board, log, 'e1-g1')).toBe(false)
    })

    it('it cannot castle right if piece at g1', () => {
      const board = [
        '........',
        '........',
        '........',
        '........',
        '........',
        '........',
        '........',
        'R...K.bR']
      expect(validate.canMove(board, log, 'e1-g1')).toBe(false)
    })

    it('it can castle left', () => {
      expect(validate.canMove(board, log, 'e1-c1')).toBe(true)
    })

    it('it cannot castle left if it has ever moved', () => {
      const log = ['e1-f1', 'b2-b3']
      expect(validate.canMove(board, log, 'e1-c1')).toBe(false)
    })

    it('it cannot castle left if the rook has ever moved', () => {
      const log = ['a1-a2', 'b2-b3']
      expect(validate.canMove(board, log, 'e1-c1')).toBe(false)
    })

    it('it cannot castle left if piece at b1', () => {
      const board = [
        '........',
        '........',
        '........',
        '........',
        '........',
        '........',
        '........',
        'Rb..K..R']
      expect(validate.canMove(board, log, 'e1-c1')).toBe(false)
    })

    it('it cannot castle left if piece at c1', () => {
      const board = [
        '........',
        '........',
        '........',
        '........',
        '........',
        '........',
        '........',
        'R.b.K..R']
      expect(validate.canMove(board, log, 'e1-c1')).toBe(false)
    })

    it('it cannot castle left if piece at d1', () => {
      const board = [
        '........',
        '........',
        '........',
        '........',
        '........',
        '........',
        '........',
        'R..bK..R']
      expect(validate.canMove(board, log, 'e1-c1')).toBe(false)
    })

    it('it cannot castle left from check', () => {
      const board = [
        '........',
        '........',
        '........',
        '........',
        '....r...',
        '........',
        '........',
        'R...K..R']
      expect(validate.canMove(board, log, 'e1-c1')).toBe(false)
    })

    it('it cannot castle left through check', () => {
      const board = [
        '........',
        '........',
        '........',
        '........',
        '...r....',
        '........',
        '........',
        'R...K..R']
      expect(validate.canMove(board, log, 'e1-c1')).toBe(false)
    })

    it('it cannot castle left into check', () => {
      const board = [
        '........',
        '........',
        '........',
        '........',
        '..r.....',
        '........',
        '........',
        'R...K..R']
      expect(validate.canMove(board, log, 'e1-c1')).toBe(false)
    })

    it('it cannot castle right from check', () => {
      const board = [
        '........',
        '........',
        '........',
        '........',
        '....r...',
        '........',
        '........',
        'R...K..R']
      expect(validate.canMove(board, log, 'e1-g1')).toBe(false)
    })

    it('it cannot castle right through check', () => {
      const board = [
        '........',
        '........',
        '........',
        '........',
        '.....r..',
        '........',
        '........',
        'R...K..R']
      expect(validate.canMove(board, log, 'e1-g1')).toBe(false)
    })

    it('it cannot castle right into check', () => {
      const board = [
        '........',
        '........',
        '........',
        '........',
        '......r.',
        '........',
        '........',
        'R...K..R']
      expect(validate.canMove(board, log, 'e1-g1')).toBe(false)
    })
  })

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
      expect(validate.applyMove(board, 'e8-g8')).toEqual([
        'r....rk.',
        'pppppppp',
        '........',
        '........',
        '........',
        '........',
        'PPPPPPPP',
        'R...K..R']
      )
    })

    it('black castle left', () => {
      expect(validate.applyMove(board, 'e8-c8')).toEqual([
        '..kr...r',
        'pppppppp',
        '........',
        '........',
        '........',
        '........',
        'PPPPPPPP',
        'R...K..R']
      )
    })

    it('white castle right', () => {
      expect(validate.applyMove(board, 'e1-g1')).toEqual([
        'r...k..r',
        'pppppppp',
        '........',
        '........',
        '........',
        '........',
        'PPPPPPPP',
        'R....RK.']
      )
    })

    it('white castle left', () => {
      expect(validate.applyMove(board, 'e1-c1')).toEqual([
        'r...k..r',
        'pppppppp',
        '........',
        '........',
        '........',
        '........',
        'PPPPPPPP',
        '..KR...R']
      )
    })
  })
})
