/* @flow */

import type {Action} from '../action'
import DiscordJS from 'discord.js'
import Condition from '../condition'

/*:: (x: ReplyAction) => (x: Action) */
export default class ReplyAction {
  run(condition: Condition, message: DiscordJS.Message) {
    if (!condition.data.reply) {
      return
    }

    const replyMessage = this.getFormattedMessage(condition, message)

    message.reply(replyMessage)
      .catch(e => console.error(e.toString))
  }

  getFormattedMessage(condition: Condition, message: DiscordJS.Message) {
    return condition.data.reply
      .replace('{user}', message.author.username)
  }
}
