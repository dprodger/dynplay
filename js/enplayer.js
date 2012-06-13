var enSongs = [];
var enToSpotIds = {};

var apiKey = "N6E4NIOVYMTHNDM8J";
var apiHost = "developer.echonest.com"
var counts = 0; // spinlock

var pl;

var sessionID;

var currentArtistID;
var currentArtistName;
var currenSongENID;
var currentTrackSpotifyID;
var currentTrackTitle;
var currentTrackYear;

var currentSong;

var activePlaylist;

var sp;
var models;
var views;
var application;

var player;

function supportsLocalStorage() {
    return ('localStorage' in window) && window['localStorage'] !== null;
}

function initialize() {
	console.log("-=-=- In initialize() ");
	sp = getSpotifyApi(1);
	models = sp.require('sp://import/scripts/api/models');
    views = sp.require("sp://import/scripts/api/views");
	application = models.application;

	player = models.player;
	
	setUpObserve();
	activePlaylist = new models.Playlist();
	console.log( "activePlaylist now exists; it's " + activePlaylist.length + " long ");
	
	application.observe(models.EVENT.ARGUMENTSCHANGED, handleArgs);

	if( !localStorage["apiKey"]) {
		localStorage["apiKey"] = apiKey
	}
	
	if( !localStorage["apiHost"]) {
		localStorage["apiHost"] = apiHost
	}
	$("#_api_key").val(localStorage["apiKey"]);
	$("#_host").val(localStorage["apiHost"]);
}

function updateConfig() {
	apiKey = $("#_api_key").val();
	apiHost = $("#_host").val();

	apiKey = $.trim( apiKey );
	apiHost = $.trim( apiHost );
	// TODO figure out how to trim uuencoded strings
	console.log( "changing apiKey to " + apiKey + " and host to: " + apiHost );
	
	localStorage["apiKey"] = apiKey;
	localStorage["apiHost"] = apiHost;
}

function handleArgs() {
	var args = application.arguments;
	$(".section").hide();	// Hide all sections
	$("#"+args[0]).show();	// Show current section
	console.log(args);

	// If there are multiple arguments, handle them accordingly
	if(args[1]) {		
		switch(args[0]) {
			case "search":
				searchInput(args);
				break;
			case "social":
				socialInput(args[1]);
				break;
		}
	}
}

function setUpObserve() {
	player.observe(models.EVENT.CHANGE, function(event) {
		console.log( "[[[ in observe" );

		if( !player.curPos && !player.track ) {
			console.log( "Maybe this is the right time to get a new track!");
			getNextSong();
		} else {
			console.log( "I'm not yet ready for a new track");
		}
	})
}

function makePlaylist() {
	var artist = $("#_artist").val();
	var artistHot = $("#_artist_hot").val();
	var songHot = $("#_song_hot").val();
	var variety = $("#_variety").val();
	
	// disable the makePlaylist button
	$("#_play").attr("disabled",true);
	var url = "http://" + apiHost + "/api/v4/playlist/dynamic/create?api_key=" + apiKey + "&callback=?";
	
	clearPlaylist( activePlaylist );

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
	var url = "http://" + apiHost + "/api/v4/playlist/dynamic/next?api_key=" + apiKey + "&callback=?";

	$.getJSON( url, 
		{
			"session_id": sessionId,
			"format": "jsonp",
		},
		function(data) {
			console.log("=== in getNextSong; received a response");
			var response = data.response;
			var songs = response.songs;
			currentSong = songs[0];
			var tracks = currentSong.tracks;

			console.log("=== Looking for song " + currentSong.id + "; title" + currentSong.title + " by artist: " + currentSong.artist_name );
			getSpotifyTracks( currentSong, currentSong.id, tracks );
		})
}


function getSpotifyTracks( song, _soid, _tracks ) {
	findValidTrack( song, _soid, _tracks );
}

function clearPlaylist(playlist) {
	console.log( "About to clear a playlist; currently it is " + playlist.length );
	while (playlist.data.length > 0) {
		playlist.data.remove(0);
	}
}


function actuallyPlayTrack( track, song ) {
	activePlaylist.add( track );
	player.play( track.data.uri, activePlaylist, 0 );
	
	currentArtistID = song.artist_id;
	currentArtistName = song.artist_name;
	currentSongENID = song.id;
	currentTrackSpotifyID = "";
	currentTrackTitle = song.title;
	
	updateNowPlaying( song.artist_name, song.title, track.album.year);

	// re-enable the make new playlist button
	$("#_play").attr("disabled",false);
	
}

function skipTrack() {
	disablePlayerControls();
	console.log("in skipTrack");
	var url = "http://" + apiHost + "/api/v4/playlist/dynamic/feedback?api_key=" + apiKey + "&callback=?";

	$.getJSON( url, 
		{
			"session_id": sessionId,
			"format": "jsonp",
			"skip_song": "last"	// skip the current track
		},
		function(data) {
			console.log("song skipped");
			getNextSong();
		})
}

function banArtist() {
	disablePlayerControls();
	
	console.log("in banArtist");
	var url = "http://" + apiHost + "/api/v4/playlist/dynamic/feedback?api_key=" + apiKey + "&callback=?";

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
			
			enablePlayerControls();
		})
}

function favoriteArtist() {
	disablePlayerControls();
	
	console.log("in favoriteArtist");
	var url = "http://" + apiHost + "/api/v4/playlist/dynamic/feedback?api_key=" + apiKey + "&callback=?";

	$.getJSON( url, 
		{
			"session_id": sessionId,
			"format": "jsonp",
			"favorite_artist": "last"	// ban the most-recently returned artist
		},
		function(data) {
			console.log("artist favorited");
			
			var list = document.getElementById("favorite_artists");
            var listitem = document.createElement("li");
            listitem.setAttribute('id', currentArtistID );
            listitem.innerHTML = currentArtistName;
            list.appendChild( listitem );
			
			enablePlayerControls();
		})
}


function banSong() {
	disablePlayerControls();
	
	console.log("in banSong");
	var url = "http://" + apiHost + "/api/v4/playlist/dynamic/feedback?api_key=" + apiKey + "&callback=?";

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
			
			enablePlayerControls();
		})
}

function favoriteSong() {
	disablePlayerControls();
	
	console.log("in favoriteSong");
	var url = "http://" + apiHost + "/api/v4/playlist/dynamic/feedback?api_key=" + apiKey + "&callback=?";

	$.getJSON( url, 
		{
			"session_id": sessionId,
			"format": "jsonp",
			"favorite_song": "last"	// ban the most-recently returned artist
		},
		function(data) {
			console.log("song favorited");

			var list = document.getElementById("favorite_songs");
            var listitem = document.createElement("li");
            listitem.setAttribute('id', currenSongENID );
            listitem.innerHTML = currentTrackTitle + " by " + currentArtistName;
            list.appendChild( listitem );

			enablePlayerControls();			
		})
}

// used when a song has to be marked as "not played"
function unplaySong( _song ) {
//	disablePlayerControls();
	
	console.log("in unplaySong for song id " + _song.id );
	var url = "http://" + apiHost + "/api/v4/playlist/dynamic/feedback?api_key=" + apiKey + "&callback=?";

	$.getJSON( url, 
		{
			"session_id": sessionId,
			"format": "jsonp",
			"unplay_song": _song.id	// unplay the most-recently played song
		},
		function(data) {
			console.log("song unplayed for id " + _song.id );
		})
}

function spotifyStar() {
	console.log("in spotifyStar");
	
	player.track.starred = true;
}

function rateSong() {
	disablePlayerControls();
	
	console.log("in rateSong");

	var rating = $('input:radio[name=_rategroup]:checked').val();
	var rateVal = "last^" + rating;
	
	console.log( "sending rateVal" + rateVal );
	var url = "http://" + apiHost + "/api/v4/playlist/dynamic/feedback?api_key=" + apiKey + "&callback=?";

	$.getJSON( url, 
		{
			"session_id": sessionId,
			"format": "jsonp",
			"rate_song": rateVal	// set the rating value
			
		},
		function(data) {
			console.log("song rated");

			var list = document.getElementById("rated_songs");
            var listitem = document.createElement("li");
            listitem.setAttribute('id', currenSongENID );
            listitem.innerHTML = currentTrackTitle + " by " + currentArtistName + " rated " + rating;
            list.appendChild( listitem );

			enablePlayerControls();
		})

}



function updateNowPlaying( _artist, _title, _year ) {
	console.log( "in updateNowPlaying, artist is " + _artist );
	var np = $("#nowplaying");
	
	np.find( "#np_artist").text( _artist );
	np.find( "#np_song").text( _title );
	np.find( "#np_year").text( _year );
	
	enablePlayerControls();
}

var trackCount = [];
var validTracks = [];

function findValidTrack( song, songID, tracks ) {
	console.log("* in findValidTrack for " + songID + " and I have " + tracks.length + " tracks to check" );
	trackCount[ songID ] = 0;
	
	// set default so we know if none found
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
						validTracks[songID] = { "id":_uri, "year":_year , "title":_title, "album":_album, "spot_track":track };
						console.log("track: " + track.uri + "is the new best track for song " + songID );
					}
				
				} else {
					validTracks[songID] = { "id":_uri, "year":_year , "title":_title, "album":_album, "spot_track":track };
					console.log("track: " + track.uri + "is the new best track for song " + songID );
				}
				enToSpotIds[ songID ] = validTracks[songID].id;
			}
		} );
	}
	
	// wait for the finish
	waitForTrackCompletion( song, songID );
}

function waitForTrackCompletion( song, songID ) {
	if( trackCount[ songID ] < 1 ) {
		return processAllTracksComplete( song, songID );
	}
	
	setTimeout( function(){ waitForTrackCompletion( song, songID )}, 500 );
}

function processAllTracksComplete( _song, _songID ) {
	console.log( "all tracks have been processed");
	if( validTracks[ _songID ]) {
		var trackID = validTracks[ _songID ].id;
		console.log( "--------------- best track is " + trackID + " for song " + _songID );

		 actuallyPlayTrack( validTracks[ _songID ].spot_track, _song );
	} else {
		console.log( "--------------- No tracks are available and valid for that song; getting the next one...");
		unplaySong( _song );
		getNextSong();
	}
}

function updatePlayerControls( state ) {	
	$("#_skip").attr("disabled",state);
	$("#_banartist").attr("disabled",state);
	$("#_bansong").attr("disabled",state);
	$("#_spotstar").attr("disabled",state);

	$("#_favartist").attr("disabled",state);
	$("#_favsong").attr("disabled",state);
	$("#_ratestar").attr("disabled",state);	
}

function enablePlayerControls() {
	updatePlayerControls( false );
}

function disablePlayerControls() {
	updatePlayerControls( true );
}

