var NowPlayingView = Backbone.View.extend({

	className: "nowplaying",
	
	events: {},
	
	initialize: function() {
		this.model.on('change', this.updateView, this);
		this.render();
	},
	render: function() {
		if( this.model.get("artist") && this.model.get("song")) {
			var template = _.template( $("#now_playing_template").html(), { 
				artistName: this.model.get("artist").artistName, 
				songTitle: this.model.get("song").songTitle,
				songYear: this.model.get("song").releaseYear,
				album: this.model.get("song").albumName } );
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