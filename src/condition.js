/* @flow */

import DiscordJS from 'discord.js'
import Discord from './bot/discord'
import Config from './config'
import {ActionFactory} from './action'
import type {Action} from './action'

export type ConditionValues = {
  action: string,
  message: string | string[],
  domain: string[],
  command: string,
  channels: string[],
  reply: string,
  warn: string,
  warn_user: string,
  modifiers: string[],
  dm: string,
  priority: number,
  user: {
    warning?: string,
    role?: string
  }
}

type ConditionError =
  | "UNEXPECTED_TYPE"

export const matchModifiers = {
  'full-exact': '^{0}$',
  'full-text': '^\W*{0}\W*$',
  'includes': '{0}',
  'includes-word': '(?:^|\W|\b){0}(?:$|\W|\b)',
  'starts-with': '^{0}',
  'ends-with': '{0}$'
}
export const validModifiers = ['inverse', 'regex', 'case-sensitive']
export const validKeys = [
  'action', 'message', 'reply', 'user', 'domain', 'channels', 'command', 'warn',
  'warn_user', 'modifiers', 'dm'
]

export const defaultConditionValues: ConditionValues = {
  action: '',
  message: [],
  reply: '',
  user: {},
  channels: [],
  domain: [],
  command: '',
  modifiers: [],
  warn: '',
  warn_user: '',
  dm: '',
  priority: 0
}

export default class Condition {
  server: DiscordJS.Guild
  data: ConditionValues
  modifiers: string[]
  matchSuccess: boolean
  matchPattern: string
  actions: string[]

  constructor(server: DiscordJS.Guild, values: ConditionValues) {
    this.data = values
    this.server = server
    this.modifiers = values.modifiers || []
    this.matchSuccess = true
    this.actions = []

    // strip modifiers from key
    for (let k in this.data) {
      let newKey = k
      if (k.startsWith('~')) {
        this.modifiers.push('inverse')
        newKey = k.substring(1)
      }

      const modifierMatch = newKey.match(/^(\w+)\s*(?:\((.+?)\))?/)
      if (modifierMatch && typeof modifierMatch[2] !== 'undefined') {
        newKey = modifierMatch[1]

        let modifiers = modifierMatch[2].split(',')
        modifiers.forEach(modifier => {
          this.modifiers.push(modifier.trim())
        })
      }

      if (newKey !== k) {
        this.data[newKey] = this.data[k]
        delete this.data[k]
      }
    }

    if (this.modifiers.indexOf('inverse') > -1) {
      this.matchSuccess = false
    }

    // get actions
    if (this.data.action) {
      this.data.action.split('+').forEach(action => {
        this.actions.push(action)
      })
    }
  }

  runAgainstMessage(message: DiscordJS.Message) {
    if (this.matchesAgainstMessage(message)) {
      // run actions
      console.log(`Run actions: ${this.data.action}`)
      this.runActionsAgainstMessage(message)
      return true
    }

    return false
  }

  runActionsAgainstMessage(message: DiscordJS.Message) {
    this.actions.forEach(type => {
      try {
        const action: Action = ActionFactory.fromType(type)
        // const a: Action = new ActionClass(message)
        action.run(this, message)
      } catch (e) {
        console.error(e.toString())
      }
    })
  }

  matchesAgainstMessage(message: DiscordJS.Message) {
    if ('channels' in this.data) {
      if (!(message.channel instanceof DiscordJS.TextChannel)) {
        return
      }

      if (this.data.channels.indexOf(message.channel.name) === -1) {
        return false
      }
    }

    if ('message' in this.data) {
      const matchPattern = this.formatMatchPattern(this.matchPattern, this.data.message)
      // console.log(`match against ${matchPattern}`)
      const caseInsensitive = this.modifiers.indexOf('case-sensitive') === -1

      const matcher = new RegExp(matchPattern, caseInsensitive ? 'i' : undefined)
      const match = matcher.test(message.content)
      return match === this.matchSuccess
    }
  }

  formatMatchPattern(pattern: string, value: string | string[]) {
    if (this.modifiers.indexOf('regex') === -1) {
      if (Array.isArray(value)) {
        value = value.map(val => this.prepareRegexString(val))
      } else {
        value = this.prepareRegexString(value)
      }
    }

    if (Array.isArray(value)) {
      value = value.join('|')
    }

    return this.matchPattern.replace('{0}', `(${value})`)
  }

  prepareRegexString(value: string) {
    return value.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&')
  }

  isValid() {
    try {
      this.validateKeys()

      // this.validateType(this.data, 'message', 'array') // could be string or array?
      this.validateType(this.data, 'modifiers', 'array')
      this.validateType(this.data, 'domain', 'array')
      this.validateType(this.data, 'action', 'string')
      this.validateType(this.data, 'reply', 'string')
      this.validateType(this.data, 'command', 'string')
      // this.validateType(this.data, 'warn', 'string') // could be string or number?
      this.validateType(this.data, 'warn_user', 'string')
      this.validateType(this.data, 'dm', 'string')
      this.validateType(this.data, 'user', 'object')
      this.validateType(this.data, 'priority', 'number')

      // validate user conditions
      if (this.data.user) {
        this.validateType(this.data.user, 'warning', 'string')
        this.validateType(this.data.user, 'role', 'string')
      }

      this.validateModifiers()
      // this.validateActions()

      return true
    } catch (e) {
      console.log(e)
      const channel = this.server.channels.find('name', Config.get('discord.config_channel'))

      if (channel instanceof DiscordJS.TextChannel) {
        channel.sendMessage(e + `\n\nIn condition:\n\`\`\`${JSON.stringify(this.data)}\`\`\``)
      }
      return false
    }
  }

  validateKeys() {
    for (const key in this.data) {
      if (validKeys.indexOf(key) === -1) {
        throw new Error(`Invalid property: ${key}`)
      }
    }
  }

  validateModifiers() {
    let matchModifierCount = 0
    let modifier: string = ''
    const modifierList = Object.keys(matchModifiers)
    const allModifiers = validModifiers.concat(modifierList)

    this.modifiers.forEach(key => {
      if (allModifiers.indexOf(key) === -1) {
        throw new Error(`Invalid modifier: ${key}`)
      }

      if (key in matchModifiers) {
        matchModifierCount++
        modifier = key

        if (matchModifierCount > 1) {
          throw new Error(`Multiple match modifiers found, please only use **one** of the following modifiers:\n\`${modifierList.join(', ')}\``)
        }
      }
    })

    if (!modifier) {
      modifier = 'includes'
    }

    this.matchPattern = matchModifiers[modifier]
  }

  validateType(obj: Object, key: string, expectedType: string) {
    if (!(key in obj)) {
      return
    }

    let value = obj[key]

    if (expectedType === 'number') {
      value = parseInt(value)
      if (!Number.isNaN(value)) {
        throw new Error(`${key} must be an integer, but got ${typeof value} (${value})`)
      }
      return
    }

    if (expectedType === 'array') {
      if (!Array.isArray(value)) {
        throw new Error(`${key} must be an array, but got ${typeof value} (${value})`)
      }
      return
    }

    if (!(typeof value === expectedType)) {
      console.error(this.data)
      throw new Error(`${key} must be ${expectedType}, but got ${typeof value} (${value})`)
    }
  }

  hasRemoveAction() {
    return this.actions.some(action => action === 'remove')
  }
}
