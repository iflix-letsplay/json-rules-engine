'use strict'

import deepClone from 'clone'

export default class RuleResult {
  constructor (conditions, event, priority) {
    this.conditions = deepClone(conditions)
    this.event = deepClone(event)
    this.priority = deepClone(priority)
    this.result = null
  }

  setResult (result) {
    this.result = result
    // set root condition result as well
    this.conditions.result = this.result
  }

  toJSON () {
    return {
      conditions: this.conditions.toJSON(),
      event: this.event,
      priority: this.priority,
      result: this.result
    }
  }
}
