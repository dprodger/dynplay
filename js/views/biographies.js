var BiographiesView = Backbone.View.extend({
    className: "biographies-region",

    events: {},

    initialize: function() {
        this.render();
    },
    render: function() {
		console.log("in biographies:render");
       var template;
		
		if( this.model.get("artist") && this.model.get("artist").biographies ) {
			biographies = this.model.get("artist").biographies;
			template = _.template( $("#biographies_template").html(), {
				wikiBio: biographies.wiki_bio,
				lastBio: biographies.last_bio
	 		} );
		} else {
			template = _.template( $("#biographies_template").html(), {
				wikiBio: "None",
				lastBio: "None"
	 		} );
		}

		this.$el.html( template );
        return this;
    },
	updateView: function() {
		console.log("in biographies:updateView");
		this.render();
	}
});
