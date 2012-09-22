var NowPlayingView = Backbone.View.extend({
    className:"nowplaying",

    events:{},

    initialize:function () {
        this.model.bind('change', this.updateView, this);
        this.render();
    },
    render:function () {
        var template,
            artist = this.model.get("artist"),
            song = this.model.get("song");

        if (artist && song) {

            template = _.template($("#now_playing_template").html(), {
                artistName:artist.artistName,
                songTitle:song.songTitle,
                songYear:song.releaseYear,
                album:song.albumName,
                cover:song.albumCover,
                twitterUrl:artist.artistTwitterURL ? artist.artistTwitterURL : "None",
                facebookUrl:artist.artistFacebookURL ? artist.artistFacebookURL : "None",
				artHot:artist.hotttnesss,
				artFam:artist.familiarity,
				songHot:song.hotttnesss
            });

            this.$el.html(template);

        } else {
            template = _.template($("#now_playing_template").html(), {
                artistName:"",
                songTitle:"",
                songYear:"",
                album:"",
                cover:"",
                twitterUrl:"None",
                facebookUrl:"None",
				artHot:"",
				artFam:"",
				songHot:""
            });
            this.$el.html(template);
        }

        return this;
    },
    updateView:function () {
        this.render();
    }
});
