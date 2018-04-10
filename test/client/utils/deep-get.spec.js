const { expect } = require('chai');

const _get = require('../../../src/client/utils/deep-get');

describe('Util: deep-get.js', function () {

	it('return deep value from an object', function () {
		const MOCK = { foo: { bar: { baz: 'bang' } } };
		expect(_get(MOCK, 'foo.bar.baz')).to.equal('bang');
	});

	it('return undefined if not found', function () {
		const MOCK = { foo: { bar: { wiz: 'bang' } } };
		expect(_get(MOCK, 'foo.bar.baz')).to.equal(undefined);
	});

	it('return undefined if invalid parameters', function () {
		expect(_get('string', 'foo.bar.baz')).to.equal(undefined);
	});

});
