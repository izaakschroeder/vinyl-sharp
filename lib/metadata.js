
'use strict';

var _ = require('lodash'),
	async = require('async'),
	through2 = require('through2'),
	sharp = require('sharp');

function metadata(options) {
	options = _.assign({
		strict: false
	}, options);
	return through2(function(file, encoding, callback) {
		sharp(file.contents).metadata(function(err, data) {
			if (err && options.strict) {
				callback(err);
			}
			file.meta = data;
			callback(null, file);
		});
	});
}

module.exports = metadata;
