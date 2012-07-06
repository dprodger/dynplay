var NowPlayingView = Backbone.View.extend({

	className: "nowplaying",
	
	events: {},
	
	initialize: function() {
		console.log("in nowPlaying:initialize()");
		this.model.bind('change', this.updateView, this);
		this.render();
	},
	render: function() {
		if( this.model.artist ) {
			console.log("*** we've got an artist; name is " + this.model.artist.artistName + " (" + this.model.artist.artistID + ")");

			var template = _.template( $("#now_playing_template").html(), { 
				artistName: this.model.artist.artistName, 
				songTitle: this.model.song.songTitle,
				songYear: this.model.song.releaseYear,
				album: this.model.song.albumName } );
			this.$el.html( template );
		} else {
			var template = _.template( $("#now_playing_template").html(), { 
				artistName: "", 
				songTitle: "",
				songYear: "",
				album: "" } );
			this.$el.html( template );
		}

		return this;		
	},
	updateView: function() {
		this.render();
	}
});

	