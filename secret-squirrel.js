module.exports = {
	files: {
		allow: [],
		allowOverrides: []
	},
	strings: {
		deny: [],
		denyOverrides: [
			'41218b9e-c8ae-c934-43ad-71b13fcb4465', // test/server/tools/fixtures/offers.js:1
			'2c92a0f94a37f8bb014a4e6caec20fe5', // test/server/tools/fixtures/offers.js:1|1
			'c8ad55e6-ba74-fea0-f9da-a4546ae2ee23', // test/server/tools/split-offer-by-charge.spec.js:11|13
			'8c694e3a-04c5-11e8-9650-9c0ad2d7c5b5', // demos/fixtures/mock-article-es-result.js:4
			'b021838e-04e7-11e8-9e12-af73e8db3c71', // demos/fixtures/mock-article-es-result.js:10
			'2324ec27-61c4-379c-bc63-4e7fe729ee21' // demos/fixtures/mock-article-es-result.js:19|21
		]
	}
};
