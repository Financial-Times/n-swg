const { expect } = require('chai');

const subject = require('../../../src/client/utils/browser');

describe('Utils: browser.js', function () {

	beforeEach(() => {
		global.window = {};
	});

	afterEach(() => {
		delete global.window;
	});

	it('exports an object', function () {
		expect(subject).to.be.an('Object');
	});

	describe('.redirectTo()', function () {

		it('is a function', function () {
			expect(subject.redirectTo).to.be.a('Function');
		});

		it('sets window.location.href to value', function () {
			global.window = { location: {} };
			subject.redirectTo('https://www.ft.com');
			expect(global.window.location.href).to.equal('https://www.ft.com');
			delete global.window;
		});

	});

	describe('.getWindowLocation()', function () {

		it('is a function', function () {
			expect(subject.getWindowLocation).to.be.a('Function');
		});

		it('gets window.location value', function () {
			const RESULT = { search: 'this', href: 'that' };
			global.window = { location: RESULT };
			const result = subject.getWindowLocation('https://www.ft.com');
			expect(result).to.equal(RESULT);
			delete global.window;
		});

	});

	describe('.getContentUuidFromUrl()', function () {

		it('is a function', function () {
			expect(subject.getContentUuidFromUrl).to.be.a('Function');
		});

		it('defaults to undefined', function () {
			const result = subject.getContentUuidFromUrl();
			expect(result).to.be.undefined;
		});

		it('extracts uuid from query string', function () {
			global.window.location = { search: '?ft-content-uuid=12345'};
			const result = subject.getContentUuidFromUrl();
			expect(result).to.be.equal('12345');
		});

		it('extracts uuid from url path', function () {
			global.window.location = { href: '/content/12345'};
			const result = subject.getContentUuidFromUrl();
			expect(result).to.be.equal('12345');
		});

		it('extracts query string over path', function () {
			global.window.location = { href: '/content/12345', search: '?ft-content-uuid=54321' };
			const result = subject.getContentUuidFromUrl();
			expect(result).to.be.equal('54321');
		});

	});

});
