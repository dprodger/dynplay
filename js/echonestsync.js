function showSegmentInfo() {
    var pos = $("#pos");
    var snum = $("#seg-num");
    var stime = $("#seg-time");
    var sbar = $("#bar");
    var sbeat = $("#beat");
    var ssection = $("#section");
    var sdur = $("#seg-dur");
    var sconf = $("#seg-conf");
    var sloud = $("#seg-loud");
    var spitch = $("#seg-pitch");
    var stimbre = $("#seg-timbre");
    var tp = sp.trackPlayer;

    var segIndex = 0;
    var lastSegIndex = -1;

    var beatIndex = 0;
    var barIndex = 0;
    var sectionIndex = 0;

    function findNextBeat(time) {
        if (cur_analysis) {
            var qs = cur_analysis.beats;
            var l = qs.length;

            for (var i = beatIndex; i < l; i++) {
                var q = qs[i];
                if (time >= q.start && time < q.start + q.duration) {
                    beatIndex = i;
                    return q;
                }
            }
            beatIndex = 0;
        }
        return null;
    }


    function isBeat(time) {
        var beat = findNextBeat(time);
        if (beat) {
            if (beat.confidence > .0 && beat.start >= time - beat.duration / 2) {
                return true;
            }
        }
        return false;
    }

    function findNextBar(time) {
        if (cur_analysis) {
            var qs = cur_analysis.bars;
            var l = qs.length;

            for (var i = barIndex; i < l; i++) {
                var q = qs[i];
                if (time >= q.start && time < q.start + q.duration) {
                    barIndex = i;
                    return q;
                }
            }
            barIndex = 0;
        }
        return null;
    }

    function isBar(time) {
        var bar = findNextBar(time);
        if (bar) {
            if (bar.start >= time - bar.duration / 2) {
                return true;
            }
        }
        return false;
    }

    function findNextSection(time) {
        if (cur_analysis) {
            var qs = cur_analysis.sections;
            var l = qs.length;

            for (var i = sectionIndex; i < l; i++) {
                var q = qs[i];
                if (time >= q.start && time < q.start + q.duration) {
                    sectionIndex = i;
                    return q;
                }
            }
            sectionIndex = 0;
        }
        return null;
    }

    function isSection(time) {
        var section = findNextSection(time);
        if (section) {
            if (section.start >= time - section.duration / 2) {
                return true;
            }
        }
        return false;
    }

    function findNextSegment(time) {
        if (cur_analysis) {
            var segs = cur_analysis.segments;
            var lsegs = segs.length;

            for (var i = segIndex; i < lsegs; i++) {
                var seg = segs[i];
                if (time >= seg.start && time < seg.start + seg.duration) {
                    if (i != segIndex) {
                        segIndex = i;
                        return seg;
                    } else {
                        return null;
                    }
                }
            }
            segIndex = 0;
        }
        return null;
    }

    var lastTrack = null;
    function show() {
        var t = tp.getNowPlayingTrack();
        if (t) {
            var thisTrack = t.track;
            if (lastTrack == null || lastTrack.uri != thisTrack.uri) {
                //console.log("track is a new track; fetching new analysis");
                lastTrack = thisTrack;
                //fetchSongInfo(thisTrack);
            }
            var time = t.position / 1000.;
            pos.text(t.position)
            seg = findNextSegment(time)
            if (seg) {
                snum.text(segIndex);
                stime.text(seg.start.toPrecision(4));
                sdur.text(seg.duration.toPrecision(4));
                sconf.text(seg.confidence.toPrecision(4));
                sloud.text(seg.loudness_start.toPrecision(4));
                var pitches = '';
                for (var i = 0; i < seg.pitches.length; i++) {
                    pitches = pitches + ' ' + seg.pitches[i].toPrecision(2);
                }
                spitch.text(pitches);

                var timbre = '';
                for (var i = 0; i < seg.timbre.length; i++) {
                    timbre = timbre + ' ' + seg.timbre[i].toPrecision(4);
                }
                stimbre.text(timbre);
            } else {
				//console.log("No seg");
			}

            if (isBar(time)) {
                sbar.text('bar');
            } else {
                sbar.empty();
            }

            if (isBeat(time)) {
                sbeat.text('beat');
            } else {
                sbeat.empty();
            }

            if (isSection(time)) {
                ssection.text('section');
            } else {
                ssection.empty();
            }
        } else {
			console.log("no track");
		}
    }
    return show;
}