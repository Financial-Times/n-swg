module.exports = (obj={}, str='') => {
	if (typeof obj !== 'object' || typeof str !== 'string') return undefined;
	let paths = str.split('.');
	let current = obj;
	for (let i = 0; i < paths.length; ++i) {
		if (current[paths[i]] === undefined) {
			return undefined;
		} else {
			current = current[paths[i]];
		}
	}
	return current;
};
