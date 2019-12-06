const { expect } = require('chai');

const { JSDOM } = require('../mocks/document');
const importSWG = require('../../../src/client/utils/swg-client-loader');

describe('Util: swg-client-loader.js', function () {
	let dom;
	let subject;

	beforeEach(() => {
		const jsdom = new JSDOM();
		dom = global.document = jsdom.window.document;
		subject = importSWG(dom);
	});

	afterEach(() => {
		delete global.document;
	});

	it('exports a function', function () {
		expect(subject).to.be.a('Function');
	});

	it('will return early if element with id already exists on page', function () {
		dom = global.document = (new JSDOM('<body><div id="foo"></div></body>')).window.document;
		importSWG(dom)({ id: 'foo'});
		expect(dom.querySelectorAll('#foo').length).to.equal(1);
	});

	it('creates a new element if id does not already exist', function () {
		dom = global.document = (new JSDOM('<body><div id="bar"></div></body>')).window.document;
		importSWG(dom)({ id: 'foo'});
		expect(dom.querySelectorAll('#foo').length, 'script tag added').to.equal(1);
		expect(dom.querySelectorAll('#bar').length, 'existing div').to.equal(1);
	});

	context('creates and adds a SCRIPT element to the document', function () {
		const defaultSelector = '#swg-client';

		it('with correct default attributes', function () {
			subject();
			const resultEl = dom.querySelector(defaultSelector);
			expect(resultEl.getAttribute('src')).to.equal('https://news.google.com/swg/js/v1/swg.js');
			expect(resultEl.async).to.equal(true);
			expect(resultEl.getAttribute('subscriptions-control')).to.be.null;
			expect(resultEl.id).to.equal('swg-client');
		});

		it('with correct default attributes in sandbox mode', function () {
			subject({ sandbox: true });
			const resultEl = dom.querySelector(defaultSelector);
			expect(resultEl.getAttribute('src')).to.equal('https://news.google.com/swg/js/v1/swg-tt.js');
			expect(resultEl.async).to.equal(true);
			expect(resultEl.getAttribute('subscriptions-control')).to.be.null;
			expect(resultEl.id).to.equal('swg-client');
		});

		it('with correct custom attributes if passed', function () {
			subject({ id: 'bar', manual: true, src: 'https://foo.com/file.js' });
			const resultEl = dom.querySelector('#bar');
			expect(resultEl.getAttribute('src')).to.equal('https://foo.com/file.js');
			expect(resultEl.async).to.equal(true);
			expect(resultEl.getAttribute('subscriptions-control')).to.equal('manual');
			expect(resultEl.id).to.equal('bar');
		});

	});

});
