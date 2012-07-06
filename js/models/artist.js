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
//		console.log("in gatherArtistLinks; _aid is " + this.artistID);
		var url = "http://" + apiHost + "/api/v4/artist/profile?api_key=" + apiKey + "&callback=?";

		var self = this;
		
		$.getJSON( url, 
			{
				"id": this.artistID,
				"format": "jsonp",
				'bucket': ['id:twitter', 'id:facebook']
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
				
//				console.log("in artist:gatherArtistLinks; response has completed");
				if( self.get("model") ) {
					self.get("model").dprChange();
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
