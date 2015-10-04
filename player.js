const spawn = require('child_process').spawn
const Promise = require('bluebird')
const EventEmitter = require('events').EventEmitter

class Player {
  get currentPercentage() {
    return this._currentPercentage
  }

  set currentPercentage(newPercentage) {
    // TODO: figure out where this undefined is coming from
    if(newPercentage == null) return
    if(newPercentage >= 98) this.emitter.emit('finish')
    this._currentPercentage = newPercentage
  }

  constructor(hookStdOut) {
    this.mplayer = null
    this.mplayerCreated = false
    this.emitter = new EventEmitter()
    this._currentPercentage = 0
    this.hookStdOut = hookStdOut
  }

  play(file, append = false) {
    // TODO: Figure out why mplayer exits in slave mode if no file is passed
    // or why passing '-' doesn't let you supply an initial file on stdin
    if(!this.mplayerCreated) {
      this.mplayer = spawn('mplayer', ['-slave', file])
      this.hookStdOut(this.mplayer)
      this.mplayerCreated = true
    }
    else
      this.sendCommand(`loadfile ${file}`)

    return new Promise((resolve) => {
      this.emitter.on('finish', resolve)
    });
  }

  sendCommand(command) {
    if(!this.mplayerCreated) {
      console.log('mPlayer needs to be created by calling play first!')
      return
    }

    this.mplayer.stdin.write(command + '\n')
  }
}

function hookStdOut(mplayer) {
  mplayer.stdout.on('data', readStdIn)
}

const player = new Player(hookStdOut)

// TODO: This doesn't capture decimal places
const percentageRegex = /A:\s+([0-9]+).*of ([0-9]+).*/
function parsePercentage(line) {
  if(!percentageRegex.test(line)) return

  const [ignored, progress, length] = percentageRegex.exec(line)

  player.currentPercentage = Math.floor((progress/length) * 100)
}

function readStdIn(line) {
  player.sendCommand('')
  player.currentPercentage = parsePercentage(line)  
}

module.exports = player