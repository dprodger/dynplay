var enSongs = [];
var enToSpotIds = {};

var apiKey = "N6E4NIOVYMTHNDM8J";

var counts = 0; // spinlock

var pl;

var sessionID;

var currentArtistID;
var currentArtistName;
var currenSongENID;
var currentTrackSpotifyID;
var currentTrackTitle;
var currentTrackYear;

var activePlaylist;

var sp;
var models;
var views;

var player;


function initialize() {
	sp = getSpotifyApi(1);
	models = sp.require('sp://import/scripts/api/models');
    views = sp.require("sp://import/scripts/api/views");

	player = models.player;
	
	setUpObserve();
	myplaylist = models.Playlist.fromURI();
}

function setUpObserve() {
	player.observe(models.EVENT.CHANGE, function(event) {
		console.log( "in observe; event.data.curtrack is " + event.data.curtrack );
		if( event.data.curtrack == true ) {
			console.log( "+++++ track has changed.");
//			getNextSong();
		}
	})
}

function makePlaylist() {
	var artist = $("#_artist").val();
	var artistHot = $("#_artist_hot").val();
	var songHot = $("#_song_hot").val();
	var variety = $("#_variety").val();
	
	var url = "http://developer.echonest.com/api/v4/playlist/dynamic/create?api_key=" + apiKey + "&callback=?";
	

	$.getJSON( url, 
		{
			"artist": artist,
			"format": "jsonp",
			'bucket': ['tracks', 'id:spotify-WW'],
			"limit": true,
			"artist_min_hotttnesss": artistHot,
			"song_min_hotttnesss": songHot,
			"variety": variety,
			"type": "artist-radio"
		},
		function(data) {
			console.log("=== in makePlaylist callback; received a response");
			var response = data.response;
			sessionId = response.session_id;
			$("#_session_id").val(sessionId);
			console.log( "got a session; it's " + sessionId )
			getNextSong();
		})
}

function getNextSong() {
	var url = "http://developer.echonest.com/api/v4/playlist/dynamic/next?api_key=" + apiKey + "&callback=?";

	$.getJSON( url, 
		{
			"session_id": sessionId,
			"format": "jsonp",
		},
		function(data) {
			console.log("=== in getNextSong; received a response");
			var response = data.response;
			var songs = response.songs;
			var song = songs[0];
			var tracks = song.tracks;
			
			getSpotifyTracks( song.id, tracks );
			
			// alert("title = " + song.title + " artist: " + song.artist_name);
			currentArtistID = song.artist_id;
			currentArtistName = song.artist_name;
			currentSongENID = song.id;
			currentTrackSpotifyID = "";
			currentTrackTitle = song.title;
			
			updateNowPlaying( song.artist_name, song.title, "n/a");
		})
	
}


function getSpotifyTracks( _soid, _tracks ) {
	var track = _tracks[0];
	var trackID = track.foreign_id.replace("spotify-WW", "spotify");
	
	var spT = models.Track.fromURI( trackID, function( track ) {
		console.log( "*** in getSpotifyTracks; checking track...")
		if( track.playable ) {
			console.log( "+++ it's good; playing it!");

			player.play( track );
		} else {
			console.log( "--- not valid.  Wha wha whaaa...");
		}
 	})
}


function skipTrack() {
	console.log("in skipTrack");
	var url = "http://developer.echonest.com/api/v4/playlist/dynamic/feedback?api_key=" + apiKey + "&callback=?";

	$.getJSON( url, 
		{
			"session_id": sessionId,
			"format": "jsonp",
			"skip_song": "last"	// ban the most-recently returned artist
		},
		function(data) {
			console.log("song skipped");
			getNextSong();
		})
}

function banArtist() {
	console.log("in banArtist");
	var url = "http://developer.echonest.com/api/v4/playlist/dynamic/feedback?api_key=" + apiKey + "&callback=?";

	$.getJSON( url, 
		{
			"session_id": sessionId,
			"format": "jsonp",
			"ban_artist": "last"	// ban the most-recently returned artist
		},
		function(data) {
			console.log("artist banned");
			
			var list = document.getElementById("banned_artists");
            var listitem = document.createElement("li");
            listitem.setAttribute('id', currentArtistID );
            listitem.innerHTML = currentArtistName;
            list.appendChild( listitem );
			
		})
}

function banSong() {
	console.log("in banSong");
	var url = "http://developer.echonest.com/api/v4/playlist/dynamic/feedback?api_key=" + apiKey + "&callback=?";

	$.getJSON( url, 
		{
			"session_id": sessionId,
			"format": "jsonp",
			"ban_song": "last"	// ban the most-recently returned artist
		},
		function(data) {
			console.log("song banned");

			var list = document.getElementById("banned_songs");
            var listitem = document.createElement("li");
            listitem.setAttribute('id', currenSongENID );
            listitem.innerHTML = currentTrackTitle + " by " + currentArtistName;
            list.appendChild( listitem );
			
		})
}

function updateNowPlaying( _artist, _title, _year ) {
	console.log( "in updateNowPlaying, artist is " + _artist );
	var np = $("#nowplaying");
	
	np.find( "#np_artist").text( _artist );
	np.find( "#np_song").text( _title );
	np.find( "#np_year").text( _year );
}

function lookupSpotifyID( _song ) {
	var url = "http://developer.echonest.com/api/v4/song/profile?api_key=N6E4NIOVYMTHNDM8J&callback=?";
	
	$.getJSON( url, 
		{
			"id": _song,
			"format": "jsonp",
			'bucket': ['tracks', 'id:spotify-WW'],
			"limit": true
		},
		function(data) {
//			console.log("=== in function for lookupSpotifyID for id " + _song );
			var response = data.response;
			var songs = response.songs;
			if(!songs[0] ) {
				var plItem = document.getElementById( _song );
				plItem.innerHTML = "EN: " + _song + " has no Spotify tracks at all.";
				console.log("ERROR: no songs returned for id " + _song);
			} else {
				var tracks = songs[0].tracks;
				findValidTrack( songs[ 0 ].id, tracks );
			}
			--counts;
		})
}

var trackCount = [];
var validTracks = [];

function findValidTrack( songID, tracks ) {
//	console.log("* in findValidTrack for " + songID + " and I have " + tracks.length + " tracks to check" );
	trackCount[ songID ] = 0;
	
	// set default so we know if none found
	var plItem = document.getElementById( songID );
	plItem.innerHTML = "<b><i>Song: " + songID + "; no valid tracks found yet.</i></b>";
	enToSpotIds[ songID ] = null;
	
	for( i = 0; i < tracks.length; i++ ) {
		trackCount[ songID ]++;
//		console.log( "*** songID = " + songID + "; trackCount is " + trackCount[ songID ] );
		var _trackID = tracks[i].foreign_id.replace("spotify-WW", "spotify");
    	
		var t = models.Track.fromURI( _trackID, function(track) {
//			console.log( "--- in inner function for songID = " + songID + "; trackCount is " + trackCount[ songID ] );

			trackCount[ songID ]--;
//			console.log( "track " + track.uri + "; is playable? " + track.playable + "; album year is " + track.album.year );
			
			if( track.playable) {
				var _uri = track.uri;
				var _year = track.album.year;
				var _title = track.name;
				var _album = track.album.name;
				
				if( validTracks[songID] ) {
					if( validTracks[songID].year > track.album.year) {
						validTracks[songID] = { "id":_uri, "year":_year , "title":_title, "album":_album};
//						console.log("track: " + track.uri + "is the new best track for song " + songID );
					}
				
				} else {
					validTracks[songID] = { "id":_uri, "year":_year , "title":_title, "album":_album};
//					console.log("track: " + track.uri + "is the new best track for song " + songID );
				}
				var plItem = document.getElementById( songID );
				plItem.innerHTML = "<b>" + validTracks[songID].title + " (" +validTracks[songID].album + ", " + validTracks[songID].year + ")</b> <i>[" + songID + ";" + validTracks[songID].id + "]</i>";
//				plItem.innerHTML = "EN: " + songID + " SP: " + validTracks[songID].id + " ; Title: " + validTracks[songID].title + " (" +validTracks[songID].year + ", " + validTracks[songID].album + ")";
				enToSpotIds[ songID ] = validTracks[songID].id;
			}
		} );
	}
}
