const Promise = require('bluebird'); Promise.longStackTraces()
const pm = new (require('playmusic'))(); Promise.promisifyAll(pm)
const fs = require('fs'); Promise.promisifyAll(fs)
const Player = require('./player')
const request = require('request')
const path = require('path')
const mkdirp = Promise.promisify(require('mkdirp'))
const _ = require('lodash')
const config = require('./config')
const ChildProcess = require('child_process')
const {TrackResult, 
       AlbumResult, 
       ArtistResult, 
       SearchResultTypes,
       Track} = require('./concepts')

const searchFilters = {
  track: (result) => result.type === SearchResultTypes.track,
  album: (result) => result.type === SearchResultTypes.album
}

const argRunners = {
  'login': ([email, password]) => {
    pm.loginAsync({email, password})
    .then((loginToken) => {
      fs.writeFileAsync('.login-token', JSON.stringify(loginToken))
      .then(() => console.log('login token created, you will not need to login again unless the .login-token files is deleted'))
    })
    .catch((e) => {
      console.log('Trouble logging in, probably invalid login credentials');
      console.log(err)
      process.exit(-1);
    })
  },
  'download-song': ([artist, song]) => {
    search(`${song} - ${artist}`, searchFilters.track)
    .then(download)
    .then(Player.play)
  },
  'download-album': ([artist, album]) => {
    search(`${album} - ${artist}`, searchFilters.album)
    .then(downloadAlbum)
    .then((tracks) => {
      // TODO: figure out how to do make mplayer do this properly
    })   
  }
}

function search(query, filter = () => true) {
  return (
    pm.searchAsync(query, 1)
    .then((data) => {
      return _.chain(data.entries).filter(filter).map((result) => {
        const mapping = {
          [SearchResultTypes.track]: (result) => TrackResult(result.track),
          [SearchResultTypes.album]: (result) => AlbumResult(result.album)
        }
        if(mapping[result.type] == null) return null;

        return mapping[result.type](result)
      }).compact().first().value()
    })
  )
}

// TODO: Show progress bar in UI, will need to stack to support album downloads
function download(track) {
  const trackPath = buildTrackPath(track)
  const trackDirectory = path.dirname(trackPath)

  if(fs.existsSync(trackPath))
    Promise.resolve(trackPath)

  return (
    pm.getStreamUrlAsync(track.nid)
    .then(async (trackUrl) => {
      await mkdirp(trackDirectory)
      await new Promise((resolve, reject) => {
          request(trackUrl)
          .on('end', resolve)
          .pipe(fs.createWriteStream(trackPath))
      })

      return trackPath
    })
  )
}

function downloadAlbum(album) {
  return new Promise((resolve) => {
    pm.getAlbumAsync(album.albumId, true)
    .then((playAlbum) => {
      const tracks = playAlbum.tracks.map(Track)
      Promise.all(tracks.map(download)).then(resolve)
    })
  })
}

function getTrackFilename (track) {
  return sanitizeFilename(track.title + '.mp3');
}

function getAlbumDirectory (album) {
  return path.join(
    config.music_root,
    sanitizeFilename(album.artist),
    sanitizeFilename(album.name)
  );
}

function getTrackDirectory (track) {
  return path.join(
    config.music_root,
    sanitizeFilename(track.artist),
    sanitizeFilename(track.album)
  );
}

function buildTrackPath(track) {
  return path.resolve(
    path.join(
      getTrackDirectory(track),
      getTrackFilename(track)
    )
  );
}

function sanitizeFilename (filename) {
  return filename.replace(/(\/|\?)/g, '');
}

function processCommandLine() {
  const args = _.drop(process.argv, 2)
  argRunners[_.first(args)](_.rest(args)) 
}

function boot() {
  if(fs.existsSync('.login-token')) {
    const loginToken = JSON.parse(fs.readFileSync('.login-token'))
    pm.initAsync(loginToken)
    .then(() => {
      console.log('logged in with login token')
    })
    .catch((e) => {
      console.log('login token is a dud')
      process.exit(-2) 
    })
    .then(processCommandLine)
    .catch((e) => {
      console.log('error running command line operation')
      console.log(e.stack)
    })

  }
  else {
    processCommandLine()
  }
}

module.exports = boot