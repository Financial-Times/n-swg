const { expect } = require('chai');
const sinon = require('sinon');

const { JSDOM } = require('../mocks/document');
const subject = require('../../../src/client/utils/events');

describe('Utils: events.js', function () {
	let dom;

	beforeEach(() => {
		const jsdom = new JSDOM();
		global.CustomEvent = jsdom.window.CustomEvent;
		dom = global.document = jsdom.window.document;
	});

	afterEach(() => {
		delete global.document;
		delete global.CustomEvent;
	});

	it('exports an object', function () {
		expect(subject).to.be.an('Object');
	});

	describe('.track()', function () {

		it('is a function', function () {
			expect(subject.track).to.be.a('Function');
		});

		it('dispatches a custom oTracking.event on the document.body', function (done) {
			dom.body.addEventListener('oTracking.event', (event) => {
				expect(event.type).to.equal('oTracking.event');
				done();
			});
			subject.track({}, CustomEvent);
		});

	});

	describe('.signalError()', function () {

		it('is a function', function () {
			expect(subject.signalError).to.be.a('Function');
		});

		it('signals an onError event with correctly formatted detail', function () {
			const signalStub = sinon.stub(subject, 'signal');
			const ERR = new Error('bad');
			const INFO = { some: 'extra info' };
			subject.signalError(ERR, INFO);
			expect(signalStub.calledWith('onError', { error: ERR, info: INFO }));
			signalStub.restore();
		});

	});

	describe('.listen()', function () {

		it('is a function', function () {
			expect(subject.listen).to.be.a('Function');
		});

		it('will attatch a name spaced event listener to the body', function () {
			sinon.stub(dom.body, 'addEventListener');

			subject.listen('load', () => true);
			const [ name, func ] = dom.body.addEventListener.getCall(0).args;
			expect(name).to.equal('nSwg.load');
			expect(func).to.be.a('function');

			dom.body.addEventListener.restore();
		});

	});

	describe('.signal()', function () {

		it('is a function', function () {
			expect(subject.signal).to.be.a('Function');
		});

		it('will dispatch a name spaced event to the body', function () {
			sinon.stub(dom.body, 'dispatchEvent');
			const DETAIL = { foo: 'bar' };

			subject.signal('load', DETAIL, CustomEvent);
			const event = dom.body.dispatchEvent.getCall(0).args[0];
			expect(event.type).to.equal('nSwg.load');
			expect(event.detail).to.equal(DETAIL);

			dom.body.dispatchEvent.restore();
		});

	});

});
