'use strict'

import engineFactory from '../src/index'

describe('Engine: run', () => {
  let engine

  let condition21 = {
    any: [{
      fact: 'age',
      operator: 'greaterThanInclusive',
      value: 21
    }]
  }
  let condition75 = {
    any: [{
      fact: 'age',
      operator: 'greaterThanInclusive',
      value: 75
    }]
  }

  beforeEach(() => {
    engine = engineFactory()
  })

  describe('independent evaluations', () => {
    it('treats each evaluateRule() independently', async () => {
      const rule = factories.rule({ conditions: condition21 })
      const results = await Promise.all([50, 10, 12, 30, 14, 15, 25].map((age) => engine.evaluateRule(rule, {age})))
      expect(results).to.eql([true, false, false, true, false, false, true])
    })

    it('allows runtime facts to override engine facts for a single evaluateRule()', async () => {
      engine.addFact('age', 30)

      const rule = factories.rule({ conditions: condition75 })

      let result
      result = await engine.evaluateRule(rule, { age: 85 }) // override 'age' with runtime fact
      expect(result).to.equal(true)

      result = await engine.evaluateRule(rule) // no runtime fact; revert to age: 30
      expect(result).to.equal(false)

      result = await engine.evaluateRule(rule, { age: 2 }) // override 'age' with runtime fact
      expect(result).to.equal(false)
    })
  })
})
