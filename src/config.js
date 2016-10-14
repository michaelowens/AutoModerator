/* @flow */

import Promise from 'bluebird'
import yaml from 'js-yaml'
import fs from 'fs'

const fsp: any = Promise.promisifyAll(fs)

class Config {
  parsed: Object

  load(): Promise<any> {
    return new Promise((resolve, reject) => {
      fsp.readFileAsync('config.yml', 'utf8')
        .then(contents => {
          this.parsed = yaml.safeLoad(contents)
          resolve(this.parsed)
        })
        .catch(err => {
          reject(err)
        })
    })
  }

  get(path?: string, def?: any): any {
    if (!path) {
      return this.parsed
    }

    let part: string
    let parts: string[] = path.split('.')
    let option = this.parsed

    while (parts.length > 0 && option) {
      part = parts.splice(0, 1)[0]
      option = option[part]
    }

    return option || def
  }
}

export default new Config
