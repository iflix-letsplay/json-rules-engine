'use strict'

import engineFactory from '../src/index'

describe('Engine: failure', () => {
  let engine

  let event = { type: 'generic' }
  beforeEach(() => {
    engine = engineFactory()
  })

  it('surfaces errors in rules and facts', () => {
    let determineDrinkingAgeRule = factories.rule({ name: 'Error rule',
      conditions: {
        any: [{
          fact: 'age',
          operator: 'greaterThanInclusive',
          value: 21
        }]
      },
      event })
    engine.addRule(determineDrinkingAgeRule)
    engine.addFact('age', (params, engine) => {
      throw new Error('problem occurred')
    })

    const promise = engine.run()

    return Promise.all([
      expect(promise).to.eventually.rejectedWith(/problem occurred/),
      promise.catch(err => {
        expect(err).to.have.deep.property('rule', { name: 'Error rule' })
        expect(err).to.have.deep.property('fact', { name: 'age' })
      })
    ])
  })

  it('surfaces errors in operators', () => {
    let determineDrinkingAgeRule = factories.rule({ name: 'Error rule',
      conditions: {
        any: [{
          fact: 'age',
          operator: 'errorOp',
          value: 21
        }]
      },
      event })
    engine.addRule(determineDrinkingAgeRule)
    engine.addFact('age', 23)
    engine.addOperator('errorOp', () => {
      throw new Error('major problem')
    })

    const promise = engine.run()

    return Promise.all([
      expect(promise).to.eventually.rejectedWith(/major problem/),
      promise.catch(err => {
        expect(err).to.have.deep.property('rule', { name: 'Error rule' })
        expect(err).to.have.deep.property('operator', { name: 'errorOp' })
      })
    ])
  })
})
