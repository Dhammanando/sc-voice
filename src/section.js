(function(exports) {
    const Words = require('./words');
    const DEFAULT_PROP = 'en';
    const RE_ELLIPSIS = new RegExp(`${Words.U_ELLIPSIS} *$`);

    class Section {
        constructor(opts={}) {
            var segments = opts.segments;
            if (!(segments instanceof Array)) {
                throw new Error('expected Array of segments');
            }
            this.segments = segments;
            this.type = this.constructor.name;
            this.prefix = opts.prefix || '';
            this.values = opts.values || [];
            this.template = opts.template || [];
            this.prop = opts.prop || DEFAULT_PROP;

            Object.defineProperty(this, 'expandable', {
                enumerable: true,
                get() {return this.template.length > 0},
            });
            this.expandable && Object.defineProperty(this, 'reValues', {
                value: new RegExp(`${this.values.join('|')}`,'u'),
            });
        }

        expandAll() {
            if (!this.expandable) {
                return this;
            }
            var segments = this.segments.reduce((acc,seg) => {
                if (seg[this.prop].match(RE_ELLIPSIS)) {
                    acc.push.apply(acc, this.expand(seg));
                } else {
                    acc.push(seg);
                }
                return acc;
            }, []);
            var opts = Object.assign({}, this, {
                segments,
                template: [],
                values: [],
                prefix: '',
            });
            return new Section(opts);
        }

        expand(segment) {
            if (!this.expandable) {
                return segment;
            }
            var src = this.template[0][this.prop];
            var dst = segment[this.prop].replace(RE_ELLIPSIS, '');
            var dstTokens = dst.split(this.reValues);
            if (dstTokens.length < 1) {
                throw new Error(`could not find anything to expand:${dst}`);
            }
            var repLen = (dst.length - dstTokens.join('').length)/(dstTokens.length-1);
            var repStart = dstTokens[0].length;
            var replacement = dst.substring(repStart,repStart+repLen);
            var scid = segment.scid;
            return this.template.map((tseg,i) => {
                var re = new RegExp(this.values[0], 'ug'); // WARNING: RegExp g is stateful
                var dstText = tseg[this.prop].replace(re, replacement);
                if (i === 0) {
                    var prefix = dstTokens[0] || this.prefix;
                    dstText = prefix + dstText.substring(dstText.indexOf(replacement));
                }
                return {
                    scid: `${scid}.${i+1}`,
                    [this.prop]: dstText,
                };
            });
        }

        toJSON() {
            return this;
        }
    }

    module.exports = exports.Section = Section;
})(typeof exports === "object" ? exports : (exports = {}));

