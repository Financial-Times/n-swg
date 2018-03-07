const { expect } = require('chai');
const sinon = require('sinon');

const Document = require('./mocks/document');
const SubscribeButtons = require('../../src/client/subscribe-button/index');

describe('FEATURE: subscribe-button.js', function () {
	let dom;
	let mockSwgClient = { subscribe: () => true };
	let mockTrackEvent;
	let mockOverlay;
	const customSelector = '[data-n-swg-btn]';

	beforeEach(() => {
		dom = global.document = new Document();
		mockOverlay = {
			show: sinon.stub(),
			hide: sinon.stub()
		};
		sinon.stub(mockSwgClient, 'subscribe');
		mockTrackEvent = sinon.stub();
	});

	afterEach(() => {
		dom._reset();
		dom = global.document = null;
		mockSwgClient.subscribe.restore();
		mockTrackEvent = null;
		mockOverlay = null;
	});

	it('exports a function', function () {
		expect(SubscribeButtons).to.be.a('Function');
	});

	context('with button elements on page', function () {
		let subject;

		beforeEach(() => {
			dom._addElement({ name: '#other-element', val: {} });
			for (let i=0 ; i < 4; i++) {
				dom._addElement({ name: customSelector, val: { id: i } });
			}
			subject = new SubscribeButtons(mockSwgClient, { trackEvent: mockTrackEvent, selector: customSelector, overlay: mockOverlay });
		});

		afterEach(() => {
			subject = null;
		});

		describe('constructor()', function () {

			it('disables all buttons', function () {
				dom._elements.forEach((el) => {
					const expectedVal = el.selector === customSelector ? true : undefined;
					expect(el.disabled).to.equal(expectedVal);
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
				dom._elements[3]._triggerEvent('click', { val: 'to-pass' });
				expect(handleClickStub.calledOnce).to.be.true;

				const eventArg = handleClickStub.getCall(0).args[0];
				expect(eventArg.target).to.deep.equal(dom._elements[3]);
				subject.handleClick.restore();
			});

			it('enables all buttons', function () {
				subject.init();
				dom._elements.forEach((el) => {
					expect(el.disabled).to.equal(undefined);
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
					dom._elements.forEach((el) => {
						expect(el.disabled).to.equal(undefined);
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
