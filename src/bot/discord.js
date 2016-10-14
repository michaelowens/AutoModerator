/* @flow */

import Config from '../config'
import DiscordJS from 'discord.js'
import EventEmitter from 'events'
import ServerConfig from './serverconfig'

type DiscordConfig = {
  active: boolean;
  token: string;
}

class Discord extends EventEmitter {
  bot: DiscordJS.Client
  config: DiscordConfig

  connect() {
    this.bot = new DiscordJS.Client()
    this.bindEvents()
    this.bot.login(Config.get('discord.token'))
  }

  bindEvents() {
    this.bot.on('ready', this.onReady.bind(this))
    this.bot.on('message', this.onMessage.bind(this))
    this.bot.on('messageUpdate', this.onMessageUpdate.bind(this))
    this.bot.on('messageDelete', this.onMessageDelete.bind(this))
    this.bot.on('messageDeleteBulk', this.onMessageDeleteBulk.bind(this))
    this.bot.on('channelDelete', this.onChannelDelete.bind(this))
  }

  loadServerConfigMessageLog() {
    const servers: DiscordJS.Guild[] = this.bot.guilds.array()

    servers.forEach((server: DiscordJS.Guild) => {
      this.loadServerConfig(server)
    })
  }

  loadServerConfig(server: DiscordJS.Guild) {
    const configChannel = server.channels.find('name', Config.get('discord.config_channel'))
    if (configChannel && configChannel instanceof DiscordJS.TextChannel) {
      configChannel.fetchMessages()
        .then(messages => {
          // clear messages by AutoModerator
          const deletePromises: Promise<any>[] = configChannel.messages.filter(message => message.author.id === this.bot.user.id).deleteAll()

          Promise.all(deletePromises)
            .then(() => {
              let config = configChannel.messages
                .array()
                .sort((a, b) => parseInt(a.id) - parseInt(b.id))
                .join('\n---\n')

              console.log(`load config for ${server.name}`)
              ServerConfig.saveConfig(server, config)
            })
            .catch(e => {
              console.error('Could not delete messages')
              console.error(e)
            })

          return null
        })
        .catch(err => {
          console.error(`Could not fetch config for ${server.name}`)
          console.error(err.toString())
        })
    }
  }

  checkServerConfigChange(message: DiscordJS.Message) {
    if (!(message.channel instanceof DiscordJS.TextChannel)) {
      return
    }

    const channel = message.channel
    if (channel.name === Config.get('discord.config_channel')) {
      this.loadServerConfig(channel.guild)
    }
  }

  onReady() {
    console.log(`Connected to Discord as ${this.bot.user.username}`)
    this.loadServerConfigMessageLog()
  }

  onMessage(message: DiscordJS.Message) {
    if (!(message.channel instanceof DiscordJS.TextChannel)) {
      return
    }

    const channel: DiscordJS.TextChannel = message.channel
    if (message.author.id !== this.bot.user.id) {
      this.checkServerConfigChange(message)

      if (channel.name !== Config.get('discord.config_channel')) {
        ServerConfig.checkMessage(message)
      }
    }

    if (message.content === 'ping') {
      message.reply('pong')
    }
  }

  onMessageUpdate(oldMessage: DiscordJS.Message, newMessage: DiscordJS.Message) {
    if (!(newMessage.channel instanceof DiscordJS.TextChannel)) {
      return
    }

    const channel = newMessage.channel
    if (channel.name === Config.get('discord.config_channel')) {
      this.checkServerConfigChange(oldMessage)
    } else {
      ServerConfig.checkMessage(newMessage)
    }
  }

  onMessageDelete(message: DiscordJS.Message) {
    if (message.author.id !== this.bot.user.id) {
      this.checkServerConfigChange(message)
    }
  }

  onMessageDeleteBulk(messages: DiscordJS.Message[]) {
    this.checkServerConfigChange(messages[0])
  }

  onChannelDelete(channel: DiscordJS.GuildChannel) {
    ServerConfig.clear(channel.guild)
  }
}

export default new Discord()
