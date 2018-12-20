# Engine

The Engine stores and executes rules, emits events, and maintains state.

## Methods

### constructor([Array rules], Object [options])

```js
let Engine = require('json-rules-engine').Engine

let engine = new Engine()

// initialize with rules
let engine = new Engine([Array rules])

// initialize with options
let options = {
  allowUndefinedFacts: false
};
let engine = new Engine([Array rules], options)
```

#### Options

`allowUndefinedFacts` - By default, when a running engine encounters an undefined fact,
an exception is thrown.  Turning this option on will cause the engine to treat
undefined facts as falsey conditions.  (default: false)

### engine.addFact(String id, Function [definitionFunc], Object [options])

```js
// constant facts:
engine.addFact('speed-of-light', 299792458)

// facts computed via function
engine.addFact('account-type', function getAccountType(params, almanac) {
  // ...
})

// facts with options:
engine.addFact('account-type', function getAccountType(params, almanac) {
  // ...
}, { cache: false, priority: 500 })
```

### engine.removeFact(String id)

```js
engine.addFact('speed-of-light', 299792458)

// removes the fact
engine.removeFact('speed-of-light')
```

### engine.addRule(Rule instance|Object options)

Adds a rule to the engine.  The engine will execute the rule upon the next ```run()```

```js
let Rule = require('json-rules-engine').Rule

// via rule properties:
engine.addRule({
  name: 'Empty rule',
  conditions: {},
  event: {},
  priority: 1,                             // optional, default: 1
  onSuccess: function (event, almanac) {}, // optional
  onFailure: function (event, almanac) {}, // optional
  onError: function (error) {} // optional
})

// or rule instance:
let rule = new Rule()
engine.addRule(rule)
```

 ### engine.removeRule(Rule instance)

 Removes a rule from the engine.

```javascript
// adds a rule
let rule = new Rule()
engine.addRule(rule)

//remove it
engine.removeRule(rule)
```




### engine.addOperator(String operatorName, Function evaluateFunc(factValue, jsonValue))

Adds a custom operator to the engine.  For situations that require going beyond the generic, built-in operators (`equal`, `greaterThan`, etc).

```js
/*
 * operatorName - operator identifier mentioned in the rule condition
 * evaluateFunc(factValue, jsonValue) - compares fact result to the condition 'value', returning boolean
 *    factValue - the value returned from the fact
 *    jsonValue - the "value" property stored in the condition itself
 */
engine.addOperator('startsWithLetter', (factValue, jsonValue) => {
  if (!factValue.length) return false
  return factValue[0].toLowerCase() === jsonValue.toLowerCase()
})

// and to use the operator...
let rule = new Rule({
  name: 'Username validator',
  conditions: {
    all: [
      {
        fact: 'username',
        operator: 'startsWithLetter', // reference the operator name in the rule
        value: 'a'
      }
    ]
  }
})
```

See the [operator example](../examples/06-custom-operators.js)



### engine.removeOperator(String operatorName)

Removes a operator from the engine

```javascript
engine.addOperator('startsWithLetter', (factValue, jsonValue) => {
  if (!factValue.length) return false
  return factValue[0].toLowerCase() === jsonValue.toLowerCase()
})

engine.removeOperator('startsWithLetter');
```



### engine.run([Object facts], [Object options]) -> Promise (Events)

Runs the rules engine.  Returns a promise which resolves with the almanac when all rules have been run or rejects with 
error when there was something wrong. The almanac contains the `success-events` fact, which is an array of all 
successfully evaluated events.

```js
// run the engine
engine.run()

// with constant facts
engine.run({ userId: 1 })

// returns the almanac which was used to evaluate the rules
engine
  .run({ userId: 1 })
  .then(function(almanac) {
    console.log(almanac)
    return almanac.factValue('success-events')
  })
  .then((events) => {
    console.log(events) // [{ type: 'event1', params: { hello: 'world' } }] 
  })
  .catch((error) => {
    console.log(error.rule.name) // if rule name is set, it will be added to the error object
    console.log(error.fact.name) // if the error happened while resolving a fact, it's name will be added to the error object
    console.log(error.operator.name) // if the error happened while executing an operator, it's name will be added to the error object
  })
```

### engine.stop() -> Engine

Stops the rules engine from running the next priority set of Rules.  All remaining rules will be resolved as undefined,
and no further events emitted.

Be aware that since rules of the *same* priority are evaluated in parallel(not series), other rules of
the same priority may still emit events, even though the engine has been told to stop.

```js
engine.stop()
```

There are two generic event emissions that trigger automatically:

#### ```engine.on('success', Function(Object event, Almanac almanac, RuleResult ruleResult))```

Fires when a rule passes. The callback will receive the event object, the current [Almanac](./almanac.md), and the [Rule Result](./rules.md#rule-results).

```js
engine.on('success', function(event, almanac, ruleResult) {
  console.log(event) // { type: 'my-event', params: { id: 1 }
})
```

#### ```engine.on('failure', Function(Object event, Almanac almanac, RuleResult ruleResult))```

Companion to 'success', except fires when a rule fails.  The callback will receive the event object, the current [Almanac](./almanac.md), and the [Rule Result](./rules.md#rule-results).

```js
engine.on('failure', function(event, almanac, ruleResult) {
  console.log(event) // { type: 'my-event', params: { id: 1 }
})
```

#### ```engine.on('error', Function(Error error))```

Event fires when an exception happens while evaluating a rule, a fact or executing an operator.  The callback will 
receive an Error object augmented with `rule.name` property, and `fact.name` or `operator.name` depending on where the
error happened.

```js
engine.on('error', function(error) {
  console.log(error.rule) // { name: 'Sample rule' }
  console.log(error.fact) // { name: 'my-custom-fact' }, optional
  console.log(error.operator) // { name: 'objectIncludesKeys' }, optional
})
```

### engine.evaluateRule(Rule instance|Object options, [Object facts]) -> Promise (Boolean)

Evaluates only the specified rule. Returns a promise which resolves with true if the rule evaluated successfully, false 
otherwise. Rejects with the same error object as in `engine.run`

```js
// evaluate the rule
engine
  .evaluateRule(rule)
  .then((result) => {
    console.log(result) // true or false
  })
  .catch((error) => {
    console.log(error.rule.name) // if rule name is set, it will be added to the error object
    console.log(error.fact.name) // if the error happened while resolving a fact, it's name will be added to the error object
    console.log(error.operator.name) // if the error happened while executing an operator, it's name will be added to the error object
  })

// with constant facts
engine
  .evaluateRule(rule, { userId: 1 })
  .then((result) => {
    console.log(result) // true or false
  })
