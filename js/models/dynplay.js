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
	}
});
