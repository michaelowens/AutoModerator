/* @flow */

import type {Action} from '../action'
import DiscordJS from 'discord.js'
import Condition from '../condition'

/*:: (x: DmAction) => (x: Action) */
export default class DmAction {
  run(condition: Condition, message: DiscordJS.Message) {
    if (!condition.data.dm) {
      return
    }

    const dmMessage = this.getFormattedMessage(condition, message)

    message.author.sendMessage(dmMessage)
      .catch(e => console.error(e.toString))
  }

  getFormattedMessage(condition: Condition, message: DiscordJS.Message) {
    return condition.data.dm
      .replace('{user}', message.author.username)
  }
}
