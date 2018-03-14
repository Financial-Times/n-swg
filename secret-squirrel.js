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
			'c8ad55e6-ba74-fea0-f9da-a4546ae2ee23' // test/server/tools/split-offer-by-charge.spec.js:11|13
		]
	}
};
