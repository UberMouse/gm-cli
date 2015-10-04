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
  albumArtRef: t.String
})

const SearchResultTypes = {
  track: '1',
  album: '3'
}

module.exports = {
  TrackResult,
  AlbumResult,
  ArtistResult,
  SearchResultTypes
}