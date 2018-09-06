(function(exports) {
    const fs = require('fs');
    const path = require('path');
    const Words = require('./words');
    const SegDoc = require('./seg-doc');
    const PoParser = require('./po-parser');
    const SuttaCentralId = require('./sutta-central-id');
    const RE_ELLIPSIS = new RegExp(`${Words.U_ELLIPSIS}$`);
    const OPTS_EN = {
        prop: 'en',
    };

    class Sutta extends SegDoc { 
        constructor(json={}, opts={}) {
            super(json, opts);
            this.alternates = json.alternates || opts.alternates;
        }

        static loadSutta(opts={}) {
            return new Promise((resolve, reject) => {
                (async function() { try {
                    if (typeof opts === 'string') {
                        opts = {
                            id: opts,
                        }
                    }
                    var parser = new PoParser();
                    var id = opts.id || 'mn1';
                    var suttaPath = PoParser.suttaPath(id, opts.root);
                    var segDoc = await parser.parse(suttaPath, opts);
                    resolve(new Sutta(segDoc, opts));
                } catch(e) {reject(e);} })();
            });
        }

        scidGroup(scid) {
            return Sutta.scidGroup(this.segments, scid);
        }

        static scidGroup(segments, scid) {
            if (typeof scid === 'string') {
                scid = new SuttaCentralId(scid);
            }

            if (!(scid instanceof SuttaCentralId)) {
                throw new Error('expected a SuttaCentralId');
            }
            var parent = scid.parent;
            if (parent.scid == null) {
                throw new Error(`scidGroup() not implemented for sutta scid:${scid}`);
            }
            var wildcard = "*";
            var segments = SegDoc.findSegments(segments, parent.scid + wildcard,  {
                prop: 'scid',
            });
            return {
                scid: parent.scid,
                segments,
            }
        }

        nextSegment(scid, offset=1) {
            scid = scid.toString();
            var indexes = this.findIndexes(scid);
            if (indexes == null || indexes.length === 0) {
                return null;
            }
            var nextIndex = offset + 
                (offset < 0 ? indexes[0] : indexes[indexes.length-1]);
            return this.segments[nextIndex] || null;
        }

        commonPrefix(s0, s1) {
            var len = Math.min(s0.length, s1.length);
            for (var i=0; i<len; i++) {
                if (s0.charAt(i) !== s1.charAt(i)) {
                    break;
                }
            }
            return s0.substring(0, i);
        }

        findAlternates(segments, iEllipses, opts) {
            opts = Object.assign(OPTS_EN, opts);
            var prop = opts.prop;

            var prefix = this.commonPrefix(
                segments[iEllipses[0]][prop],
                segments[iEllipses[1]][prop]);
            if (!prefix) {
                throw new Error("could not generate alternates");
            }
            var indexes = SegDoc.findIndexes(segments, `^${prefix}`, opts);
            var prevIndex = -1;
            var values = indexes.reduce((acc,iseg,i) => {
                var seg = segments[iseg];
                var s = seg[prop].substring(prefix.length);
                if (i === prevIndex+1) {
                    acc.push(s.replace(/\s*[,.;\u2026].*$/u,''));
                }
                prevIndex = i;
                return acc;
            }, []);
            return {
                values,
                indexes,
            }
        };

    }

    module.exports = exports.Sutta = Sutta;
})(typeof exports === "object" ? exports : (exports = {}));

