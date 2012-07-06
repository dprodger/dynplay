var NowPlayingView = Backbone.View.extend({


    className: "nowplaying",

    events: {},

    initialize: function() {
        _.bindAll(this, 'render');
        this.model.bind('change', this.updateView, this);
        this.render();
    },
    render: function() {
        var template,
            artist = this.model.get("artist"),
            song = this.model.get("song");

        console.log(this.model);

        if( artist && song ) {

            template = _.template( $("#now_playing_template").html(), {
                artistName: artist.artistName,
                songTitle:  song.songTitle,
                songYear:   song.releaseYear,
                album:      song.albumName } );

            this.$el.html( template );

        } else {
            template = _.template( $("#now_playing_template").html(), {
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
