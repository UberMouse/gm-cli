const t = require('tcomb')

const TrackResult = t.struct({
  title: t.String,
  artist: t.String,
  album: t.String,
  trackNumber: t.Number,
  genre: t.String,
  nid: t.String
})

const ArtistResult = t.struct({})
const AlbumResult = t.struct({
  name: t.String,
  artist: t.String,
  year: t.Number,
  albumId: t.String
})

const SearchResultTypes = {
  track: '1',
  album: '3'
}

const Track = t.struct({
  title: t.String,
  album: t.String,
  artist: t.String,
  genre: t.String,
  durationMillis: t.String,
  playCount: t.Number,
  nid: t.String
  // TODO: Figure out shape
  //albumArtRef: t.Object
})

module.exports = {
  TrackResult,
  AlbumResult,
  ArtistResult,
  SearchResultTypes,
  Track
}