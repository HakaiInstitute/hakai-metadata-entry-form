import { getFunctions, httpsCallable } from "firebase/functions";
import recordToDataCite from "./recordToDataCite";

async function performUpdateDraftDoi(record, region, language, datacitePrefix) {
  const functions = getFunctions();
  const updateDraftDoi = httpsCallable(functions, "updateDraftDoi");

  const mappedDataCiteObject = recordToDataCite(record, language, region, datacitePrefix);
  delete mappedDataCiteObject.data.type;
  delete mappedDataCiteObject.data.attributes.prefix;

  // Extract DOI from the full URL
  const doi = record.datasetIdentifier.replace('https://doi.org/', '');

  const dataObject = {
    doi, 
    region,
    data: mappedDataCiteObject,
  }

  const response = await updateDraftDoi(dataObject);
  if (response.data.status !== 200) {
    console.error("DOI update failed with status", response.data.status, response.data);
  }
  return response.data.status;
}

export default performUpdateDraftDoi;
