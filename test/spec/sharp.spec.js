
'use strict';

var sharp = require('sharp');

describe('sharp', function() {
	it('should export #transform', function() {
		expect(sharp).to.have.property('transform');
	});

	it('should export #metadata', function() {
		expect(sharp).to.have.property('metadata');
	});
});
