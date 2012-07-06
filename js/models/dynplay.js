var DynplayModel = Backbone.Model.extend({
	defaults: function() {
		return {
			artist: null,
			song: null
		}
	},
	initialize: function( _artist, _song ) {
		artist = _artist;
		song = _song;
	}
});
