const { expect } = require('chai');
const sinon = require('sinon');

const { JSDOM, _helpers } = require('./mocks/document');
const SubscribeButtons = require('../../src/client/subscribe-button/index');

const HTML = '<body><div id="other-element"></div><div class="n-swg-button"></div><div class="n-swg-button"></div><div class="n-swg-button"></div><div class="n-swg-button"></div></body>';

describe('FEATURE: subscribe-button.js', function () {
	let mockSwgClient = { subscribe: () => true, showOffers: () => true };
	let helpers;
	const customSelector = '.n-swg-button';

	beforeEach(() => {
		const jsdom = new JSDOM(HTML);
		global.document = jsdom.window.document;
		helpers = _helpers(jsdom);
		sinon.stub(mockSwgClient, 'subscribe');
		sinon.stub(mockSwgClient, 'showOffers');
	});

	afterEach(() => {
		mockSwgClient.subscribe.restore();
		mockSwgClient.showOffers.restore();
		delete global.document;
	});

	it('exports a function', function () {
		expect(SubscribeButtons).to.be.a('Function');
	});

	context('with button elements on page', function () {
		let subject;
		let buttons;
		let mockDomListeners;
		let mockSignal;

		beforeEach(() => {
			mockDomListeners = [];
			/* Dummy class with static methods */
			class MockSwgController {
				static listen (ev, l) {
					mockDomListeners.push({ t: ev, l });
				}
				static signal () {
					return true;
				}
			};

			mockSignal = sinon.stub(MockSwgController, 'signal');
			subject = new SubscribeButtons(mockSwgClient, { SwgController: MockSwgController, selector: customSelector });
			buttons = global.document.querySelectorAll(customSelector);
		});

		afterEach(() => {
			mockSignal.restore();
			mockDomListeners = subject = null;
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
				const handleClickStub = sinon.stub(subject, 'handleClick');

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
				const onReturnStub = sinon.stub(subject, 'onReturn');

				subject.init();

				triggerEvent('onReturn', { success: true });
				expect(onReturnStub.calledOnce, 'return called').to.be.true;

				subject.onReturn.restore();
			});

			it('disable buttons onReturn events', function () {
				const triggerEvent = (type, ev) => mockDomListeners.find(({ t }={}) => t === type).l.call(ev);
				sinon.stub(subject, 'disableButtons');

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
						preventDefault: sinon.stub(),
						target: {
							getAttribute: sinon.stub().returns(MOCK_SKU)
						}
					};
				});

				afterEach(() => {
					mockEvent = null;
				});

				it('is a function', function () {
					expect(subject.handleClick).to.be.a('Function');
				});

				it('preventsDefault() on the event', function () {
					subject.handleClick(mockEvent);
					expect(mockEvent.preventDefault.calledOnce).to.be.true;
				});

				it('signals a landing tracking event', function () {
					subject.handleClick(mockEvent);
					expect(mockSignal.calledWith('track', { action: 'landing', context: { skus: [ MOCK_SKU ] }, journeyStart: true })).to.be.true;
				});

				it('calls swgClient.subscribe with the single SKU from the event target', function () {
					subject.handleClick(mockEvent);
					expect(mockSwgClient.subscribe.calledWith(MOCK_SKU)).to.be.true;
				});

				it('calls swgClient.showOffers with the mutiple SKUs from the event target', function () {
					const MOCK_SKUS = 'foo,bar';
					mockEvent.target.getAttribute.returns(MOCK_SKUS);
					subject.handleClick(mockEvent);
					expect(mockSwgClient.showOffers.calledWith({ skus: MOCK_SKUS.split(',') })).to.be.true;
				});

				it('signals an error event in case of an error', function () {
					const ERR = new Error('mock');
					mockEvent.target.getAttribute = sinon.stub().throws(ERR);

					subject.handleClick(mockEvent);
					expect(mockSignal.calledWith('onError', { error: ERR })).to.be.true;
				});

			});

		});

	});

});
