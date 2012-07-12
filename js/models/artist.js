var Artist = Backbone.Model.extend({
    defaults:function () {
        return {};
    },
    initialize:function () {
    },
    setTwitter:function (_tid) {
//		console.log("in setTwitter, _tid = " + _tid );
        var url = "http://www.twitter.com/" + _tid;

        this.artistTwitterID = _tid;
        this.artistTwitterURL = url;

        if (_tid) {
            this.retrieveTweets();
        } else {
            var tweetText = $("div._recent_tweets");
            tweetText.text("");
        }
        this.get("model").dprChange();
    },
    setFacebook:function (_fid) {
//		console.log("in setFacebook, _fid = " + _fid );
        var url = "http://www.facebook.com/pages/music/" + _fid;

        this.artistFacebookID = _fid;
        this.artistFacebookURL = url;

        this.get("model").dprChange();
    },
    gatherArtistLinks:function () {
        var url = "http://" + apiHost + "/api/v4/artist/profile?api_key=" + apiKey + "&callback=?";
        var self = this;

        $.getJSON(url,
            {
                "id":this.artistID,
                "format":"jsonp",
                'bucket':['id:twitter', 'id:facebook', 'urls', 'artist_location']
            },
            function (data) {
                var artist = data.response.artist;
                var forIDs = artist.foreign_ids;

                if (forIDs) {
                    for (var i = 0; i < forIDs.length; i++) {
                        var idBlock = forIDs[i];
//						console.log("catalog is " + idBlock.catalog + " and foreign_id is " + idBlock.foreign_id);
                        if ("twitter" === idBlock.catalog) {
                            var twHand = idBlock.foreign_id.substring(15);
                            self.setTwitter(twHand);
                        }
                        if ("facebook" === idBlock.catalog) {
                            url = idBlock.foreign_id.substring(16);
                            self.setFacebook(url);
                        }
                    }
                }

                var urls = artist.urls;
                if (urls) {
                    self.urls = urls;
                } else {
                    console.log("nothing in artist/urls");
                }

                var location = artist.artist_location;
                if (location) {
                    self.location = location.location;
                }

                if (self.get("model")) {
                    self.get("model").dprChange();
                }

            });
    },
    gatherArtistBios:function () {
        var url = "http://" + apiHost + "/api/v4/artist/biographies?api_key=" + apiKey + "&callback=?";
        var self = this;

        $.getJSON(url,
            {
                "id":this.artistID,
                "format":"jsonp",
                'license':'cc-by-sa'
            },
            function (data) {
                var bios = data.response.biographies;

                if (bios) {
                    for (var i = 0; i < bios.length; i++) {
                        var bio = bios[i];
                        if (bio.site === "wikipedia") {
                            self.wikiBio = bio.text;
                            self.wikiUrl = bio.url;
                        }
                        if (bio.site === "last.fm") {
                            self.lastBio = bio.text;
                            self.lastUrl = bio.url;
                        }
                    }
                }

                if (self.get("model")) {
                    self.get("model").dprChange();
                }
            });
    },
    retrieveTweets:function () {
        var url = "http://api.twitter.com/1/statuses/user_timeline.json?include_entities=true&include_rts=true&count=3";

        $.getJSON(url,
            {
                "screen_name":this.artistTwitterID
            },
            function (data) {
                var tweetText = $("div._recent_tweets");
                tweetText.text("");

                for (var i = 0; i < data.length; i++) {
                    var img = "<img src='" + data[i].user.profile_image_url + "' />";

                    tweetText.html(tweetText.html() + img);
                    tweetText.html(tweetText.html() + data[i].user.name + "<br />");
                    tweetText.html(tweetText.html() + "@" + data[i].user.screen_name + "<br />");
                    tweetText.html(tweetText.html() + data[i].text + "<br />");
                }
            });

    }
});
