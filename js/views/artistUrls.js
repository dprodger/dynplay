var ArtistUrlsView = Backbone.View.extend({
    className: "urls-region",

    events: {},

    initialize: function() {
        this.render();
    },
    render: function() {
        var template;
		var wUrl = "fake wiki url";
		console.log("this.model", this.model);
		if( this.model ) {
			if( this.model.get("artist" )) {
				wUrl = this.model.get("artist").artistName;
			} else {
				wUrl = "no artist yet";
			}
		}
		template = _.template( $("#urls_template").html(), {
			wikiUrl: wUrl,
			lastUrl: "fake last url",
 		} );

		this.$el.html( template );
        return this;
    },
	updateView: function() {
		console.log("in artistUrls updateView");
		this.render();
	}
});
