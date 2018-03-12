const { expect } = require('chai');
const sinon = require('sinon');

const { JSDOM, _helpers } = require('./mocks/document');
const SubscribeButtons = require('../../src/client/subscribe-button/index');

describe('FEATURE: subscribe-button.js', function () {
	let mockSwgClient = { subscribe: () => true };
	let mockTrackEvent;
	let mockOverlay;
	let helpers;
	const customSelector = '.n-swg-button';

	beforeEach(() => {
		const jsdom = new JSDOM();
		global.document = jsdom.window.document;
		helpers = _helpers(jsdom);
		mockOverlay = {
			show: sinon.stub(),
			hide: sinon.stub()
		};
		sinon.stub(mockSwgClient, 'subscribe');
		mockTrackEvent = sinon.stub();
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

		beforeEach(() => {
			helpers.addElement({ name: '#other-element', val: {} });
			for (let i=0 ; i < 4; i++) {
				helpers.addElement({ classString: customSelector.replace('.', ''), val: { id: i } });
			}
			subject = new SubscribeButtons(mockSwgClient, { trackEvent: mockTrackEvent, selector: customSelector, overlay: mockOverlay });
			buttons = global.document.querySelectorAll(customSelector);
		});

		afterEach(() => {
			subject = null;
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
				const onReturnStub = sinon.stub(subject, 'onReturn');
				const listeners = {};
				const triggerEvent = (type, ev) => listeners[type](ev);
				const swgEventListeners = {
					onError: function (callback) {
						listeners['onError'] = callback;
					},
					onReturn: function (callback) {
						listeners['onReturn'] = callback;
					}
				};

				subject.init(swgEventListeners);

				triggerEvent('onError', new Error('mock error'));
				expect(onReturnStub.calledOnce).to.be.true;

				triggerEvent('onReturn', { success: true });
				expect(onReturnStub.calledTwice).to.be.true;

				subject.onReturn.restore();
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

					expect(mockTrackEvent.calledWith('landing', {})).to.be.true;
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
