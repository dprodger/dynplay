var DynplayModel = Backbone.Model.extend({
	defaults: function() {
		return {
			artist: null,
			song: null
		}
	},
	initialize: function( _artist, _song ) {
//TODO: should these be set({""} instead?)
		artist = _artist;
		song = _song;
	},
	//TODO Why do I have to do my own changing?!?!
	dprChange: function() {
		this.get("myview").updateView();
		this.get("urlview").updateView();
		this.get("bioview").updateView();
	}
});
