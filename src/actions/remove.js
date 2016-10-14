/* @flow */

import type {Action} from '../action'
import DiscordJS from 'discord.js'
import Condition from '../condition'

/*:: (x: RemoveAction) => (x: Action) */
export default class RemoveAction {
  run(condition: Condition, message: DiscordJS.Message) {
    message.delete()
      .catch(e => console.error(e.toString()))
  }
}
