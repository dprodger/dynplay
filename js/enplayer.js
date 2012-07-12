/*jshint sub: true jquery: true */

var enToSpotIds = {};

var apiKey = "N6E4NIOVYMTHNDM8J";
var apiHost = "developer.echonest.com";

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

function supportsLocalStorage() {
    return ('localStorage' in window) && window['localStorage'] !== null;
}

var nowPlayingView;
var dynplayModel;

var numTabs = 5;

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
        tpID = localStorage["tpID"];
        var siteURL = "http://" + apiHost + "/api/v4/catalog/read?api_key=" + apiKey + "&id=" + tpID + "&results=100";
        $('._en_catalog_site').show().children().attr('href', siteURL);
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
            'format':'jsonp'
        }, function (data) {
//          console.log("in results for retrieve");
            var response = data.response;
            var catalogs = response.catalogs;

            var catList = $("div._en_tp_list");
            catList.text("");

            for (var i = 0; i < catalogs.length; i++) {
                var catalog = catalogs[ i ];

//					console.log( "catalog ID: " + catalog.id + ", named " + catalog.name );
                catList.html(catList.html() + catalog.name + " (" + catalog.id + ") [" + catalog.type + ", " + catalog.total + "]<br />");
            }
        });
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
	var artistHot = $("#_artist_hot").val();
	var songHot = $("#_song_hot").val();
	var variety = $("#_variety").val();
	var catRadio = $("#_cat_radio").prop('checked');

	if( songTitle ) {
		getSongIDFromTitle( artist, songTitle, artistHot, songHot, variety, catRadio );
	} else {
		innerGeneratePlaylist( artist, null, null, artistHot, songHot, variety, catRadio );
	}
}

function getSongIDFromTitle( artist, songTitle, artistHot, songHot, variety, catRadio ) {
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
                innerGeneratePlaylist(artist, song.id, song.title, artistHot, songHot, variety, catRadio);
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
function innerGeneratePlaylist( artist, songID, songTitle, artistHot, songHot, variety, catRadio ) {
	displayMakePlaylist( artist, songTitle );
	// disable the makePlaylist button
	$("#_play").attr("disabled",true);
	var url = "http://" + apiHost + "/api/v4/playlist/dynamic/create?api_key=" + apiKey + "&callback=?";

	clearPlaylist( activePlaylist );
	var type = "";
	if( catRadio ) {
		type = 'catalog-radio';
	} else if( songID ) {
		type = 'song-radio';
	} else {
		type = 'artist-radio';
	}

	var parms = {
		"format": "jsonp",
		'bucket': ['tracks', 'id:spotify-WW'],
		"limit": true,
		"artist_min_hotttnesss": artistHot,
		"song_min_hotttnesss": songHot,
		"variety": variety,
		"type": type
	};
	if( !catRadio ) {
		parms['artist'] = artist;
	}
	if( songID ) {
		parms['song_id'] = songID;
	}

	if( tpID ) {
		parms['seed_catalog'] = tpID;
	}


	$.getJSON( url,
		parms,
		function(data) {
			console.log("=== in makePlaylist callback; received a response");
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

function getNextSong() {
	var url = "http://" + apiHost + "/api/v4/playlist/dynamic/next?api_key=" + apiKey + "&callback=?";

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


function actuallyPlayTrack(track, song) {
    activePlaylist.add(track);

    player.play(track.data.uri, activePlaylist, 0);

    nowPlayingArtist = new Artist({
        model:dynplayModel
    });
    nowPlayingArtist.artistID = song.artist_id;
    nowPlayingArtist.artistName = song.artist_name;

    nowPlayingSong = new Song({
        model:dynplayModel
    });
    nowPlayingSong.songTitle = song.title;
    nowPlayingSong.songID = song.id;
    nowPlayingSong.releaseYear = track.data.album.year;
    nowPlayingSong.albumName = track.data.album.name;


    nowPlayingSong.albumCover = track.data.album.cover;
    nowPlayingSong.artist = nowPlayingArtist;

    updateNowPlaying(nowPlayingSong);

    if (tpID) {
        updateTasteProfileWithPlay(tpID, song.id);
    }

    nowPlayingArtist.gatherArtistLinks();
    nowPlayingArtist.gatherArtistBios();
    // reset the rating field
    $("input[type=range]").val("5");

    // re-enable the make new playlist button
    $("#_play").attr("disabled", false);
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
			updateTasteProfileWithSkip( tpID, nowPlayingSong.songID );
			getNextSong();
		})
		.error( function( jqXHR, textStatus, errorThrown) {
			console.log( "skipTrack error:" + textStatus + " " + errorThrown );
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
// TODO -- when server support exists, pass through ban artists to Taste Profile
//			updateTasteProfileWithBan( tpID, currentArtistID );

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
// TODO -- when server support exists, pass through favorite artists to Taste Profile
//			updateTasteProfileWithFavorite( tpID, currentArtistID );

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
			updateTasteProfileWithBan( tpID, nowPlayingSong.songID );

			var list = document.getElementById("banned_songs");
            var listitem = document.createElement("li");
            listitem.setAttribute('id', nowPlayingSong.songID );
            listitem.innerHTML = nowPlayingSong.songTitle + " by " + nowPlayingSong.artist.artistName;
            list.appendChild( listitem );

			enablePlayerControls();
		});
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
			updateTasteProfileWithFavorite( tpID, nowPlayingSong.songID );

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

			updateTasteProfileWithRating( tpID, nowPlayingSong.songID, rating );
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
	console.log( "in createNewCatalog");
	// create a taste profile and store the resulting Catalog ID in local storage
	var url = "http://" + apiHost + "/api/v4/catalog/create?api_key=" + apiKey;

	$.post(url,
		{
			'type':'song',
			    'name':'dynplay_' + models.session.anonymousUserID + "_1"
		},
		function(data) {
			var response = data.response;
			console.log("name is " + response.name);
			console.log("cat id is " + response.id );

			if( response.id ) {
				tpID = response.id;
				localStorage["tpID"] = tpID;

				$("#_catalog_id").val( tpID );

				var siteURL = "http://"+apiHost+"/api/v4/catalog/read?api_key=" + apiKey + "&id=" + tpID + "&results=100";
				$('._en_catalog_site').show().children().attr('href', siteURL );

				// add catalog-level custom data
				attachCustomAttrsToCatalog( tpID );
			} else {
				console.log("Error in creating new taste profile");
			}
	})
	.success( function() { console.log( "in success function")})
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
	retrieveTPItem( _tpID, _soID, playExistingItem, addNewItem );
}

function updateTasteProfileWithSkip( _tpID, _soID ) {
	skipExistingItem( _tpID, _soID );
}

function updateTasteProfileWithRating( _tpID, _soID, _rating ) {
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

function updateTasteProfileWithBan( _tpID, _itemID ) {
	var url = "http://" + apiHost + "/api/v4/catalog/ban?api_key=" + apiKey + "&callback=?";

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

function updateTasteProfileWithFavorite( _tpID, _itemID ) {
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

function retrieveTPItem( _tpID, _soID, _existFunc, _noExistFunc ) {
	var url = "http://" + apiHost + "/api/v4/catalog/read?api_key=" + apiKey + "&callback=?";

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
				_existFunc( _tpID, _soID );
			} else {
//				console.log("item was not found");
				_noExistFunc( _tpID, _soID );
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