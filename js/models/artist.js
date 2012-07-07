var Artist = Backbone.Model.extend({
	defaults: function() {
		return {};
	},
	initialize: function() {},
	setTwitter: function( _tid ) {
//		console.log("in setTwitter, _tid = " + _tid );
		url = "http://www.twitter.com/" + _tid;

		this.artistTwitterID = _tid;
		this.artistTwitterURL = url;

		if( _tid ) {
			this.retrieveTweets();
		} else {
			var tweetText = $("div._recent_tweets");
			tweetText.text("");	
		}
		this.get("model").dprChange();
	},
	setFacebook: function( _fid ) {
//		console.log("in setFacebook, _fid = " + _fid );
		url = "http://www.facebook.com/pages/music/" + _fid;
		
		this.artistFacebookID = _fid;
		this.artistFacebookURL = url;

		this.get("model").dprChange();
	},
	gatherArtistLinks: function() {
		console.log("in gatherArtistLinks; _aid is " + this.artistID);
		var url = "http://" + apiHost + "/api/v4/artist/profile?api_key=" + apiKey + "&callback=?";

		var self = this;
		
		$.getJSON( url, 
			{
				"id": this.artistID,
				"format": "jsonp",
				'bucket': ['id:twitter', 'id:facebook', 'urls']
			},
			function(data) {
				var artist = data.response.artist;
				var forIDs = artist.foreign_ids;

				if( forIDs ) {
					for( var i = 0; i < forIDs.length; i++ ) {
						var idBlock = forIDs[i];
//						console.log("catalog is " + idBlock.catalog + " and foreign_id is " + idBlock.foreign_id);
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
				
				var urls = artist.urls;
				console.log("artist urls is ", urls );
				console.log("urls length is ", urls.length);
				if( urls ) {
					for( var i = 0; i < urls.length; i++ ) {
						var urlBlock = urls[i];
						console.log( "urlBlock " + i + " is", urlBlock );
					}
				} else {
					console.log("nothing in artist/urls");
				}
				console.log("in artist:gatherArtistLinks; response has completed");
				if( self.get("model") ) {
					self.get("model").dprChange();
				}

		});
	},
	retrieveTweets: function() {
		console.log( "in retrieveTweets for " + this.artistTwitterID );
		var url = "http://api.twitter.com/1/statuses/user_timeline.json?include_entities=true&include_rts=true&count=3";

		$.getJSON( url, 
			{
				"screen_name": this.artistTwitterID
			},
			function(data) {
				console.log("retrieved tweets");
				var tweetText = $("div._recent_tweets");
				tweetText.text("");

				for( var i = 0; i < data.length; i++ ) {
					var img = "<img src='" + data[i].user.profile_image_url + "' />";
					
					tweetText.html( tweetText.html() + img) ;
					tweetText.html( tweetText.html() + data[i].user.name + "<br />" );
					tweetText.html( tweetText.html() + "@" + data[i].user.screen_name + "<br />" );
					tweetText.html( tweetText.html() + data[i].text + "<br />");
				}
			} );
		
	}	
})
