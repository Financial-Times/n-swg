const { expect } = require('chai');

const subject = require('../../main');

describe('NPM main.js', function () {

	it('exports an object', function () {
		expect(subject).to.be.an('Object');
	});

	it('has correct methods', function () {
		expect(subject.offerToSkuTransformer).to.be.a('Function');
	});

});
