var Song = Backbone.Model.extend({
	defaults: function() {
		return {
			songTitle: null,
			songID: null,
			artistName: null,
			artistID: null,
			spotifyTrackID: null,
			releaseYear: null
		};
	},
	initialize: function( _sid, _stitle, _aid, _aname, _spid, _ryear ) {
		this.set({"songTitle": _stitle});
		this.set({"songID": _sid});
		this.set({"artistName": _aname });
		this.set({"artistID": _aid});
		this.set({"spotifyTrackID": _spid});
		this.set({"releaseYear": _ryear});		
	},
	
})