const {join} = require('path');

/**
 * @type {import("puppeteer").Configuration}
 */
module.exports = {
	// Changes the cache location for Puppeteer.
	cacheDirectory: join(__dirname, 'puppeteer'),
	chrome: {
		version: '119.0.6045.105'
	}
};
