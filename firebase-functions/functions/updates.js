const admin = require("firebase-admin");
const { onCall, HttpsError } = require("firebase-functions/v2/https");
const { onValueCreated, onValueUpdated, onValueDeleted } = require("firebase-functions/v2/database");
const { logger } = require("firebase-functions/v2");
const https = require("https");
const axios = require("axios");

const urlBaseDefault = "https://pac-dev1.cioos.org/cioos-xml/"


function getRecordFilename(record) {
  return `${record.title[record.language].slice(
    0,
    30
  )}_${record.identifier.slice(0, 5)}`
    .trim()
    .toLowerCase()
    .replace(/[^a-zA-Z0-9]/g, "_");
}

// creates xml for a completed record. returns a URL to the generated XML
exports.downloadRecordSecondGen = onCall(
  async ({ record, fileType, region }) => {

    let urlBase = urlBaseDefault;
    try {
      urlBase = (await admin.database().ref('admin').child(region).child("recordGeneratorURL").once("value")).val() ?? urlBaseDefault;
    } catch (error) {
      logger.error(`Error fetching recordGeneratorURL for region ${region}, using the default value:`, error);
    }

    const url = `${urlBase}recordTo${fileType.toUpperCase()}`;
    const response = await axios.post(url, record);
    return response.data;
  }
);

async function updateXML(path, region, status = "", filename = "") {

  let urlBase = urlBaseDefault;
  try {
    urlBase = (await admin.database().ref('admin').child(region).child("recordGeneratorURL").once("value")).val() ?? urlBaseDefault;
  } catch (error) {
    logger.error(`Error fetching recordGeneratorURL for region ${region}, using the default value:`, error);
  }

  const url = `${urlBase}record`;
  const urlParams = new URLSearchParams({
    path,
    status,
    filename,
  }).toString();
  const urlFull = `${url}?${urlParams}`;

  return https.get(urlFull);
}

// when user clicks "Save", if the record is submitted or published, update the XML
exports.regenerateXMLforRecordSecondGen = onCall(
  async (data, context) => {
    if (!context.auth || !context.auth.token)
      throw new HttpsError("unauthenticated");

    const { path, status, region } = data;
    if (["submitted", "published"].includes(status)) updateXML(path, region);
    // No need to create new XML if the record is a draft.
    // If the record is complete, the user can still generate XML for a draft record
  }
);

// if a record with status=submitted/published is created
// this ONLY should happen when a submitted/published record is transferred to another user
// when a new record is created/cloned, it would have status="" so this wouldnt run
exports.updatesRecordCreateSecondGen = onValueCreated(
  "/{region}/users/{userID}/records/{recordID}",
  async (snpashot, context) => {
    const record = snpashot.val();
    const { region, userID, recordID } = context.params;
    const path = `${region}/${userID}/${recordID}`;
    const { status } = record;
    const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
    if (["submitted", "published"].includes(status)) {
      // wait a second so the file has a chance to be deleted on the server before it is created
      // otherwise the server might delete the new files
      await delay(1000);
      return updateXML(path, region);
    }
    return null;
  });

// if the record changes status we should trigger an update
exports.updatesRecordUpdateSecondGen = onValueUpdated(
  "/{region}/users/{userID}/records/{recordID}/status",
  ({ before, after }, context) => {
    const { region, userID, recordID } = context.params;
    const path = `${region}/${userID}/${recordID}`;

    // record deleted event

    const afterStatus = after.val();
    const beforeStatus = before.val();

    // status changed to draft
    if (
      // if this record was or is published or submitted
      [afterStatus, beforeStatus].some(
        (status) => status === "published" || status === "submitted"
      )
    ) {
      return updateXML(path, region, afterStatus);
    }
    logger.log("no change");
    return null;
  });


async function deleteXML(filename, region) {
  let urlBase = urlBaseDefault;
  try {
    urlBase = (await admin.database().ref('admin').child(region).child("recordGeneratorURL").once("value")).val() ?? urlBaseDefault;
  } catch (error) {
    logger.error(`Error fetching recordGeneratorURL for region ${region}, using the default value:`, error);
  }

  const url = `${urlBase}recordDelete`;
  const urlParams = new URLSearchParams({
    filename,
  }).toString();
  const urlFull = `${url}?${urlParams}`;

  return https.get(urlFull);
}

// also trigger update when record is deleted
exports.updatesRecordDeleteSecondGen = onValueDeleted(
  "/{region}/users/{userID}/records/{recordID}",
  (snpashot, context) => {
    const record = snpashot.val();
    const filename = getRecordFilename(record);
    const { region } = context.params;
    
    return deleteXML(filename, region);
  });
