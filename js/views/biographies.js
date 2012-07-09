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
				lastBio: artist.lastBio
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
		this.render();
	}
});
