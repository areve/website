import { app, user } from './vue-utest'
import Chess from '@/components/Chess/Chess.vue'

describe('Chess.vue', () => {
  const originalBoard =
    'rnbqkbnr\n' +
    'pppppppp\n' +
    '........\n' +
    '........\n' +
    '........\n' +
    '........\n' +
    'PPPPPPPP\n' +
    'RNBQKBNR'
  beforeEach(() => {
    app.shallow(Chess)
  })

  it('has a title "Chess"', () => {
    user.seeTitle('Chess')
  })

  it('has a board string representation', () => {
    user.see(originalBoard)
  })

  describe('Pawn', () => {
    it('moves forward one space', async () => {
      await user.enter('Move', 'a2-a3')
      await user.press('Go')
      user.see('1. a3')
      user.see(
        'rnbqkbnr\n' +
        'pppppppp\n' +
        '........\n' +
        '........\n' +
        '........\n' +
        'P.......\n' +
        '.PPPPPPP\n' +
        'RNBQKBNR')
    })

    it('moves forward two spaces', async () => {
      await user.enter('Move', 'a2-a4')
      await user.press('Go')
      user.see('1. a4')
      user.see(
        'rnbqkbnr\n' +
        'pppppppp\n' +
        '........\n' +
        '........\n' +
        'P.......\n' +
        '........\n' +
        '.PPPPPPP\n' +
        'RNBQKBNR')
    })

    it('does not move forward more than two spaces', async () => {
      const to = 'a' + (8 - app.random(3))
      await user.enter('Move', 'a2-' + to)
      await user.press('Go')
      user.notSee('a2-' + to)
      user.see(originalBoard)
    })

    it('does not move to another rank', async () => {
      const from = String.fromCharCode(97 + (7 - app.random(7))) + '2'
      await user.enter('Move', from + '-a3')
      await user.press('Go')
      user.notSee(from + '-a3')
      user.see(originalBoard)
    })
  })
})
