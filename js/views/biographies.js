var BiographiesView = Backbone.View.extend({
    className: "biographies-region",

    events: {},

    initialize: function() {
        this.render();
    },
    render: function() {
       var template;
		
		if( this.model.get("artist") && this.model.get("artist") ) {
			var artist = this.model.get("artist");
			template = _.template( $("#biographies_template").html(), {
				wikiBio: artist.wikiBio,
				wikiUrl: artist.wikiUrl,
				lastBio: artist.lastBio,
				lastUrl: artist.lastUrl
	 		} );
		} else {
			template = _.template( $("#biographies_template").html(), {
				wikiBio: "None",
				wikiUrl: "#",
				lastBio: "None",
				lastUrl: "#"
	 		} );
		}

		this.$el.html( template );
        return this;
    },
	updateView: function() {
		this.render();
	}
});
