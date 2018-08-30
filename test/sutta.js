(typeof describe === 'function') && describe("sutta", function() {
    const should = require("should");
    const fs = require('fs');
    const path = require('path');
    const {
        Sutta,
    } = require("../index");
    const SC = path.join(__dirname, '../local/sc');

    it("TESTTESTloadSutta(id, opts) returns a Sutta", function(done) {
        (async function() { try {
            var sutta = await Sutta.loadSutta('mn1');
            var end = 21;
            var header = sutta.excerpt({
                start: 0,
                end: 2,
                prop: 'pli',
            });
            var excerpt = sutta.excerpt({
                start: 0,
                end,
                prop: 'en',
            });
            var i = 0;
            should(excerpt[i++]).equal('Middle Discourses 1\n'); // autoterminate segment
            should(excerpt[i++]).equal('The Root of All Things\n'); // end group
            should(excerpt[i++]).equal('So I have heard.');
            should(excerpt[end-2]).equal('Why is that?');
            done();
        } catch(e) { done(e); } })();
    });
    it("TESTTESTgroupOf(scid) returns immediate segment group", function(done) {
        (async function() { try {
            var sutta = await Sutta.loadSutta('mn1');
            var pat = 'mn1:0.*';
            should.deepEqual(sutta.groupOf("mn1:0.1"), {
                scid: 'mn1:0.*',
                segments: [
                    sutta.segments[0],
                    sutta.segments[1],
                ],
            });
            var mn1_1 = sutta.groupOf("mn1:1.2");
            should(mn1_1.segments.length).equal(6);
            should(mn1_1.segments[0].scid).equal('mn1:1.1');
            should(mn1_1.segments[5].scid).equal('mn1:1.6');
            done();
        } catch(e) { done(e); } })();
    });
});
