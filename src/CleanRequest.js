/**
 * Cleans a request of desired fields that are not needed, or are a security risk,
 * as defined by the user when initalizing the middleware
 * @param {Object} req Express request object

 * @typedef {object} settings
 * @property {String[]} excludeHeadersParams
 * Header parameters to be removed from logs. - Default `['Authorization']`
 *
 * @property {String[]} excludeBodyParams
 * Body parameters to be removed from logs - Default: `null`
 *
 * @property {String[]} excludeRouteParams
 * Route parameters to be removed from logs - Default: `null`
 *
 * @property {String[]} excludeQueryParams
 * Query parameters to be removed from logs - Default `null`
 *
 * @param {settings} settings
 */
function CleanRequest(req, settings) {
	let r = {};
	Object.assign(r, req);

	//Strip some header params
	if (settings.excludeHeadersParams) {
		for (let index = 0; index < settings.excludeHeadersParams.length; index++) {
			const element = settings.excludeHeadersParams[index];
			delete r.headers[element];
		}
	}

	//Strip some body params
	if (settings.excludeBodyParams) {
		for (let index = 0; index < settings.excludeBodyParams.length; index++) {
			const element = settings.excludeBodyParams[index];
			delete r.body[element];
		}
	}

	//Strip some route params
	if (settings.excludeRouteParams) {
		for (let index = 0; index < settings.excludeRouteParams.length; index++) {
			const element = settings.excludeRouteParams[index];
			delete r.params[element];
		}
	}

	//Strip query params
	if (settings.excludeQueryParams) {
		for (let index = 0; index < settings.excludeQueryParams.length; index++) {
			const element = settings.excludeQueryParams[index];
			delete r.query[element];
		}
	}

	return r;
}

module.exports = CleanRequest;
