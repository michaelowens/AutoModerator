/* @flow */

import DiscordJS from 'discord.js'
import Condition from './condition'

// TODO: load available actions from folder
export const AvailableActions = {
  'remove': require('./actions/remove').default,
  'reply': require('./actions/reply').default,
  'dm': require('./actions/dm').default
}

export interface Action {
  run(condition: Condition, message: DiscordJS.Message): void
}

export class ActionFactory {
  static fromType(type: string) {
    if (!(type in AvailableActions)) {
      throw new Error(`Action not found: ${type}`)
    }

    return new AvailableActions[type]
  }
}
