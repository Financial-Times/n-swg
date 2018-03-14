const { expect } = require('chai');

const subject = require('../../../src/client/utils/swg-ready');

describe('Util: swg-ready.js', function () {
	let _self;

	beforeEach(() => {
		_self = {};
	});

	it('exports a promise', function () {
		expect(subject(_self)).to.be.a('Promise');
	});

	it('pushes a function callback onto an existing self.SUBSCRIPTIONS array', function () {
		_self.SUBSCRIPTIONS = ['SOME_VAL'];
		subject(_self);
		expect(_self.SUBSCRIPTIONS[0]).to.equal('SOME_VAL');
		expect(_self.SUBSCRIPTIONS[1]).to.be.a('Function');
	});

	it('creates a self.SUBSCRIPTIONS array with a callback function', function () {
		subject(_self);
		expect(_self.SUBSCRIPTIONS).to.be.an('Array');
		expect(_self.SUBSCRIPTIONS[0]).to.be.a('Function');
	});

	it('resolves when async SwG third party script invokes the callback function', function (done) {
		const callbackVal = 'foo';

		const swgReady = subject(_self);
		expect(swgReady).to.be.a('Promise');

		mockAsyncSwgThirdPartyLoad(_self, callbackVal);

		swgReady.then((val) => {
			expect(val).to.equal(callbackVal);
			done();
		});
	});

});

function mockAsyncSwgThirdPartyLoad (_self, val) {
	const callback = _self.SUBSCRIPTIONS.pop();
	setTimeout(function () { callback(val); }, 100);
};
