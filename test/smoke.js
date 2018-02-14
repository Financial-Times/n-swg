module.exports = [
	{
		name: 'button',
		urls: {
			'/': {
				status: 200,
				pageErrors: 0,
				content: (content) => {
					return content.includes('swg.js');
				}
			}
		}
	}
];
