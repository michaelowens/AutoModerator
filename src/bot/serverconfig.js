/* @flow */

import yaml from 'js-yaml'
import DiscordJS from 'discord.js'
import Condition from '../condition'
import Config from '../config'

class ServerConfig {
  configs: {
    [channel: string]: Condition[]
  }

  constructor() {
    this.configs = {}
  }

  saveConfig(server: DiscordJS.Guild, config: string) {
    this.configs[server.id] = []
    try {
      yaml.safeLoadAll(config, (doc: Object) => {
        this.addCondition(server, doc)
      })

      this.prioritiseConditions(server)
      console.log(`Config saved for ${server.name}`)
    } catch (e) {
      console.error(`Error loading config for channel`)
      console.error(e.toString())

      const channel = server.channels.find('name', Config.get('discord.config_channel'))

      if (channel instanceof DiscordJS.TextChannel) {
        channel.sendMessage(`An error occured while parsing config:\n\`\`\`${e}\`\`\``)
      }
    }
  }

  addCondition(server: DiscordJS.Guild, doc: Object) {
    const condition: Condition = new Condition(server, doc)

    if (condition.isValid()) {
      this.configs[server.id].push(condition)
    }
  }

  clear(server: DiscordJS.Guild) {
    delete this.configs[server.id]
  }

  checkMessage(message: DiscordJS.Message) {
    if (!this.configs[message.guild.id]) {
      // No config for server
      return
    }

    console.log('Check message:', message.content)

    for (let i = 0; i < this.configs[message.guild.id].length; i++) {
      const condition = this.configs[message.guild.id][i]
      const matched = condition.runAgainstMessage(message)

      if (matched && condition.hasRemoveAction()) {
        // Message has been removed, no need to check other actions
        break
      }
    }
  }

  prioritiseConditions(server: DiscordJS.Guild) {
    if (!this.configs[server.id]) {
      return
    }

    this.configs[server.id].sort((a: Condition, b: Condition) => {
      if (a.hasRemoveAction() && !b.hasRemoveAction()) {
        return -1
      } else if (!a.hasRemoveAction() && b.hasRemoveAction()) {
        return 1
      } else {
        return (a.data.priority < b.data.priority ? -1 : (a.data.priority > b.data.priority ? 1 : 0))
      }
    })
  }
}

export default new ServerConfig()
