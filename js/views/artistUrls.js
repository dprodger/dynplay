var ArtistUrlsView = Backbone.View.extend({
    className: "urls-region",

    events: {},

    initialize: function() {
        this.render();
    },
    render: function() {
        var template;
		
		if( this.model.get("artist") && this.model.get("artist").urls ) {
			urls = this.model.get("artist").urls;
			template = _.template( $("#urls_template").html(), {
				wikiUrl: urls.wikipedia_url,
				lastUrl: urls.lastfm_url,
				aolUrl: urls.aolmusic_url,
				myspaceUrl: urls.myspace_url,
				amazonUrl: urls.amazon_url,
				itunesUrl: urls.itunes_url,
				mbUrl: urls.mb_url
	 		} );
		} else {
			template = _.template( $("#urls_template").html(), {
				wikiUrl: "None",
 				lastUrl: "None",
 				aolUrl: "None",
 				myspaceUrl: "None",
 				amazonUrl: "None",
 				itunesUrl: "None",
 				mbUrl: "None"
	 		} );
		}

		this.$el.html( template );
        return this;
    },
	updateView: function() {
		this.render();
	}
});
