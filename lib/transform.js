
'use strict';

var _ = require('lodash'),
	File = require('vinyl'),
	async = require('async'),
	through2 = require('through2'),
	sharp = require('sharp');

/*
mode exact:
mode cover: preserve aspect ratio, scale ensuring total fill of given width/height
mode contain: prerve aspect ratio, scale ensuring no cut-off within width/height

*/

function thumbnail(image, meta, options) {

	_.assign({
		mode: 'cover',
		crop: false
	}, options);

	var widthPercent = options.width/meta.width,
		heightPercent = options.height/meta.height;

	var scaleFactor = Math.max(widthPercent, heightPercent);

	var newWidth = meta.width * scaleFactor,
		newHeight = meta.height * scaleFactor;

	var srcX = (options.width - newWidth) / 2,
		srcY = (options.height - newHeight) / 2;

	var operations = [ {
		type: 'resize',
		width: newWidth,
		height: newHeight
	}];

	if (options.crop) {
		operations.push({
			type: 'extract',
			left: srcX,
			top: srcY,
			width: options.width,
			height: options.height
		});
	}

	return operations;
}

var operations = {
	rotate: function(image, meta, options) {
		return image.rotate(options.angle);
	},
	resize: function(image, meta, options) {
		return image.resize(options.width, options.height);
	},
	extract: function(image, meta, options) {
		return image.extract(options.top, options.left, options.width, options.height);
	},
	thumbnail: thumbnail
};



function transforms(image, meta, sequence) {
	return _.reduce(sequence, function(image, transform) {
		var op = operations[transform.type];
		var result = op(image, meta, transform);
		if (_.isArray(result)) {
			return transforms(image, meta, result);
		} else {
			return result;
		}
	}, image);
}

function process(image, meta, output, callback) {

	image = transforms(image, meta, output.transforms)

	if (_.has(output, 'progressive') && output.progressive) {
		image.progressive();
	}

	if (_.has(output, 'quality')) {
		image.quality(output.quality*100);
	}

	if (_.has(output, 'format')) {
		if (!_.contains(['webp', 'jpeg', 'png'], output.format)) {
			return callback(new TypeError());
		}

		image[output.format]();
	}

	image.toBuffer(callback);
}

function transform(options) {

	options = _.assign({

	}, options);

	return through2.obj(function(file, encoding, callback) {

		var self = this;

		// Skip files that don't have any contents
		if (!file.isBuffer() && !file.isStream()) {
			return callback(null, file);
		}

		// Read in the necessary metadata
		sharp(file.contents).metadata(function(err, metadata) {
			if (err) {
				return callback(err);
			}

			async.forEach(options.outputs, function(output, next) {
				process(sharp(file.contents), metadata, output, function(err, result, metadata) {
					if (err) {
						return next(err);
					}

					var output = new File({
						path: file.path + Math.floor(Math.random()*10000000),
						base: file.base,
						cwd: file.cwd,
						contents: result
					});

					output.metadata = metadata;
					output.options = output;

					self.push(output);

					next();

				});
			}, callback);
		});
	});
}

module.exports = transform;
