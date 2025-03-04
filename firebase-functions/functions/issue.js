const { Octokit, RequestError } = require("octokit");
const fs = require("fs");
const { defineString } = require('firebase-functions/params');
const { logger } = require("firebase-functions/v2");


const githubAuth = defineString('GITHUB_AUTH') || defineString('ISSUE_CREATOR_PAT');
const githubAuthCred = process.env.GITHUB_AUTH || process.env.ISSUE_CREATOR_PAT || githubAuth.value()

function readTextFromFile(filename) {
  try {
    return fs.readFileSync(filename, "utf8");
  } catch (err) {
    logger.log(err);
    return false;
  }
}

// Create an issue in the github repo when a metadata form record is submitted for review
// this function is called from other firebase functions so is not an http request, just a regular function
async function createIssue(title, url) {
  if (!title || !url) {
    throw new Error("Title or URL not provided");
  }
  
  const octokit = new Octokit({
    auth: githubAuthCred,
  });
  const members = readTextFromFile("github_issue_assignees.csv").split(",");
  const issueText = readTextFromFile("dataset-name.md");
  const input = {
    owner: "HakaiInstitute",
    repo: "metadata-review",
    title: `Dataset - ${title}`,
    body: `## ${title}\n\n<${url}>\n\n${issueText}`,
    assignees: members,
  };

  try {
    await octokit.request("POST /repos/{owner}/{repo}/issues", input);
  } catch (error) {
    // Octokit errors are instances of RequestError, so they always have an `error.status` property containing the HTTP response code.
    if (error instanceof RequestError) {
      // eslint-disable-next-line no-console
      logger.log(error);
      // handle Octokit error
      // error.message; // Oops
      // error.status; // 500
      // error.request; // { method, url, headers, body }
      // error.response; // { url, status, headers, data }
    } else {
      // handle all other errors
      throw error;
    }
  }
}
module.exports = createIssue;
