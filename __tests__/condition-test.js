const ConditionImport = require('../src/condition')
const Condition = ConditionImport.default
const MatchModifiers = ConditionImport.MatchModifiers

describe('Condition', () => {
  let myServerMock

  beforeEach(() => {
    myServerMock = {
      channels: {
        find: jest.fn((key, value) => null)
      }
    }
  })

  describe('Constructor', () => {
    it('sets all properties when no condition values are given', () => {
      let cond = new Condition(myServerMock, {})

      expect(cond.data).toEqual({})
      expect(cond.modifiers).toEqual([])
      expect(cond.server).toBe(myServerMock)
      expect(cond.matchSuccess).toBeTruthy()
      expect(cond.actions).toEqual([])
    })

    it('handles no given data', () => {
      let cond = new Condition(myServerMock, {})

      expect(cond.data).toEqual({})
      expect(cond.modifiers).toEqual([])
      expect(cond.server).toBe(myServerMock)
    })

    it('handles given basic data', () => {
      const values = {
        message: 'my test message',
        action: 'reply',
        reply: 'my test reply'
      }
      let cond = new Condition(myServerMock, values)

      expect(cond.data).toEqual(values)
    })

    it('handles modifiers in keys', () => {
      let cond1 = new Condition(myServerMock, {
        'message (regex)': 'my test message'
      })

      expect(cond1.data).toEqual({
        message: 'my test message'
      })
      expect(cond1.modifiers).toEqual(['regex'])
      expect(cond1.matchSuccess).toBeTruthy()

      let cond2 = new Condition(myServerMock, {
        '~message': 'my test message'
      })

      expect(cond2.data).toEqual({
        message: 'my test message'
      })
      expect(cond2.modifiers).toEqual(['inverse'])
      expect(cond2.matchSuccess).toBeFalsy()

      let cond3 = new Condition(myServerMock, {
        '~message (regex)': 'my test message'
      })

      expect(cond3.data).toEqual({
        message: 'my test message'
      })
      expect(cond3.modifiers).toEqual(['inverse', 'regex'])
      expect(cond3.matchSuccess).toBeFalsy()

      // Test following cases:
      // message (inverse,regex)
      // message (inverse, regex)
      // message (inverse , regex)
      ;[',', ', ', ' , '].forEach(separator => {
        let modifiers = ['inverse', 'regex'].join(separator)
        let cond = new Condition(myServerMock, {
          [`message (${modifiers})`]: 'my test message'
        })

        expect(cond.data).toEqual({
          message: 'my test message'
        })
        expect(cond.modifiers).toEqual(['inverse', 'regex'])
      })
    })

    it('handles actions', () => {
      let cond1 = new Condition(myServerMock, {
        action: 'reply'
      })
      let cond2 = new Condition(myServerMock, {
        action: 'reply+warn'
      })
      let cond3 = new Condition(myServerMock, {
        action: 'reply+warn+remove'
      })
      let cond4 = new Condition(myServerMock, {
        action: 'reply + warn+ remove'
      })

      expect(cond1.data).toEqual({
        action: 'reply'
      })
      expect(cond1.actions).toEqual(['reply'])
      expect(cond2.data).toEqual({
        action: 'reply+warn'
      })
      expect(cond2.actions).toEqual(['reply', 'warn'])
      expect(cond3.data).toEqual({
        action: 'reply+warn+remove'
      })
      expect(cond3.actions).toEqual(['reply', 'warn', 'remove'])
      expect(cond4.data).toEqual({
        action: 'reply + warn+ remove'
      })
      expect(cond4.actions).toEqual(['reply', 'warn', 'remove'])
    })
  })

  describe('validateKeys', () => {
    it('throws an error when required properties are missing', () => {
      let cond = new Condition(myServerMock, {})

      expect(() => {
        cond.validateKeys()
      }).toThrowError(/Required property missing/)
    })
  })

  describe('validateModifiers', () => {
    it('throws an error when 2 match modifiers are given', () => {
      let cond = new Condition(myServerMock, {})

      expect(() => {
        cond.validateModifiers()
      }).not.toThrow()
      expect(cond.matchPattern).toBe(MatchModifiers.includes)
    })
  })

  describe('validateActions', () => {
    it('throws an error when no action is given', () => {
      let cond = new Condition(myServerMock, {})

      expect(() => {
        cond.validateActions()
      }).toThrowError('At least 1 action is required')
    })
  })

  describe('hasRemoveCondition', () => {
    it('returns false if no action is given', () => {
      let cond = new Condition(myServerMock, {})

      expect(cond.hasRemoveAction()).toBeFalsy()
    })

    it('returns false if actions does not contain remove', () => {
      let cond1 = new Condition(myServerMock, {
        action: 'reply'
      })
      let cond2 = new Condition(myServerMock, {
        action: 'warn'
      })
      let cond3 = new Condition(myServerMock, {
        action: 'reply+warn'
      })

      expect(cond1.hasRemoveAction()).toBeFalsy()
      expect(cond2.hasRemoveAction()).toBeFalsy()
      expect(cond3.hasRemoveAction()).toBeFalsy()
    })

    it('returns true if remove action is given', () => {
      let cond1 = new Condition(myServerMock, {
        action: 'remove'
      })
      let cond2 = new Condition(myServerMock, {
        action: 'warn+remove'
      })
      let cond3 = new Condition(myServerMock, {
        action: 'reply+remove+warn'
      })

      expect(cond1.hasRemoveAction()).toBeTruthy()
      expect(cond2.hasRemoveAction()).toBeTruthy()
      expect(cond3.hasRemoveAction()).toBeTruthy()
    })
  })

  describe('prepareRegexString', () => {
    let cond

    beforeEach(() => {
      cond = new Condition(myServerMock, {})
    })

    it('does not modify letters', () => {
      let prepared = cond.prepareRegexString('abcdefghijklmnopqrstuvwxyz')
      let expected = 'abcdefghijklmnopqrstuvwxyz'
      expect(prepared).toBe(expected)
    })

    it('does modify characters used by regex', () => {
      let prepared = cond.prepareRegexString('[]-\/^$*+?.()|{}')
      let expected = '\\[\\]\\-\\/\\^\\$\\*\\+\\?\\.\\(\\)\\|\\{\\}'
      expect(prepared).toBe(expected)
    })
  })

  describe('formatMatchPattern', () => {
    let cond

    beforeEach(() => {
      cond = new Condition(myServerMock, {})
    })

    it('replaces parameter with plain text', () => {
      let formatted = cond.formatMatchPattern('{0}', 'plain text value')
      let expected = '(plain text value)'
      expect(formatted).toBe(expected)
    })

    it('replaces parameter with multiple plain text values', () => {
      let formatted = cond.formatMatchPattern('{0}', ['plain', 'text', 'values'])
      let expected = '(plain|text|values)'
      expect(formatted).toBe(expected)
    })

    it('replaces parameter with regex as plain text', () => {
      let formatted = cond.formatMatchPattern('{0}', 'te?st')
      let expected = '(te\\?st)'
      expect(formatted).toBe(expected)
    })

    it('replaces parameter with multiple regex as plain text values', () => {
      let formatted = cond.formatMatchPattern('{0}', ['te?st', 'another', '[a|b]'])
      let expected = '(te\\?st|another|\\[a\\|b\\])'
      expect(formatted).toBe(expected)
    })

    it('replaces parameter with regex', () => {
      cond.modifiers.push('regex')
      let formatted = cond.formatMatchPattern('{0}', 'te?st')
      let expected = '(te?st)'
      expect(formatted).toBe(expected)
    })

    it('replaces parameter with multiple regex values', () => {
      cond.modifiers.push('regex')
      let formatted = cond.formatMatchPattern('{0}', ['te?st', 'another', '[a|b]'])
      let expected = '(te?st|another|[a|b])'
      expect(formatted).toBe(expected)
    })
  })

  describe('matchesAgainstMessage', () => {
    describe('with channels', () => {})

    describe('with message', () => {
      it('returns true if message matches message condition', () => {
        let cond = new Condition(myServerMock, {
          message: 'test message'
        })
        let message = {
          content: 'this is a test message'
        }

        cond.validateModifiers()

        expect(cond.matchesAgainstMessage(message)).toBeTruthy()
      })

      it('returns true if message matches message condition, with inverse', () => {
        let cond = new Condition(myServerMock, {
          '~message': 'not found message'
        })
        let message = {
          content: 'this is a test message'
        }

        cond.validateModifiers()

        expect(cond.matchesAgainstMessage(message)).toBeTruthy()
      })

      it('returns false if message does not match message condition', () => {
        let cond = new Condition(myServerMock, {
          'message': 'not found message'
        })
        let message = {
          content: 'this is a test message'
        }

        cond.validateModifiers()

        expect(cond.matchesAgainstMessage(message)).toBeFalsy()
      })

      it('returns false if message does not match message condition, with inverse', () => {
        let cond = new Condition(myServerMock, {
          '~message': 'test message'
        })
        let message = {
          content: 'this is a test message'
        }

        cond.validateModifiers()

        expect(cond.matchesAgainstMessage(message)).toBeFalsy()
      })
    })
  })

  describe('runActionsAgainstMessage', () => {})

  describe('runAgainstMessage', () => {})
})
