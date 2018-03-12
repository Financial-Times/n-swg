const { expect } = require('chai');
const sinon = require('sinon');

const { JSDOM } = require('./mocks/document');
const SwgController = require('../../src/client/swg-controller');

describe('Bower main-client.js', function () {
	let subject;

	beforeEach(() => {
		const jsdom = new JSDOM('<body><div id="swg-client"></div></body>');
		global.document = jsdom.window.document;
		subject = require('../../main-client');
	});

	afterEach(() => {
		delete global.document;
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
		expect(subject.SwgController).to.deep.equal(SwgController);
	});

	describe('swgLoader', function () {

		beforeEach(() => {
			global.self = {};
		});

		afterEach(() => {
			delete global.self;
		});

		it('is a function', function () {
			expect(subject.swgLoader).to.be.a('Function');
		});

		it('returns a promise', function () {
			expect(subject.swgLoader()).to.be.a('Promise');
		});

		it('calls SwgController.load() with correct options', function (done) {
			sinon.stub(SwgController, 'load').resolves();
			subject.swgLoader({ manualInitDomain: 'ft.com' }).then(() => {
				expect(SwgController.load.calledWith({ manual: true })).to.be.true;
				SwgController.load.restore();
				done();
			})
			.catch(err => {
				SwgController.load.restore();
				done(err);
			});
		});

		it('on successful .load() resolves with an instance of the SwgController class', function (done) {
			sinon.stub(SwgController, 'load').resolves();
			subject.swgLoader().then((swg) => {
				expect(SwgController.load.calledWith({ manual: false })).to.be.true;
				expect(swg).to.be.an.instanceOf(SwgController);
				SwgController.load.restore();
				done();
			})
			.catch(err => {
				SwgController.load.restore();
				done(err);
			});
		});

		it('on error in .load() rejects with an error', function (done) {
			const MOCK_ERROR = new Error('loading failed');
			sinon.stub(SwgController, 'load').throws(MOCK_ERROR);
			subject.swgLoader().catch((err) => {
				expect(SwgController.load.calledWith({ manual: false })).to.be.true;
				expect(err).to.be.equal(MOCK_ERROR);
				SwgController.load.restore();
				done();
			})
			.catch(err => {
				SwgController.load.restore();
				done(err);
			});
		});

	});

});
