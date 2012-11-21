/*jshint sub: true jquery: true */

var enToSpotIds = {};

var notLiveCatalog = "CADSBXA13ADB6A2861";
var notXmasCatalog = "CALUXSG13ADB61C093";

var apiKey = "N6E4NIOVYMTHNDM8J";
var apiHost = "developer.echonest.com";

// API Key needed to update the QA catalogs for bad live tracks, and bad xmas tracks
var qaCatalogUpdateKey = "KNZZERLRFBHPTVCRG";
var sessionId;

var nowPlayingSong;	// song object
var nowPlayingArtist;

var activePlaylist;
//AaronD testing
var playedList;

var sp;
var ui;
var models;
var views;
var application;

var player;

// taste profile ID for this user
var tpID;

// holds what level of taste-profile use we are implementing for this session
var catState;

var CAT_NONE = "none";
var CAT_UPDATE = "update";
var CAT_SEED = "seed";
var CAT_CAT = "cat";

function supportsLocalStorage() {
    return ('localStorage' in window) && window['localStorage'] !== null;
}

var nowPlayingView;
var dynplayModel;

var numTabs = 5;

var curAnalysis = null;

function initialize() {
//	console.log("-=-=- In initialize() ");
	sp = getSpotifyApi(1);
    ui = sp.require("sp://import/scripts/ui");
	models = sp.require('sp://import/scripts/api/models');
    views = sp.require("sp://import/scripts/api/views");
	application = models.application;

	player = models.player;

    setUpObserve();
    activePlaylist = new models.Playlist();
//	console.log( "activePlaylist now exists; it's " + activePlaylist.length + " long ");

    //AaronD: testing playlist view...
    playedList = new views.List(activePlaylist);
    playedList.node.classList.add("sp-light");
    document.getElementById("played-list").appendChild(playedList.node);

    application.observe(models.EVENT.ARGUMENTSCHANGED, handleArgs);

    if (!localStorage["apiKey"]) {
        localStorage["apiKey"] = apiKey;
    } else {
        apiKey = localStorage["apiKey"];
    }

    if (!localStorage["apiHost"]) {
        localStorage["apiHost"] = apiHost;
    } else {
        apiHost = localStorage["apiHost"];
    }

    if (!localStorage["tpID"]) {
        tpID = null;
    } else {
		updateCurrentTasteProfileID( localStorage[ "tpID"]);
    }
    $("#_api_key").val(localStorage["apiKey"]);
    $("#_host").val(localStorage["apiHost"]);

    //Select the Artist field and allow Enter to Submit - quickstart FTW!
    $(document).ready(function () {
        $("#param_form").keydown(function (event) {
            if (event.keyCode === 13) {
                makePlaylist();
                return false;
            }
        });
        $("#_artist").select();
    });

    $("#_catalog_id").val(tpID);

    // populate list of taste profiles
    retrieveListOfProfiles();

    dynplayModel = new DynplayModel();
    nowPlayingView = new NowPlayingView({
        model:dynplayModel,
        el:$("#nowplaying")
    });

    artistUrlsView = new ArtistUrlsView({
        model:dynplayModel,
        el:$("#urls_regions")
    });

    biographiesView = new BiographiesView({
        model:dynplayModel,
        el:$("#biographies_regions")
    });

    dynplayModel.set({"myview":nowPlayingView});
    dynplayModel.set({"urlview":artistUrlsView});
    dynplayModel.set({"bioview":biographiesView});
}

function retrieveListOfProfiles() {
//    console.log("in retrieveListOfProfiles");
    var url = "http://" + apiHost + "/api/v4/catalog/list?api_key=" + apiKey + "&callback=?";

    $.getJSON(url,
        {
            'format':'jsonp',
			'results':100
        }, function (data) {
//          console.log("in results for retrieve");
            var response = data.response;
            var catalogs = response.catalogs;

            var catList = $("div._en_tp_list");
            catList.text("");

            for (var i = 0; i < catalogs.length; i++) {
                var catalog = catalogs[ i ];

//					console.log( "catalog ID: " + catalog.id + ", named " + catalog.name );
                catList.html(catList.html() + "<a href='#' onclick='selectProfile(\"" + catalog.id + "\");'>" + catalog.name + " (" + catalog.id + ") [" + catalog.type + ", " + catalog.total + "]</a><br />");
            }
        });
}

function selectProfile( _catID ) {
	updateCurrentTasteProfileID( _catID );
}

function updateCurrentTasteProfileID( _catID ) {
	tpID = _catID;
	localStorage["tpID"] = tpID;

	$("#_catalog_id").text( "(" + tpID + ")" );

	var siteURL = "http://"+apiHost+"/api/v4/catalog/read?api_key=" + apiKey + "&id=" + tpID + "&results=100";
	$('._en_catalog_site').show().attr('href', siteURL );
//	$('._en_catalog_site').show().children().attr('href', siteURL );	
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
    $("#" + args[0]).show();	// Show current section

    // If there are multiple arguments, handle them accordingly
    if (args[1]) {
        switch (args[0]) {
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
		// when the below are both true, that's the signal from Spotify that we're at the end of a track
		if( !player.curPos && !player.track ) {
			getNextSong();
		}
	});
}

function makePlaylist() {
	var artist = $("#_artist").val();
	var songTitle = $("#_song_title").val();
	
	// gather the acoustic search parameters
	var audioParms = {};
	audioParms[ 'song_live_min' ] = $("#_song_live_min").val();
	audioParms[ 'song_live_max' ] = $("#_song_live_max").val();
	audioParms[ 'song_speech_min' ] = $("#_song_speech_min").val();
	audioParms[ 'song_speech_max' ] = $("#_song_speech_max").val();
	audioParms[ 'song_tempo_min' ] = $("#_song_tempo_min").val();
	audioParms[ 'song_tempo_max' ] = $("#_song_tempo_max").val();
	audioParms[ 'song_energy_min' ] = $("#_song_energy_min").val();
	audioParms[ 'song_energy_max' ] = $("#_song_energy_max").val();
	audioParms[ 'song_dance_min' ] = $("#_song_dance_min").val();
	audioParms[ 'song_dance_max' ] = $("#_song_dance_max").val();
	audioParms[ 'song_loud_min' ] = $("#_song_loud_min").val();
	audioParms[ 'song_loud_max' ] = $("#_song_loud_max").val();
	audioParms[ 'song_duration_min' ] = $("#_song_duration_min").val();
	audioParms[ 'song_duration_max' ] = $("#_song_duration_max").val();

	var artistHot = $("#_artist_hot").val();
	var songHot = $("#_song_hot").val();
	var variety = $("#_variety").val();
	var adventurous = $("#_adventurous").val();
	var xmasRadio = $('input[name=_xmas]');
	var xmas = xmasRadio.filter(':checked').val();
	var liveRadio = $('input[name=_live]');
	var live = liveRadio.filter(':checked').val();

	var myRadio = $('input[name=cat_type]');
	catState = myRadio.filter(':checked').val();

	if( songTitle ) {
		getSongIDFromTitle( artist, songTitle, artistHot, songHot, variety, adventurous, xmas, live, audioParms );
	} else {
		innerGeneratePlaylist( artist, null, null, artistHot, songHot, variety, adventurous, xmas, live, audioParms );
	}
}

function getSongIDFromTitle( artist, songTitle, artistHot, songHot, variety, adventurous, xmas, live, audioParams ) {
	var url = "http://" + apiHost + "/api/v4/song/search?api_key=" + apiKey + "&callback=?";

    $.getJSON(url,
        {
            'artist':artist,
            'title':songTitle,
            'format':'jsonp'
        }, function (data) {
            //console.log("=== in getSongIDFromTitle; received a response");
            var response = data.response;
            var songs = response.songs;
            if (songs && songs.length > 0) {
                var song = songs[0];
                //console.log("=== looking for song: " + songTitle + " and got: " + song.id + " (" + song.title + ")");
                innerGeneratePlaylist(artist, song.id, song.title, artistHot, songHot, variety, adventurous, xmas, live, audioParams );
            } else {
                console.log("=== looking for song: " + songTitle + " and did not get any songs back!");
                alert("We can't find that song");
            }
        })
		.error( function( jqXHR, textStatus, errorThrown) {
			console.log( "getSongIDFromTitle error:" + textStatus + " " + errorThrown );
		});
}

function displayEnterNew() {
	$("#_enter_seeds").attr("style","display:block;");
	$("#_display_seeds").attr("style","display:none;");
}

function displayMakePlaylist( artist, songName ) {
	$("#_disp_art_name").text( artist );
	if( songName ) {
		$("#_disp_song_seed").html( " based on <b>" + songName + "</b>");
	} else {
		$("#_disp_song_seed").text( "");
	}

	$("#_enter_seeds").attr("style","display:none;");
	$("#_display_seeds").attr("style","display:block;");
}

//TODO this is gross -- I should rethink how I'm passing shit around -- but I just want to get the titles correct
function innerGeneratePlaylist( artist, songID, songTitle, artistHot, songHot, variety, adventurous, xmas, live, audioParams ) {
	displayMakePlaylist( artist, songTitle );
	// disable the makePlaylist button
	$("#_play").attr("disabled",true);
	var url = "http://" + apiHost + "/api/v4/playlist/dynamic/create?api_key=" + apiKey + "&callback=?";

	clearPlaylist( activePlaylist );
	var type = "";

	if( catState == CAT_SEED || catState == CAT_CAT ) {
		type = 'catalog-radio';
	} else if( songID ) {
		type = 'song-radio';
	} else {
		type = 'artist-radio';
	}

	var parms = {
		"format": "jsonp",
		'bucket': ['tracks', 'id:spotify-WW',"artist_hotttnesss","artist_familiarity","song_hotttnesss", "audio_summary"],
		"limit": true,
		"artist_min_hotttnesss": artistHot,
		"song_min_hotttnesss": songHot,
		"variety": variety,
		"type": type
	};

	if( artist && !(CAT_CAT == catState ) ) {
		parms['artist'] = artist;
	}

	if( songID && !(CAT_CAT == catState ) ) {
		parms['song_id'] = songID;
	}


	if( audioParams['song_speech_min'] ) {
		parms['min_speechiness'] = audioParams['song_speech_min'];
	}

	if( audioParams['song_speech_max'] ) {
		parms['max_speechiness'] = audioParams['song_speech_max'];
	}

	if( audioParams['song_live_min'] ) {
		parms['min_liveness'] = audioParams['song_live_min'];
	}

	if( audioParams['song_live_max'] ) {
		parms['max_liveness'] = audioParams['song_live_max'];
	}

	if( audioParams['song_tempo_min'] ) {
		parms['min_tempo'] = audioParams['song_tempo_min'];
	}

	if( audioParams['song_tempo_max'] ) {
		parms['max_tempo'] = audioParams['song_tempo_max'];
	}

	if( audioParams['song_energy_min'] ) {
		parms['min_energy'] = audioParams['song_energy_min'];
	}

	if( audioParams['song_energy_max'] ) {
		parms['max_energy'] = audioParams['song_energy_max'];
	}

	if( audioParams['song_dance_min'] ) {
		parms['min_danceability'] = audioParams['song_dance_min'];
	}

	if( audioParams['song_dance_max'] ) {
		parms['max_danceability'] = audioParams['song_dance_max'];
	}

	if( audioParams['song_loud_min'] ) {
		parms['min_loudness'] = audioParams['song_loud_min'];
	}

	if( audioParams['song_loud_max'] ) {
		parms['max_loudness'] = audioParams['song_loud_max'];
	}

	if( audioParams['song_duration_min'] ) {
		parms['min_duration'] = audioParams['song_duration_min'];
	}

	if( audioParams['song_duration_max'] ) {
		parms['max_duration'] = audioParams['song_duration_max'];
	}

	if( catState == CAT_SEED || catState == CAT_CAT ) {
		parms['seed_catalog'] = tpID;
		parms['adventurousness'] = adventurous;
	}
	
	if( catState != CAT_NONE ) {
		parms['session_catalog'] = tpID;
	}

	songTypeParms = new Array();
	
	if( live ) {
		songTypeParms.push("live:"+live);
	}
	
	if(xmas) {
		songTypeParms.push("christmas:"+xmas);
	}
	
	parms['song_type'] = songTypeParms;

	$.getJSON( url,
		parms,
		function(data) {
			var response = data.response;
			sessionId = response.session_id;
			$("#_session_id").val(sessionId);
			// update helper link to show session Info
			var siteURL = "http://"+apiHost+"/api/v4/playlist/dynamic/info?api_key=" + apiKey + "&session_id=" + sessionId ;
			$('._en_site').show().children().attr('href', siteURL );

			$("a._history_url").attr("href", "http://developer.echonest.com");
			console.log( "Session ID = " + sessionId );
			getNextSong();
		})
		.error( function( jqXHR, textStatus, errorThrown) {
			console.log( "innerGeneratePlaylist error:" + textStatus + " " + errorThrown );
		});
}

function disableSectionBlocks() {
	refreshTimer = false;
	
	if( paper ) {
		paper.remove();
		paper = null;
	}
	
	if( curBox ) {
		curBox = null;
	}
}

function getNextSong() {
	var url = "http://" + apiHost + "/api/v4/playlist/dynamic/next?api_key=" + apiKey + "&callback=?";
	
	disableSectionBlocks();

	$.getJSON( url,
		{
			"session_id": sessionId,
			"format": "jsonp"
        },
		function(data) {
//			console.log("=== in getNextSong; received a response");
			var response = data.response;
			var songs = response.songs;
			var currentSong = songs[0];
			var tracks = currentSong.tracks;

			console.log("=== Looking for song " + currentSong.id + "; title " + currentSong.title + " by artist: " + currentSong.artist_name );
			getSpotifyTracks( currentSong, currentSong.id, tracks );
		})
		.error( function( jqXHR, textStatus, errorThrown) {
			console.log( "getNextSong error:" + textStatus + " " + errorThrown );
		});
		
}


function getSpotifyTracks( song, _soid, _tracks ) {
	findValidTrack( song, _soid, _tracks );
}

function clearPlaylist(playlist) {
	while (playlist.data.length > 0) {
		playlist.data.remove(0);
	}
}

var paulFunc = null;


function actuallyPlayTrack(track, song) {
    activePlaylist.add(track);

    player.play(track.data.uri, activePlaylist, 0);

    nowPlayingArtist = new Artist({
        model:dynplayModel
    });
    nowPlayingArtist.artistID = song.artist_id;
    nowPlayingArtist.artistName = song.artist_name;
	nowPlayingArtist.familiarity = song.artist_familiarity;
	nowPlayingArtist.hotttnesss = song.artist_hotttnesss;
	

    nowPlayingSong = new Song({
        model:dynplayModel
    });
    nowPlayingSong.songTitle = song.title;
    nowPlayingSong.songID = song.id;
    nowPlayingSong.releaseYear = track.data.album.year;
    nowPlayingSong.albumName = track.data.album.name;
	nowPlayingSong.hotttnesss = song.song_hotttnesss;
	
	// ensure that we work whether or not we get audio summary attributes
	if( song.audio_summary ) {
		nowPlayingSong.energy  = song.audio_summary.energy;
		nowPlayingSong.danceability  = song.audio_summary.danceability;
		nowPlayingSong.liveness  = song.audio_summary.liveness;
		nowPlayingSong.speechiness  = song.audio_summary.speechiness;
		nowPlayingSong.tempo  = song.audio_summary.tempo;
	} else {
		nowPlayingSong.energy  = 0;
		nowPlayingSong.danceability  = 0;
		nowPlayingSong.liveness  = 0;
		nowPlayingSong.speechiness  = 0;
		nowPlayingSong.tempo  = 0;
	}	


    nowPlayingSong.albumCover = track.data.album.cover;
    nowPlayingSong.artist = nowPlayingArtist;

    updateNowPlaying(nowPlayingSong);

    if (shouldUpdateTP()) {
        updateTasteProfileWithPlay(tpID, song.id);
    }

    nowPlayingArtist.gatherArtistLinks();
    nowPlayingArtist.gatherArtistBios();
    // reset the rating field
    $("input[type=range]").val("5");

    // re-enable the make new playlist button
    $("#_play").attr("disabled", false);

	fetchSongInfo( track );
	refreshTimer = true;
	setTimeout( updateSegInfo, 5000 );
}


var curBox = null;

function updateSegInfo() {
	if( paulFunc ) {
		window["paulFunc"]();
		if( !curBox ) {
			if( paper ) {
				curBox = paper.rect( 0, 0, 5, 75 );
				curBox.attr("fill","#ffffff");
			}
		}
		
		if( curBox ) {
			var curPos = player.position/1000;
			curPos = curPos * avgWidth;
		
			curBox.attr("x", curPos );
		}
	} else {
		console.log("paulFunc is null");
	}
	
	if( refreshTimer && player.playing ) {
		
		setTimeout( updateSegInfo, 1000 );
	}
}

function shouldUpdateTP() {
	// with new Session Catalog stuff, this is entirely unnecessary
	return false;
//	return( tpID && catState != CAT_NONE );
}

function skipTrack() {
	disablePlayerControls();
//	console.log("in skipTrack");
	var url = "http://" + apiHost + "/api/v4/playlist/dynamic/feedback?api_key=" + apiKey + "&callback=?";

	$.getJSON( url,
		{
			"session_id": sessionId,
			"format": "jsonp",
			"skip_song": "last"	// skip the current track
		},
		function(data) {
			console.log("song skipped; EN Song ID: " + nowPlayingSong.songID );
		    if (shouldUpdateTP()) {
				updateTasteProfileWithSkip( tpID, nowPlayingSong.songID );
			}
			getNextSong();
		})
		.error( function( jqXHR, textStatus, errorThrown) {
			console.log( "skipTrack error:" + textStatus + " " + errorThrown );
		});
		
}

function steer( _attr, _dest ) {
	disablePlayerControls();
	console.log("in steer: attr = " + _attr + "; towards: " + _dest );
	
	var parms = {
		"format": "jsonp",
		"session_id": sessionId,
	};
	
	if( _attr == "tempo" ) {
		if( _dest == "slower") {
			parms['target_tempo'] = 60;
		} else {
			parms['target_tempo'] = 180;
		}
	}
	
	if( _attr == "energy" ) {
		if( _dest == "lower") {
			parms['target_energy'] = 0.10;
		} else {
			parms['target_energy'] = 0.90;
		}
	}

	if( _attr == "artist_familiarity" ) {
		if( _dest == "lower") {
			parms['target_artist_familiarity'] = 0.10;
		} else {
			parms['target_artist_familiarity'] = 0.90;
		}
	}

	if( _attr == "artist_hotttnesss" ) {
		if( _dest == "lower") {
			parms['target_artist_hotttnesss'] = 0.10;
		} else {
			parms['target_artist_hotttnesss'] = 0.90;
		}
	}

	if( _attr == "song_hotttnesss" ) {
		if( _dest == "lower") {
			parms['target_song_hotttnesss'] = 0.10;
		} else {
			parms['target_song_hotttnesss'] = 0.90;
		}
	}

	var url = "http://" + apiHost + "/api/v4/playlist/dynamic/steer?api_key=" + apiKey + "&callback=?";

	$.getJSON( url,
		parms,
		function(data) {
			console.log("in steer results" );
			enablePlayerControls();
		});
}

function banArtist() {
	disablePlayerControls();

//	console.log("in banArtist, for artist " + currentArtistID + " (" + nowPlayingSong.artistName +")");
	var url = "http://" + apiHost + "/api/v4/playlist/dynamic/feedback?api_key=" + apiKey + "&callback=?";

	$.getJSON( url,
		{
			"session_id": sessionId,
			"format": "jsonp",
			"ban_artist": nowPlayingSong.artist.artistID	// ban the most-recently returned artist
		},
		function(data) {
			console.log("artist banned; EN Artist ID: " + nowPlayingSong.artist.artistID + " (" + nowPlayingSong.artist.artistName + ")");
			if( shouldUpdateTP() ) {
				updateTasteProfileWithBan( tpID, nowPlayingSong.artist.artistID );
			}
			
			var list = document.getElementById("banned_artists");
            var listitem = document.createElement("li");
            listitem.setAttribute('id', nowPlayingSong.artist.artistID );
            listitem.innerHTML = nowPlayingSong.artist.artistName + " (" + nowPlayingSong.artist.artistID + ")";
            list.appendChild( listitem );

			enablePlayerControls();
		});
}

function favoriteArtist() {
	disablePlayerControls();

//	console.log("in favoriteArtist");
	var url = "http://" + apiHost + "/api/v4/playlist/dynamic/feedback?api_key=" + apiKey + "&callback=?";

	$.getJSON( url,
		{
			"session_id": sessionId,
			"format": "jsonp",
			"favorite_artist": "last"	// ban the most-recently returned artist
		},
		function(data) {
			var artist = nowPlayingSong.artist;

			console.log("artist favorited; EN Artist ID: " + artist.artistID + " (" + artist.artistName + ")");
			if( shouldUpdateTP() ) {
				updateTasteProfileWithFavorite( tpID, nowPlayingSong.artist.artistID );
			}
			
			var list = document.getElementById("favorite_artists");
            var listitem = document.createElement("li");
            listitem.setAttribute('id', artist.artistID );
            listitem.innerHTML = artist.artistName;
            list.appendChild( listitem );

			enablePlayerControls();
		});
}


function banSong() {
	disablePlayerControls();

	var url = "http://" + apiHost + "/api/v4/playlist/dynamic/feedback?api_key=" + apiKey + "&callback=?";

	$.getJSON( url,
		{
			"session_id": sessionId,
			"format": "jsonp",
			"ban_song": "last"	// ban the most-recently returned artist
		},
		function(data) {
			console.log("song banned; EN Song ID: " + nowPlayingSong.songID );
		    if (shouldUpdateTP()) {
				updateTasteProfileWithBan( tpID, nowPlayingSong.songID );
			}
			var list = document.getElementById("banned_songs");
            var listitem = document.createElement("li");
            listitem.setAttribute('id', nowPlayingSong.songID );
            listitem.innerHTML = nowPlayingSong.songTitle + " by " + nowPlayingSong.artist.artistName;
            list.appendChild( listitem );

			enablePlayerControls();
		});
}

function makeNotXmas() {
	console.log("marking this song ID as not xmas: ", nowPlayingSong.songID );
	updateTasteProfileWithBan( notXmasCatalog, nowPlayingSong.songID, qaCatalogUpdateKey );
}

function makeNotLive() {
	console.log("marking this song ID as not live: ", nowPlayingSong.songID );
	updateTasteProfileWithBan( notLiveCatalog, nowPlayingSong.songID, qaCatalogUpdateKey );
}

function favoriteSong() {
	disablePlayerControls();

//	console.log("in favoriteSong");
	var url = "http://" + apiHost + "/api/v4/playlist/dynamic/feedback?api_key=" + apiKey + "&callback=?";

	$.getJSON( url,
		{
			"session_id": sessionId,
			"format": "jsonp",
			"favorite_song": "last"	// ban the most-recently returned artist
		},
		function(data) {
			console.log("song favorited; EN Song ID: " + nowPlayingSong.songID );
		    if (shouldUpdateTP()) {
				updateTasteProfileWithFavorite( tpID, nowPlayingSong.songID );
			}

			var list = document.getElementById("favorite_songs");
            var listitem = document.createElement("li");
            listitem.setAttribute('id', nowPlayingSong.songID );
            listitem.innerHTML = nowPlayingSong.songTitle + " by " + nowPlayingSong.artist.artistName;
            list.appendChild( listitem );

			enablePlayerControls();
		});
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
//TODO when server-side locking works, disable this
			getNextSong();
		});
}

function spotifyStar() {
	player.track.starred = true;
}

function rateSong() {
	disablePlayerControls();

	var rating = $("input[type=range]").val();
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
			console.log("song rated; EN Song ID: " + nowPlayingSong.songID + "; rating is " + rating );

		    if (shouldUpdateTP()) {
				updateTasteProfileWithRating( tpID, nowPlayingSong.songID, rating );
			}
			
			var list = document.getElementById("rated_songs");
            var listitem = document.createElement("li");
            listitem.setAttribute('id', nowPlayingSong.songID );
            listitem.innerHTML = nowPlayingSong.songTitle + " by " + nowPlayingSong.artist.artistName + " rated " + rating;
            list.appendChild( listitem );

			enablePlayerControls();
		});

}



function updateNowPlaying(_song) {

    dynplayModel.set({
        "artist": _song.artist,
        "song": _song
    });

    //var coverImg = new ui.SPImage(_cover);
    //coverImg.node.setAttribute("id", "cover_placeholder");
    //document.getElementById("np_cover").replaceChild(coverImg.node, document.getElementById("cover_placeholder"));

	enablePlayerControls();
}

var trackCount = [];
var validTracks = [];

function findValidTrack( song, songID, tracks ) {
//	console.log("* in findValidTrack for " + songID + " and I have " + tracks.length + " tracks to check" );
	trackCount[ songID ] = 0;

	// set default so we know if none found
	enToSpotIds[ songID ] = null;

    for (var i = 0; i < tracks.length; i++) {
        trackCount[ songID ]++;
//		console.log( "*** songID = " + songID + "; trackCount is " + trackCount[ songID ] );
        var _trackID = tracks[i].foreign_id.replace("spotify-WW", "spotify");

        //TODO: should t be used?
        var t = models.Track.fromURI(_trackID, function (track) {
//			console.log( "--- in inner function for songID = " + songID + "; trackCount is " + trackCount[ songID ] );

            trackCount[ songID ]--;
//			console.log( "track " + track.uri + "; is playable? " + track.playable + "; album year is " + track.album.year );

            if (track.playable) {
                var _uri = track.uri;
                var _year = track.album.year;
                var _title = track.name;
                var _album = track.album.name;

                if (validTracks[songID]) {
                    if (validTracks[songID].year > track.album.year) {
                        validTracks[songID] = { "id":_uri, "year":_year, "title":_title, "album":_album, "spot_track":track };
//						console.log("track: " + track.uri + "is the new best track for song " + songID );
                    }

                } else {
                    validTracks[songID] = { "id":_uri, "year":_year, "title":_title, "album":_album, "spot_track":track };
//					console.log("track: " + track.uri + "is the new best track for song " + songID );
                }
                enToSpotIds[ songID ] = validTracks[songID].id;
            }
        });
    }

	// wait for the finish
	waitForTrackCompletion( song, songID );
}

function waitForTrackCompletion(song, songID) {
    if (trackCount[ songID ] < 1) {
        processAllTracksComplete(song, songID);
    } else {
        setTimeout(function () {
            waitForTrackCompletion(song, songID)
        }, 500);
    }
}

function processAllTracksComplete(_song, _songID) {
//	console.log( "all tracks have been processed");
    if (validTracks[ _songID ]) {
        var trackID = validTracks[ _songID ].id;
        console.log("--------------- best track is " + trackID + " for song " + _songID);

        actuallyPlayTrack(validTracks[ _songID ].spot_track, _song);
    } else {
        console.log("--------------- No tracks are available and valid for that song; getting the next one...");
        unplaySong(_song);
//TODO move getNextSong into unplaySong() response, to avoid server-side locking f'ups.
//		getNextSong();
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

function createNewCatalog() {
	// create a taste profile and store the resulting Catalog ID in local storage
	
	var newName = $("#_new_cat_name").val();
	var url = "http://" + apiHost + "/api/v4/catalog/create?api_key=" + apiKey;

	$.post(url,
		{
			'type':'general',
			    'name':newName
		},
		function(data) {
			var response = data.response;

			if( response.id ) {
				updateCurrentTasteProfileID( response.id );

				// add catalog-level custom data
				attachCustomAttrsToCatalog( tpID );
				
			    retrieveListOfProfiles();				
			} else {
				console.log("Error in creating new taste profile");
			}
	})
	.error( function( ){
		console.log( "in error function");
		console.log( arguments )});
}


function attachCustomAttrsToCatalog( _tpID ) {
	console.log(" in attachCustomAttrsToCatalog for tpID is " + _tpID );
	var url = "http://" + apiHost + "/api/v4/catalog/update?api_key=" + apiKey;

	var updateBlock = {};
	updateBlock.action = "update";
	updateBlock.catalog_keyvalues = {
		'customattr1':'red',
		'customattr2':'54',
		'customattr3':'true'
	};

	var thelist = [ updateBlock ];

	$.post(url,
		{
			'id':_tpID,
			'data_type':'json',
			'data':JSON.stringify(thelist)
		},
		function(data) {
			var response = data.response;
			//TODO deal with errors somehow
			console.log("ticket is " + response.ticket);

	})
	.error( function(){
		console.log( "in error function");
		console.log( arguments )});

}
function deleteExistingCatalog() {
	alert("Disabling delete for now -- need to add confirmation box");
	return;
	
	console.log( "in deleteExistingCatalog");
	console.log( "attempting to delete Catalog with ID: " + tpID );

	if( !tpID ) {
		alert("we don't have a current catalog ID; can't delete!");
		return;
	}

	var url = "http://" + apiHost + "/api/v4/catalog/delete?api_key=" + apiKey;

	$.post(url,
		{
			'id':tpID
		},
		function(data) {
			var response = data.response;
			console.log("deleted catalog ID " + tpID );

			tpID = null;
			localStorage["tpID"] = null;

			$("#_catalog_id").val( tpID );
	});
}

function updateTasteProfileWithPlay( _tpID, _soID ) {
	console.log("in updateTPWithPlay call");
	retrieveTPItem( _tpID, _soID, playExistingItem, addNewItem );
}

function updateTasteProfileWithSkip( _tpID, _soID ) {
	console.log("in updateTPWithSkip call");
	skipExistingItem( _tpID, _soID );
}

function updateTasteProfileWithRating( _tpID, _soID, _rating ) {
	console.log("in updateTPWithRating call");
	var url = "http://" + apiHost + "/api/v4/catalog/rate?api_key=" + apiKey + "&callback=?";

	$.getJSON( url,
		{
			'id': _tpID,
			'item': _soID,
			'rating':_rating,
			'format':'jsonp'
		}, function(data) {
			var response = data.response;
			//TODO - deal with errors somehow
		});
}

function updateTasteProfileWithBan( _tpID, _itemID, _overrideCat ) {
	// read the taste profile to see if the item exists
	
	retrieveTPItem( _tpID, _itemID, banExistingItem, banNewItem, _overrideCat );
}

function banExistingItem( _tpID, _itemID, _overrideCat  ) {
	var theKey = apiKey;
	if( _overrideCat ) { theKey = _overrideCat; }
	
	console.log("in banExistingItem");
	var url = "http://" + apiHost + "/api/v4/catalog/ban?api_key=" + theKey + "&callback=?";

	$.getJSON( url,
		{
			'id': _tpID,
			'item': _itemID,
			'ban':'true',
			'format':'jsonp'
		}, function(data) {
			var response = data.response;
			//TODO - deal with errors somehow
		});
}

function banNewItem( _tpID, _itemID, _overrideCat ) {
	var theKey = apiKey;
	if( _overrideCat ) { theKey = _overrideCat; }
	
	console.log("in banNewItem");
  	var url = "http://" + apiHost + "/api/v4/catalog/update?api_key=" + theKey;

    var updateBlock = {};
    updateBlock.action = "update";
    updateBlock.item = {
        "item_id":_itemID,
		"banned":true
    };

	if( _itemID.substr(0, 2) == "AR" ) {
		updateBlock.item["artist_id"] = _itemID;
	} else {
		updateBlock.item["song_id"] = _itemID;
	}
    var thelist = [ updateBlock ];

    $.post(url,
        {
            'id':_tpID,
            'data_type':'json',
            'data':JSON.stringify(thelist)
        },
        function (data) {
            var response = data.response;
            //TODO deal with errors somehow
//			console.log("ticket is " + response.ticket);

        });
}

function updateTasteProfileWithFavorite( _tpID, _itemID ) {
	retrieveTPItem( _tpID, _itemID, favoriteExistingItem, favoriteNewItem );
	
	var url = "http://" + apiHost + "/api/v4/catalog/favorite?api_key=" + apiKey + "&callback=?";

	$.getJSON( url,
		{
			'id': _tpID,
			'item': _itemID,
			'favorite':'true',
			'format':'jsonp'
		}, function(data) {
			var response = data.response;
			//TODO - deal with errors somehow
		});
}

function favoriteExistingItem( _tpID, _itemID ) {
	console.log("in favoriteExistingItem");
	var url = "http://" + apiHost + "/api/v4/catalog/favorite?api_key=" + apiKey + "&callback=?";

	$.getJSON( url,
		{
			'id': _tpID,
			'item': _itemID,
			'favorite':'true',
			'format':'jsonp'
		}, function(data) {
			var response = data.response;
			//TODO - deal with errors somehow
		});
}

function favoriteNewItem( _tpID, _itemID ) {
	console.log("in favoriteNewItem");
   var url = "http://" + apiHost + "/api/v4/catalog/update?api_key=" + apiKey;

    var updateBlock = {};
    updateBlock.action = "update";
    updateBlock.item = {
        "item_id":_itemID,
		"favorite":true
    };

	if( _itemID.substr(0, 2) == "AR" ) {
		updateBlock.item["artist_id"] = _itemID;
	} else {
		updateBlock.item["song_id"] = _itemID;
	}
    var thelist = [ updateBlock ];

    $.post(url,
        {
            'id':_tpID,
            'data_type':'json',
            'data':JSON.stringify(thelist)
        },
        function (data) {
            var response = data.response;
            //TODO deal with errors somehow
//			console.log("ticket is " + response.ticket);

        });
}


function retrieveTPItem( _tpID, _soID, _existFunc, _noExistFunc, _overrideCat ) {
	var theKey = apiKey;
	if(_overrideCat) { theKey = _overrideCat; }

	var url = "http://" + apiHost + "/api/v4/catalog/read?api_key=" + theKey + "&callback=?";

	$.getJSON( url,
		{
			'id': tpID,
			'item_id': _soID,
			'format':'jsonp'
		}, function(data) {
//			console.log("=== in retrieveTPItem; received a response");
			var response = data.response;
			var catalog = response.catalog;
			var items = catalog.items;

			if( items && items.length > 0) {
				var item = items[0];
//				console.log(" item was found");
				_existFunc( _tpID, _soID, _overrideCat );
			} else {
//				console.log("item was not found");
				_noExistFunc( _tpID, _soID, _overrideCat );
			}});
}

function playExistingItem(_tpID, _soID) {
//	console.log( "in updateTasteProfileWithPlay");
    // create a taste profile and store the resulting Catalog ID in local storage
    var url = "http://" + apiHost + "/api/v4/catalog/update?api_key=" + apiKey;

    var updateBlock = {};
    updateBlock.action = "play";
    updateBlock.item = {
        "item_id":_soID
    };
    var thelist = [ updateBlock ];

    $.post(url,
        {
            'id':_tpID,
            'data_type':'json',
            'data':JSON.stringify(thelist)
        },
        function (data) {
            var response = data.response;
            //TODO deal with errors somehow
//			console.log("ticket is " + response.ticket);

        })
        .error(function () {
            console.log("in error function");
            console.log(arguments);
        });
}

function skipExistingItem(_tpID, _soID) {
//	console.log( "in skipExistingItem");
    // create a taste profile and store the resulting Catalog ID in local storage
    var url = "http://" + apiHost + "/api/v4/catalog/update?api_key=" + apiKey;

    var updateBlock = {};
    updateBlock.action = "skip";
    updateBlock.item = {
        "item_id":_soID
    };
    var thelist = [ updateBlock ];

    $.post(url,
        {
            'id':_tpID,
            'data_type':'json',
            'data':JSON.stringify(thelist)
        },
        function (data) {
            var response = data.response;
            //TODO deal with errors somehow

//			console.log("ticket is " + response.ticket);

        })
        .error(function () {
            console.log("in error function");
            console.log(arguments);
        });
}


function addNewItem(_tpID, _soID) {
//	console.log( "in addNewItem");
    // create a taste profile and store the resulting Catalog ID in local storage
    var url = "http://" + apiHost + "/api/v4/catalog/update?api_key=" + apiKey;

    var updateBlock = {};
    updateBlock.action = "update";
    updateBlock.item = {
        "item_id":_soID,
        "song_id":_soID,
        "play_count":1
    };
    var thelist = [ updateBlock ];

    $.post(url,
        {
            'id':_tpID,
            'data_type':'json',
            'data':JSON.stringify(thelist)
        },
        function (data) {
            var response = data.response;
//			console.log("ticket is " + response.ticket);

        })
        .error(function () {
            console.log("in error function");
            console.log(arguments);
        });
}

function displayTabs(_index) {
    var t = [];
    for (var i = 0; i < numTabs; i++) {
        t[i] = $("#tabarea_" + i);
        if (i === _index) {
            t[i].attr("style", "display:block;");
        } else {
            t[i].attr("style", "display:none;");
        }
    }
}

function fetchSongInfo(track) {
//    console.log('Getting song info for ' + track.name + ' by '  + track.artists[0].name);
    var url = 'http://' + apiHost + '/api/v4/track/profile?api_key=' + apiKey + '&callback=?';

	var track_id = track.uri.replace( "spotify", "spotify-WW" )
	
    $.getJSON(url, { id: track_id, format:'jsonp', bucket : 'audio_summary'}, function(data) {
        if (data && data.response) {
            fetchAnalysis(data.response.track);
            if( !paulFunc ) {
	            paulFunc = showSegmentInfo(data.response.track);
            } 
        } else {
            console.log("trouble getting results");
        }
    });
}

var paper = null;
var refreshTimer = false;

var avgWidth;

function drawSectionBreaks() {
	if( cur_analysis ) {
		var sections = cur_analysis.sections;
	    var l = sections.length;

	    //TODO -- get this from the div programmatically	    
	    var totalSize = 800;
	    var songLength = cur_analysis.track.duration;

	    var segLength = totalSize / songLength;
	    avgWidth = totalSize / songLength;

		paper = Raphael( document.getElementById("break_section"), totalSize, 75 );
		
		var boxes = [];
		var curX = 0;
		var colors = [ "#00FF00", "#FF0000", "#0000FF" ];

		for ( var i = 0; i < l; i++ ) {
			var myWidth = sections[ i ].duration * avgWidth;
			var box = paper.rect( curX, 0, myWidth, 75 );
			curX = curX + myWidth;

			var color =  colors[ i % 3 ];

			box.attr("fill", color);
			box.attr("title","duration: "+ sections[i])
			//boxes.add(box);			
		}
	} else {
		console.log("in drawSectionBreaks, but no cur_analysis");
	}
}
function fetchAnalysis(track) {
//    console.log('Getting analysis info for ' + track.title + ' by '  + track.artist);
    var url = 'http://labs.echonest.com/3dServer/analysis?callback=?';

    cur_analysis = null;
    $.getJSON(url, { url: track.audio_summary.analysis_url}, function(data) {
        if ('meta' in data) {
            cur_analysis = data;
            drawSectionBreaks();
        } else {
            console.log("trouble getting analysis");
        }
    });
}

var catArt = {};
var catArtPlays = {};

var bannedArtists = {};
var favoriteArtists = {};

var curStart = 0;

function generateCatalogStats() {
	var url = "http://" + apiHost + "/api/v4/catalog/read?api_key=" + apiKey + "&callback=?";

	$.getJSON( url,
		{
			'id': tpID,
			'format':'jsonp',
			'results':100,
			'start': curStart
		}, function(data) {
			console.log("=== in generateCatalogStats; received a response");
			var response = data.response;
			var catalog = response.catalog;
			var total = catalog.total
			var items = catalog.items;

			var countLine = total + " total artists<br />";
			$("#_most_played_artists").html( countLine );
			if( items && items.length > 0) {
				console.log("there are", items.length, "items ");
				for( i = 0; i < items.length; i++ ) {
					item = items[i];
					if( catArt[ item.artist_name ]) {
						catArt[ item.artist_name ] = catArt[ item.artist_name ] + 1;
						catArtPlays[ item.artist_name ] = catArtPlays[ item.artist_name] + item.play_count;
					} else {
						catArt[ item.artist_name ] = 1;
						catArtPlays[ item.artist_name ] = item.play_count;
					}
					if( item.banned ) {
						if( item.song_id ) {
							
						} else {
							console.log("banned artist ", item.artist_name );
							bannedArtists[ item.artist_name ] = 1;
						}
					}
					if( item.favorite ) {
						if( item.song_id ) {
							
						} else {
							console.log("favorite artist ", item.artist_name );
							favoriteArtists[ item.artist_name ] = 1;
						}
					}
				}
				console.log("catArt", catArt);
				if( items.length == 100 ) {
					curStart = curStart + 100;
					generateCatalogStats();
				} else {
					allDoneGenerate();
				}
			}
		});	
}

function allDoneGenerate() {
	console.log("in allDoneGenerate");
	
	var sortable = [];
	$("#_most_played_artists").html("");

	for( var art in catArt ) {
		sortable.push( [art, catArt[art]]);
	}
	sortable.sort( function( a, b ) { return b[1] - a[1] });

	
	for( i = 0; i < sortable.length; i++ ) {
		var art = sortable[ i ][ 0 ];
		var count = sortable[ i ][ 1 ];
		console.log("Artist: ", art, " Count: ", count);
		var text = $("#_most_played_artists").html();
		
		$("#_most_played_artists").html( text + art + ": Songs: " + count + " Total Plays: " + catArtPlays[ art ] + "<br />");
	}
		
	sortable = [];
	$("#_banned_artists").html("");
	for( var art in bannedArtists ) {
		sortable.push( [art, bannedArtists[art]]);
	}
	sortable.sort( function( a, b ) { return b[0] - a[0] });
	
	for( i = 0; i < sortable.length; i++ ) {
		var art = sortable[ i ][ 0 ];
		console.log("Artist: ", art );
		var text = $("#_banned_artists").html();
		
		$("#_banned_artists").html( text + art + "<br />");
	}
	
	sortable = [];
	$("#_favorite_artists").html("");
	for( var art in favoriteArtists ) {
		sortable.push( [art, favoriteArtists[art]]);
	}
	sortable.sort( function( a, b ) { return b[0] - a[0] });
	
	for( i = 0; i < sortable.length; i++ ) {
		var art = sortable[ i ][ 0 ];
		console.log("Artist: ", art );
		var text = $("#_favorite_artists").html();
		
		$("#_favorite_artists").html( text + art + "<br />");
	}
	
}