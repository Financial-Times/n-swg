const { expect } = require('chai');
const sinon = require('sinon');

const smartFetch = require('../../../src/client/utils/fetch');

describe('Util: fetch.js', function () {
	let _fetchMock;
	let mockResult;

	beforeEach(() => {
		mockResult = {
			status: 200,
			headers: {},
			json: function () {
				return Promise.resolve(this.body);
			},
			text: function () {
				return Promise.resolve(this.body);
			},
			body: {}
		};
		_fetchMock = () => Promise.resolve(mockResult);
	});

	afterEach(() => {
		mockResult = null;
		_fetchMock = null;
	});

	it('exports a function', function () {
		expect(smartFetch.fetch).to.be.a('Function');
	});

	it('returns a promise', function () {
		const subject = smartFetch.fetch('', '', _fetchMock);
		expect(subject).to.be.a('Promise');
	});

	it('formats request from options passed', function (done) {
		const MOCK_URL = 'https://ft.com';
		const MOCK_OPTIONS = { timeout: 5000 };
		const fetchStub = sinon.stub().resolves(mockResult);
		const subject = smartFetch.fetch(MOCK_URL, MOCK_OPTIONS, fetchStub);
		subject.then(() => {
			expect(fetchStub.calledOnce).to.be.true;
			const [ url, opts ] = fetchStub.getCall(0).args;
			expect(url).to.equal(MOCK_URL);
			expect(opts).to.contain(MOCK_OPTIONS);
			expect(opts).to.deep.equal({ method: 'GET', timeout: 5000 });
			done();
		});
	});

	it('handles a 200 with json body and resolves with an object', function (done) {
		const RESULT = { example: 'json body' };
		mockResult.body = JSON.stringify(RESULT);
		const MOCK_HEADERS = mockResult.headers = { 'content-type': 'application/json' };
		const MOCK_STATUS = mockResult.status = 200;
		const subject = smartFetch.fetch('', '', _fetchMock);
		subject.then(result => {
			expect(result.json).to.deep.equal(RESULT);
			expect(result.headers).to.deep.equal(MOCK_HEADERS);
			expect(result.status).to.deep.equal(MOCK_STATUS);
			done();
		});
	});

	it('handles a 201 without a json body and resolves with an empty object', function (done) {
		mockResult.body = 'OK';
		const MOCK_HEADERS = mockResult.headers = { 'content-type': 'text/html' };
		const MOCK_STATUS = mockResult.status = 201;
		const subject = smartFetch.fetch('', '', _fetchMock);
		subject.then(result => {
			expect(result.json).to.deep.equal({});
			expect(result.headers).to.deep.equal(MOCK_HEADERS);
			expect(result.status).to.deep.equal(MOCK_STATUS);
			done();
		});
	});

	it('handles a bad response with res.text() and rejects with an error', function (done) {
		const MOCK_BODY = mockResult.body = 'System Down';
		const MOCK_STATUS = mockResult.status = 500;
		const subject = smartFetch.fetch('', '', _fetchMock);
		subject.catch(err => {
			expect(err).to.be.an('Error');
			expect(err.message).to.deep.equal(`Bad response STATUS=${MOCK_STATUS} TEXT="${MOCK_BODY}"`);
			done();
		});
	});

});