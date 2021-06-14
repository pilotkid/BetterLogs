const process = require("process");
const CreateLog = require("./CreateLogEntry");

//LIST OF DEFAULT SETTINGS TO BE USED
let defaultSettings = {
	minStatusCode: 200,
	excludeHeadersParams: ["Authorization"],
	excludeBodyParams: null,
	excludeRouteParams: null,
	excludeQueryParams: null,
	exludeRequestTypes: ["OPTIONS"],
	includeFullRequest: true,
	includeFullResponse: true,
	extraTopLevelPropsRequest: [],
	extraTopLevelPropsResponse: [],
	mongoConnectionString: null,
	normalCollection: "Log",
	errorCollection: "ErrorLog",
	requestTime: true,
	requestTime_nanoSeconds: false,
	returnError: true,
};

/**
 * @typedef {object} Configuration
 *
 * @property {Integer} minStatusCode
 * Minimum statuscode to be logged. - Suggested `400` - Default `200`
 *
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
 * @property {String[]} exludeRequestTypes
 * Can by any HTTP status code, will be ignored for errors
 * E.G. `GET`, `POST`, `DELETE`, `PUT`, `PATCH`, `OPTIONS`, ETC - Default: `null`
 *
 * @property {Boolean} includeFullRequest
 * Include the request object in the log - Default: `true`
 *
 * @property {Boolean} includeFullResponse
 * Include the response object in the log - Default: `true`
 *
 * @property {String[]} extraTopLevelPropsRequest
 * Include properties from the request to the root of the new object - Default: `null`
 *
 * @property {String[]} extraTopLevelPropsResponse
 * Include properties from the response to the root of the new object - Default: `null`
 *
 * @property {String} mongoConnectionString
 * The connection string for MongoDB (required)
 *
 * @property {String} normalCollection
 * The collection to store normal requests (without uncaught exceptions) - Default: `Log`
 *
 * @property {String} errorCollection
 * The collection to store normal requests (with uncaught exceptions) - Default: `ErrorLog`
 *
 * @property {Boolean} requestTime
 * Record the amount of time for the request to process - Default: `true`
 *
 * @property {Boolean} requestTime_nanoSeconds
 * Should request time be logged in nanoseconds or miliseconds - Default `false` (Miliseconds)
 *
 * @property {Boolean} returnError
 * Should the middleware return a 500 error on unhandled exception? - Default `true`
 *
 * @param {Configuration} settings
 */
function mongoLogger(settings = {}) {
	//CREATE THE SETTINGS WITH USER PROVIDED DATA AND DEFAULTS
	const settingsKeys = Object.keys(settings);
	for (let key in defaultSettings) {
		if (!settingsKeys.includes(key)) {
			settings[key] = defaultSettings[key];
		}
	}

	//FORCE CASE
	settings.exludeRequestTypes = settings.exludeRequestTypes.map((x) =>
		x.toUpperCase()
	);

	return [
		// HANDLE NORMAL REQUESTS
		function (req, res, next) {
			console.log("Start");
			const start = settings.requestTime ? process.hrtime.bigint() : 0;
			next();
			//`res` becomes `this`
			res.on("finish", function () {
				//Create a log item for the status code provided
				CreateLog(start, req, this, settings, settings.normalCollection);
			});
		},
		//HANDLE UNHANDLED PROMISES
		function (req, res, next) {
			process.on("unhandledRejection", function (reason, p) {
				//LOG THE PROMISE REJECTION TO THE CONSOLE
				console.log("Unhandled Rejection:", reason.stack);
				const start = settings.requestTime ? process.hrtime.bigint() : 0;

				//ADD DETAILS TO REASON
				reason.type = "Unhandled Rejection";

				//CREATE THE ERROR LOG
				CreateLog(start, req, res, settings, settings.errorCollection, {
					type: "Unhandled Rejection",
					error: reason,
					stack: reason.stack,
				});

				//IF ENABLED RETURN THE ERROR OR CONTINUE
				if (settings.returnError)
					if (!res.headersSent)
						res
							.status(500)
							.send("An error has occured. Please contact the webmaster");
					else next(reason);
				else next(reason);
			});
			next();
		},
		//HANDLE GENERAL EXCEPTIONS
		function (err, req, res, next) {
			const start = settings.requestTime ? process.hrtime.bigint() : 0;

			//LOG EXCEPTION TO CONSOLE
			console.log("Unhandled Exception", err, res.statusCode);

			//CREATE THE LOG FILE ENTRY FOR THE EXCEPTION
			CreateLog(start, req, res, settings, settings.errorCollection, {
				error: err,
				type: "Unhandled Exception",
			});

			//IF ENABLE RETURN THE ERROR
			if (settings.returnError)
				if (!res.headersSent)
					res
						.status(500)
						.send("An error has occured. Please contact the webmaster");
				else next(reason);
			else next(err);
		},
	];
}
module.exports = mongoLogger;
