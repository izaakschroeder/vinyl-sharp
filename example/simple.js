
var argv = require('yargs').argv,
	fs = require('vinyl-fs'),
	path = require('path'),
	sharp = require(path.join(__dirname, '..'))

var options = {
	outputs: [{
		quality: 0.8,
		format: 'webp',
		progressive: true,
		transforms: [{
			type: 'thumbnail',
			width: 200,
			height: 200
		}]
	}, {
		quality: 0.9,
		format: 'jpeg',
		progressive: true,
		transforms: [{
			type: 'extract',
			left: 0,
			top: 0,
			width: 100,
			height: 100
		}]
	}, {
		format: 'png',
		transforms: [{
			type: 'rotate',
			angle: 90
		}]
	}]
};

fs.src(argv._)
	.pipe(sharp.transform(options))
	.pipe(fs.dest(argv.dest));
