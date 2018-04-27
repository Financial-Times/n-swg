const { expect } = require('chai');
const sinon = require('sinon');

const { JSDOM, _helpers } = require('./mocks/document');
const mockSwgClient = require('./mocks/swg-client');
const SubscribeButtons = require('../../src/client/subscribe-button/index');
const utils = require('../../src/client/utils');

const HTML = '<body><div id="other-element"></div><div class="n-swg-button"></div><div class="n-swg-button"></div><div class="n-swg-button"></div><div class="n-swg-button"></div></body>';

describe('FEATURE: subscribe-button.js', function () {
	let helpers;
	let swgClient;
	let sandbox;
	const customSelector = '.n-swg-button';

	beforeEach(() => {
		sandbox = sinon.sandbox.create();
		swgClient = new mockSwgClient();
		const jsdom = new JSDOM(HTML);
		global.document = jsdom.window.document;
		helpers = _helpers(jsdom);
		sandbox.stub(swgClient, 'subscribe');
		sandbox.stub(swgClient, 'showOffers');
	});

	afterEach(() => {
		sandbox.restore();
		delete global.document;
	});

	it('exports a function', function () {
		expect(SubscribeButtons).to.be.a('Function');
	});

	context('with button elements on page', function () {
		let subject;
		let buttons;
		let mockDomListeners;

		beforeEach(() => {
			mockDomListeners = [];
			const listen = (ev, l) => mockDomListeners.push({ t: ev, l });
			sandbox.stub(utils.events, 'listen').callsFake(listen);
			sandbox.stub(utils.events, 'signal');
			subject = new SubscribeButtons(swgClient, { selector: customSelector });
			buttons = global.document.querySelectorAll(customSelector);
		});

		describe('constructor()', function () {

			it('disables all buttons', function () {
				buttons.forEach((el) => {
					expect(el.disabled).to.equal(true);
				});
			});

		});

		describe('init()', function () {

			it('is a function', function () {
				expect(subject.init).to.be.a('Function');
			});

			it('adds "click" event listeners for each button', function () {
				const handleClickStub = sandbox.stub(subject, 'handleClick');

				subject.init();
				const btn = buttons[3];
				helpers.clickElement(btn);
				expect(handleClickStub.calledOnce).to.be.true;

				const eventArg = handleClickStub.getCall(0).args[0];
				expect(eventArg.target).to.deep.equal(btn);
				subject.handleClick.restore();
			});

			it('enables all buttons', function () {
				subject.init();
				buttons.forEach((el) => {
					expect(el.disabled).to.equal(false);
				});
			});

			it('attatches swgEventListener callbacks for onReturn and onError events', function () {
				const triggerEvent = (type, ev) => mockDomListeners.find(({ t }={}) => t === type).l.call(ev);
				const onReturnStub = sandbox.stub(subject, 'onReturn');

				subject.init();

				triggerEvent('onReturn', { success: true });
				expect(onReturnStub.calledOnce, 'return called').to.be.true;

				subject.onReturn.restore();
			});

			it('disable buttons onReturn events', function () {
				const triggerEvent = (type, ev) => mockDomListeners.find(({ t }={}) => t === type).l.call(ev);
				sandbox.stub(subject, 'disableButtons');

				subject.init();

				triggerEvent('onReturn', { success: true });
				expect(subject.disableButtons.calledOnce).to.be.true;
				subject.disableButtons.restore();
			});

		});

		describe('methods', function () {

			context('.enableButtons()', function () {
				it('is a function', function () {
					expect(subject.enableButtons).to.be.a('Function');
				});

				it('removes "disabled" attribute from buttons', function () {
					subject.enableButtons();
					buttons.forEach((el) => {
						expect(el.disabled).to.equal(false);
					});
				});
			});

			context('.handleClick()', function () {
				const MOCK_SKU = 'foo';
				let mockEvent;

				beforeEach(() => {
					mockEvent = {
						preventDefault: sandbox.stub(),
						target: {
							getAttribute: sandbox.stub().returns(MOCK_SKU)
						}
					};
				});

				it('is a function', function () {
					expect(subject.handleClick).to.be.a('Function');
				});

				it('preventsDefault() on the event', function () {
					subject.handleClick(mockEvent);
					expect(mockEvent.preventDefault.calledOnce).to.be.true;
				});

				it('calls swgClient.subscribe with the single SKU from the event target', function () {
					subject.handleClick(mockEvent);
					expect(swgClient.subscribe.calledWith(MOCK_SKU)).to.be.true;
				});

				it('calls swgClient.showOffers with the mutiple SKUs from the event target', function () {
					const MOCK_SKUS = 'foo,bar';
					mockEvent.target.getAttribute.returns(MOCK_SKUS);
					subject.handleClick(mockEvent);
					expect(swgClient.showOffers.calledWith({ skus: MOCK_SKUS.split(','), isClosable: true })).to.be.true;
				});

				it('signals an error event in case of an error', function () {
					const ERR = new Error('mock');
					mockEvent.target.getAttribute = sandbox.stub().throws(ERR);

					subject.handleClick(mockEvent);
					expect(utils.events.signal.calledWith('onError', { error: ERR })).to.be.true;
				});

			});

		});

	});

});
