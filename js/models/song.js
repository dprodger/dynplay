var Song = Backbone.Model.extend({
    defaults:function () {
        return {
            songTitle:null,
            songID:null,
            artist:null,
            spotifyTrackID:null,
            releaseYear:null,
            albumName:null,
            albumCover:null
        };
    },
    initialize:function (_sid, _stitle, _artist, _spid, _ryear) {
        this.set({"songTitle":_stitle});
        this.set({"songID":_sid});
        this.set({"artist":_artist});
        this.set({"spotifyTrackID":_spid});
        this.set({"releaseYear":_ryear});
    }
});