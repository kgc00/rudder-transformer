const fetch = require("node-fetch");
const NodeCache = require("node-cache");
const _ = require("lodash");
const logger = require("../logger");
const stats = require("./stats");

const myCache = new NodeCache({ stdTTL: 5 * 60, checkperiod: 120 });
const CONFIG_BACKEND_URL =
  process.env.CONFIG_BACKEND_URL || "https://api.rudderlabs.com";
const getTransformationURL = `${CONFIG_BACKEND_URL}/transformation/getByVersionId`;

const myLibrariesCache = new NodeCache({
  stdTTL: 12 * 60 * 60,
  checkperiod: 12 * 60 * 60
});
const getLibrariesUrl = `${CONFIG_BACKEND_URL}/transformationLibrary/getByVersionId`;

// Gets the transformation from config backend.
// Stores the transformation object in memory with time to live after which it expires.
// VersionId is updated any time user changes the code in transformation, so there wont be any stale code issues.
async function getTransformationCode(versionId) {
  const transformation = myCache.get(versionId);
  if (transformation) return transformation;
  try {
    const startTime = new Date();
    const response = await fetch(
      `${getTransformationURL}?versionId=${versionId}`
    );
    stats.increment("get_transformation_code.success");
    stats.timing("get_transformation_code", startTime);
    const myJson = await response.json();
    myCache.set(versionId, myJson, 5 * 60);
    return myJson;
  } catch (error) {
    logger.error(error);
    stats.increment("get_transformation_code.error");
    throw error;
  }
}

async function getLibraryCode(versionId) {
  const library = myLibrariesCache.get(versionId);
  if (library) return library;
  try {
    const startTime = new Date();
    const response = await fetch(`${getLibrariesUrl}?versionId=${versionId}`);
    stats.increment("get_libraries_code.success");
    stats.timing("get_libraries_code", startTime);
    const myJson = await response.json();
    myLibrariesCache.set(versionId, myJson, 5 * 60);
    return myJson;
  } catch (error) {
    logger.error(error);
    stats.increment("get_libraries_code.error");
    throw error;
  }
}

module.exports = { getTransformationCode, getLibraryCode };
