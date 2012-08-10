function fetchSongInfo(track, show) {
    console.log('Getting song info for ' + track.name + ' by '  + track.artists[0].name);
    var url = 'http://developer.echonest.com/api/v4/track/profile?api_key=N6E4NIOVYMTHNDM8J&callback=?';
	var track_id = track.uri.replace( "spotify", "spotify-WW" )
	
    $.getJSON(url, { id: track_id, format:'jsonp', bucket : 'audio_summary'}, function(data) {
        if (data && data.response) {
            console.log("");
            fetchAnalysis(data.response.track);
            show = showSegmentInfo(data.response.track);
        } else {
            console.log("trouble getting results");
        }
    });
}

function fetchAnalysis(track) {
    console.log('Getting analysis info for ' + track.title + ' by '  + track.artist);
    var url = 'http://labs.echonest.com/3dServer/analysis?callback=?';

    cur_analysis = null;
    $.getJSON(url, { url: track.audio_summary.analysis_url}, function(data) {
        if ('meta' in data) {
            console.log("Got the analysis");
            cur_analysis = data;
        } else {
            console.log("trouble getting analysis");
        }
    });
}