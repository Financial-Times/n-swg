const { expect } = require('chai');

const subject = require('../../main-client');
const swgControllerSrc = require('../../src/client/swg-controller');

describe('Bower main.js', function () {

	beforeEach(() => {
		document.elements['#swg-client'] = {};
	});

	afterEach(() => {
		document._reset();
	});

	it('exports an object', function () {
		expect(subject).to.be.an('Object');
	});

	it('has correct methods', function () {
		expect(subject.swgLoader).to.be.a('Function');
		expect(subject.SwgController).to.be.a('Function');
		expect(subject.importClient).to.be.a('Function');
	});

	it('exports the SwgController class', function () {
		expect(subject.SwgController).to.be.a('Function');
		expect(subject.SwgController).to.deep.equal(swgControllerSrc);
	});

});
