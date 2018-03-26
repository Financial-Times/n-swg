const { expect } = require('chai');
const sinon = require('sinon');

const { JSDOM, _helpers } = require('./mocks/document');
const SubscribeButtons = require('../../src/client/subscribe-button/index');

const HTML = '<body><div id="other-element"></div><div class="n-swg-button"></div><div class="n-swg-button"></div><div class="n-swg-button"></div><div class="n-swg-button"></div></body>';

describe('FEATURE: subscribe-button.js', function () {
	let mockSwgClient = { subscribe: () => true };
	let mockOverlay;
	let helpers;
	const customSelector = '.n-swg-button';

	beforeEach(() => {
		const jsdom = new JSDOM(HTML);
		global.document = jsdom.window.document;
		helpers = _helpers(jsdom);
		mockOverlay = {
			show: sinon.stub(),
			hide: sinon.stub()
		};
		sinon.stub(mockSwgClient, 'subscribe');
	});

	afterEach(() => {
		mockSwgClient.subscribe.restore();
		delete global.document;
	});

	it('exports a function', function () {
		expect(SubscribeButtons).to.be.a('Function');
	});

	context('with button elements on page', function () {
		let subject;
		let buttons;
		let mockDomListeners;
		let trackEvent;

		beforeEach(() => {
			mockDomListeners = [];
			/* Dummy class with static methods */
			class MockSwgController {
				static trackEvent () {
					return true;
				}
				static onError (l) {
					mockDomListeners.push({ t: 'error', l });
				}
				static onReturn (l) {
					mockDomListeners.push({ t: 'return', l });
				}
			};

			trackEvent = sinon.stub(MockSwgController, 'trackEvent');
			subject = new SubscribeButtons(mockSwgClient, { SwgController: MockSwgController, selector: customSelector, overlay: mockOverlay });
			buttons = global.document.querySelectorAll(customSelector);
		});

		afterEach(() => {
			trackEvent.restore();
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
				const onErrorStub = sinon.stub(subject, 'onError');

				subject.init();

				triggerEvent('error', new Error('mock error'));
				expect(onErrorStub.calledOnce, 'error called').to.be.true;

				triggerEvent('return', { success: true });
				expect(onReturnStub.calledOnce, 'return called').to.be.true;

				subject.onReturn.restore();
			});

			it('hide overlay onError events', function () {
				const triggerEvent = (type, ev) => mockDomListeners.find(({ t }={}) => t === type).l.call(ev);

				subject.init();

				triggerEvent('error', new Error('mock error'));
				expect(mockOverlay.hide.calledOnce, 'overlay hidden onSwgError').to.be.true;
			});

			it('hide overlay onReturn events', function () {
				const triggerEvent = (type, ev) => mockDomListeners.find(({ t }={}) => t === type).l.call(ev);
				sinon.stub(subject, 'disableButtons');

				subject.init();

				triggerEvent('return', { success: true });
				expect(mockOverlay.hide.notCalled, 'overlay hidden onSwgError').to.be.true;
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

				it('shows the overlay', function () {
					subject.handleClick(mockEvent);
					expect(mockOverlay.show.calledOnce).to.be.true;
					expect(mockOverlay.hide.notCalled).to.be.true;
				});

				it('triggers a landing event', function () {
					subject.handleClick(mockEvent);
					expect(trackEvent.calledWith('landing', {})).to.be.true;
				});

				it('calls swgClient.subscribe with the SKU from the event', function () {
					subject.handleClick(mockEvent);
					expect(mockSwgClient.subscribe.calledWith(MOCK_SKU)).to.be.true;
				});

				it('hides the overlay if there is an error', function () {
					mockEvent.target.getAttribute = sinon.stub().throws(new Error('mock'));

					subject.handleClick(mockEvent);
					expect(mockOverlay.show.calledOnce).to.be.true;
					expect(mockOverlay.hide.calledOnce).to.be.true;
				});

			});

		});

	});

});
