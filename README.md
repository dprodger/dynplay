dynplay
========

Spotify App that uses Echo Nest dynamic playlists

Installation
============

1. Ensure you have a Developer account: https://developer.spotify.com/technologies/apps/#developer-account
1. Ensure you have a ~/Spotify directory
1. Clone this repo into ~/Spotify/dynplay
1. Edit index.html to put in your own EN ID
1. Open Spotify
1. Navigate to spotify:app:dynplay
1. Go to the configuration panel, and enter your own API key (if you don't want to be limited to the test key). If desired, 
create a catalog as well (Taste Profile) or select one from your pre-existing set.

Notes
=====

1. ~~need to correctly deal with finding the best (earliest) track; also, with what if first track (or all tracks) are not found~~ - Done
2. ~~need to figure out how to auto-chain and play the "next" track~~ - Done
3. decide whether "Ban Artist" should also skip the currently playing song
4. implement UI to confirm banning of art/song
5. ~~hook up rating and favorite-ing~~ - Done (also, integrated into taste profile)
6. add lookahead songs to the embedded playlist, need to update these if any steering is done 

