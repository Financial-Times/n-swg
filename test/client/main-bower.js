const { expect } = require('chai');

const Document = require('./mocks/document');
const swgControllerSrc = require('../../src/client/swg-controller');

describe('Bower main-client.js', function () {
	let subject;
	let dom;

	beforeEach(() => {
		dom = global.document = new Document();
		subject = require('../../main-client');
		document._addElement('#swg-client', {});
	});

	afterEach(() => {
		dom._reset();
		dom = global.document = null;
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
