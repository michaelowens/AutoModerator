/* NOT USED, so no flow */

import Config from '../config'
import * as Promise from 'bluebird'
import * as fs from 'fs'
import * as path from 'path'
import Discord from './discord'

// const availableMiddleware = {
//   discord: require('./middleware/discord').default
// }

const fsp: any = Promise.promisifyAll(fs)

class BotManager {
  // bot: Discord

  constructor() {
    // this.bot = null
  }

  // connectAll() {
  //   this.bots.map(bot => {
  //     bot.connect()
  //   })
  // }

  // loadFromConfig() {
  //   const botsConfig: any = Config.get('bots')
  //   let botPromises: Promise<any>[] = []
  //
  //   for (var name in botsConfig) {
  //     const botConfig: Object = botsConfig[name]
  //
  //     console.log(`Found config for ${name}, ${botConfig.active ? 'initialising' : 'but not active'}`)
  //
  //     if (botConfig.active) {
  //       botPromises.push(this.initialiseBot(name, botConfig))
  //     }
  //   }
  //
  //   Promise.all(botPromises)
  //     .then(() => {
  //       this.bots.map(bot => this.bindEvents(bot))
  //       this.connectAll()
  //     })
  // }
  //
  // implementationAvailable(name: string): Promise<any> {
  //   return fsp.accessAsync(path.join('src', 'bot', 'middleware', `${name}.js`), fsp.constants.F_OK)
  // }
  //
  // initialiseBot(name: string, config: Object): Promise<any> {
  //   return this.implementationAvailable(name)
  //     .then(() => {
  //       this.add(new availableMiddleware[name](config))
  //     })
  //     .catch(err => {
  //       console.error(`Implementation not found: ${name}`)
  //     })
  // }
  //
  // bindEvents(bot: Middleware) {
  //   bot.on('message', this.onMessage.bind(this))
  // }
  //
  // onMessage(e: Message) {
  //   console.log('manager got message', e)
  // }
}

export default new BotManager
