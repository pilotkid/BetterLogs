const CleanRequest = require("./CleanRequest");
var mongoose = require("mongoose");
var ObjectID = require("mongodb").ObjectID;

/**
 * Removes circular dependencies from an object
 * @param {Object} obj
 * @returns non-circular dependencies object
 */
function createNonCircularObject(obj) {
	let cache = []; //Cache properties

	let str = JSON.stringify(obj, (key, value) => {
		if (typeof value === "object" && value !== null) {
			// Duplicate reference found, discard key
			if (cache.includes(value)) return;

			// Store value in our collection
			cache.push(value);
		}
		return value;
	});

	//Create object and return
	return JSON.parse(str);
}

/**
 * Creates a log entry in MongoDB for the express request, and response
 * @param {BigInt} start Start time of the request
 * @param {Object} req Express request object
 * @param {Object} res Express response object
 * @param {Object} settings Settings as defined in index.js
 * @param {String} collection Name of the collection to use
 * @param {Object} appendObject (optional) Extra details to include in the root of the document
 * @returns
 */
function CreateLog(start, req, res, settings, collection, appendObject = {}) {
	//Create time log
	const timeDivide = settings.requestTime_nanoSeconds ? 1 : 10n ** 6n;
	const end = settings.requestTime ? process.hrtime.bigint() : 0n;
	const elapsed = settings.requestTime ? (start - end) / timeDivide : 0n; //Convert nanoseconds to miliseconds
	const timeframe = settings.requestTime_nanoSeconds ? "ns" : "ms";

	//Check if the statuscode is below the min requirement, if it is stop execution
	if (settings.minStatusCode > this.statusCode) return;

	//Check if request method is meant to be skipped
	if (settings.exludeRequestTypes.includes(req.method)) return;

	let log_object = {};

	//Strip all excluded parameters
	let r = CleanRequest(req, {
		excludeHeadersParams: settings.excludeHeadersParams,
		excludeBodyParams: settings.excludeBodyParams,
		excludeRouteParams: settings.excludeRouteParams,
		excludeQueryParams: settings.excludeQueryParams,
	});

	//Move Request top level
	let topLevelReqs = [
		"path",
		"method",
		"query",
		"protocol",
		"originalUrl",
		"headers",
		...settings.extraTopLevelPropsRequest,
	];

	//Move request properties to the root of the document
	for (let index = 0; index < topLevelReqs.length; index++) {
		const element = topLevelReqs[index];
		log_object[element] = req[element];
	}

	//Move Response top level
	let topLevelRes = [
		"statusCode",
		"body",
		"headersSent",
		...settings.extraTopLevelPropsResponse,
	];

	//Move response properties to the root of the document
	for (let index = 0; index < topLevelRes.length; index++) {
		const element = topLevelRes[index];
		log_object[element] = res[element];
	}

	//If request time is enabled add it to the document
	if (settings.requestTime)
		log_object.requestElapsedTime = `${elapsed} ${timeframe}`;

	//Add appendobject
	for (let key in appendObject) {
		log_object[key] = appendObject[key];
	}

	//Create object ID (I feel that this should be handled by mongodb automagically)
	log_object["_id"] = new ObjectID();
	log_object["CreatedOn"] = new Date();

	//Include the full request if enabled
	if (settings.includeFullRequest)
		log_object.request = createNonCircularObject(r);

	//Include the full response if enabled
	if (settings.includeFullResponse)
		log_object.response = createNonCircularObject(res);

	//Connect to database and save document
	mongoose.connect(settings.mongoConnectionString, {
		useNewUrlParser: true,
		useUnifiedTopology: true,
	});
	let db = mongoose.connection;
	db.collection(collection)
		.insertOne(log_object)
		.then(() => {})
		.catch((err) => {
			console.log("ERROR SAVING LOG", err);
		})
		.finally(() => {
			mongoose.disconnect();
		});

	//Log the request method details
	console.log(`[${req.method}] ${req.path} ${req.statusCode} ${elapsed} `);
}

module.exports = CreateLog;
