/**
 * Replicate the google swg library API
 */
module.exports = class SwgClient {

	constructor () {
	}

	init () {
		return true;
	}

	setOnFlowCanceled () {
		return true;
	}

	setOnFlowStarted () {
		return true;
	}

	setOnPaymentResponse () {
		return true;
	}

	setOnEntitlementsResponse () {
		return true;
	}

	getEntitlements () {
		return Promise.resolve(true);
	}

	showOffers () {
		return true;
	}

	subscribe () {
		return true;
	}

	showSubscribeOption () {
		return true;
	}

	showAbbrvOffer () {
		return true;
	}

	waitForSubscriptionLookup () {
		return Promise.resolve(true);
	}

	showLoginNotification () {
		return Promise.resolve(true);
	}

	completeDeferredAccountCreation () {
		return Promise.resolve(true);
	}

};
