var Artist = Backbone.Model.extend({
	defaults: function() {
		return {
			artistName: null,
			artistID: null,
			artistSpotifyID: null,
			artistTwitterID: null,
			artistTwitterURL: null,
			artistFacebookID: null,
			artistFacebookURL: null,
			twitElem: null,
			fbElem: null
		};
	},
	initialize: function( _aid, _aname, _aspid, _twitter, _facebook ) {
		this.set({"artistName": _aname });
		this.set({"artistID": _aid});
		this.set({"artistSpotifyID": _aspid});
		this.setTwitter( _twitter );
		this.setFacebook( _facebook );
	},
	setTwitter: function( _tid ) {
		console.log("in setTwitter, _tid = " + _tid );
		url = "http://www.twitter.com/" + _tid;

		this.set({"artistTwitterID": _tid });
		this.set({"artistTwitterURL": url});
		
		if( this.twitElem ) {
			this.twitElem.attr("href", url);
			this.twitElem.text( url );		
		}
	},
	setFacebook: function( _fid ) {
		console.log("in setFacebook, _fid = " + _fid );
		url = "http://www.facebook.com/pages/music/" + _fid;
		
		this.set({"artistFacebookID": _fid });
		this.set({"artistFacebookURL": url});

		if( this.fbElem ) {
			this.fbElem.attr("href", url);
			this.fbElem.text( url );		
		}
	},
	gatherArtistLinks: function( _twitElem, _fbElem ) {
		console.log("in gatherArtistLinks; _aid is " + this.artistID);
		var url = "http://" + apiHost + "/api/v4/artist/profile?api_key=" + apiKey + "&callback=?";

		var self = this;
		
		this.set({"twitElem": _twitElem });
		this.set({"fbElem": _fbElem });
		
		var href = "#";
		_twitElem.attr("href", href);
		_twitElem.text("None" );
		_fbElem.attr("href", href);
		_fbElem.text("None" );
		
		$.getJSON( url, 
			{
				"id": this.artistID,
				"format": "jsonp",
				'bucket': ['id:twitter', 'id:facebook']
			},
			function(data) {
				console.log("retrieved artist data");

				var artist = data.response.artist;
				var forIDs = artist.foreign_ids;

				if( forIDs ) {
					for( var i = 0; i < forIDs.length; i++ ) {
						var idBlock = forIDs[i];
						console.log("catalog is " + idBlock.catalog + " and foreign_id is " + idBlock.foreign_id);
						if( "twitter" == idBlock.catalog ) {
							var twHand = idBlock.foreign_id.substring(15);
							self.setTwitter( twHand );
						}
						if( "facebook" == idBlock.catalog ) {
							url = idBlock.foreign_id.substring(16);
							self.setFacebook( url );
						}
					}
				}

		});
	},
	retrieveTweets: function() {
/*
		console.log( "in retrieveTweets for " + _tid )
		var url = "http://api.twitter.com/1/statuses/user_timeline.json?include_entities=true&include_rts=true&count=3";

		$.getJSON( url, 
			{
				"screen_name": _tid
			},
			function(data) {
				console.log("retrieved tweets");
				var tweetText = $("div._recent_tweets");
				tweetText.text("");

				for( var i = 0; i < data.length; i++ ) {
					console.log( data[i].text );
					tweetText.html( tweetText.html() + data[i].text + "<br />");
				}
			} );
		
*/	}	
})
