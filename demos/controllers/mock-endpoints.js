const mockMembership = require('../utils/membership-mocks');

module.exports = (MOCK_MODE) => (req, res, next) => {
	if (MOCK_MODE) {
		return mockMembership(req, res, next);
	} else {
		next();
	}
};
