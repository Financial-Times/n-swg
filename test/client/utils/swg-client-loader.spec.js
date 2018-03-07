const { expect } = require('chai');

const Document = require('../mocks/document');
const importClient = require('../../../src/client/utils/swg-client-loader');

describe('Util: swg-client-loader.js', function () {
	let dom;
	let subject;

	beforeEach(() => {
		dom = global.document = new Document();
		subject = importClient(dom);
	});

	afterEach(() => {
		dom._reset();
		dom = global.document = null;
		subject = null;
	});

	it('exports a function', function () {
		expect(subject).to.be.a('Function');
	});

	it('will return early if element with id already exists on page', function () {
		dom._addElement({ name: '#foo' });
		subject({ id: 'foo'});
		expect(dom._elements.length).to.equal(1);
	});

	it('creates a new element if id does not already exist', function () {
		dom._addElement({ name: '#bar' });
		subject({ id: 'foo'});
		expect(dom._elements.length).to.equal(2);
	});

	context('creates and adds a SCRIPT element to the document', function () {

		it('with correct default attributes', function () {
			subject();
			expect(dom._elements.length).to.equal(1);
			const resultEl = dom._elements[0];
			expect(resultEl.src).to.equal('https://subscribe.sandbox.google.com/swglib/swg.js');
			expect(resultEl.async).to.equal(true);
			expect(resultEl['subscriptions-control']).to.be.undefined;
			expect(resultEl.id).to.equal('swg-client');
			expect(resultEl.type).to.equal('SCRIPT');
		});

		it('with correct custom attributes if passed', function () {
			subject({ id: 'bar', manual: true, src: 'https://foo.com/file.js' });
			expect(dom._elements.length).to.equal(1);
			const resultEl = dom._elements[0];
			expect(resultEl.src).to.equal('https://foo.com/file.js');
			expect(resultEl.async).to.equal(true);
			expect(resultEl['subscriptions-control']).to.equal('manual');
			expect(resultEl.id).to.equal('bar');
			expect(resultEl.type).to.equal('SCRIPT');
		});

	});

});
