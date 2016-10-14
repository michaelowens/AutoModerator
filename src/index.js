/* @flow */

import Config from './config'
import Discord from './bot/discord'

Config.load()
  .then(() => {
    console.log('config loaded')
    Discord.connect()
    return null
  })
  .catch(err => {
    console.log('Error loading config, are you sure you created it?')
    console.error(err.toString())
  })
