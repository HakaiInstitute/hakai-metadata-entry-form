const { Octokit, RequestError } = require("octokit");
const fs = require("fs");
const { defineString } = require('firebase-functions/params');
const { logger } = require("firebase-functions/v2");


const githubAuth = defineString('GITHUB_AUTH') || defineString('ISSUE_CREATOR_PAT');
const githubAuthCred = process.env.GITHUB_AUTH || process.env.ISSUE_CREATOR_PAT || githubAuth.value()

function readIssueText(filename) {
  try {
    return fs.readFileSync(filename, "utf8");
  } catch (err) {
    logger.log(err);
    return false;
  }
}

// Create an issue in the github repo when a metadta form record is submited for review
async function createIssueSecondGen(title, url) {
  const octokit = new Octokit({
    auth: githubAuthCred,
  });
  const issueText = readIssueText("dataset-name.md");
  const input = {
    owner: "HakaiInstitute",
    repo: "metadata-review",
    title: `Dataset - ${title}`,
    body: `## ${title}\n\n<${url}>\n\n${issueText}`,
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
module.exports = createIssueSecondGen;
