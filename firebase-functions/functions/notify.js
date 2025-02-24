const { onValueUpdated } = require("firebase-functions/v2/database");
const { logger } = require("firebase-functions/v2");
const admin = require("firebase-admin");
const { defineString } = require('firebase-functions/params');
const nodemailer = require("nodemailer");
const { mailOptionsReviewer, mailOptionsAuthor } = require("./mailoutText");
const createIssue = require("./issue");

/**
 * Here we're using Gmail to send
 */
const gmailUser = defineString('GMAIL_USER');
const gmailPass = defineString('GMAIL_PASS');

const gmailUserCred = process.env.GMAIL_USER || gmailUser.value()
const gmailPassCred = process.env.GMAIL_PASS || gmailPass.value()

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: { user: gmailUserCred, pass: gmailPassCred },
});
/*
Email the reviewers for the region when a form is submitted for review
*/
exports.notifyReviewerSecondGen = onValueUpdated(
  "/{region}/users/{userID}/records/{recordID}/status",
  async ({ after, before }, context) => {
    const db = admin.database();
    const { region, userID, recordID } = context.params;
    // Don't notify if going from published to submitted
    if (after.val() === "submitted" && !before.val()) {
      const reviewersFirebase = await db
        .ref(`/admin/${region}/permissions/reviewers`)
        .once("value");

      const reviewers = reviewersFirebase.val().split(",");

      const authorUserInfoFB = await db
        .ref(`/${region}/users/${userID}/userinfo`)
        .once("value");
      const authorUserInfo = authorUserInfoFB.toJSON();

      const authorEmail = authorUserInfo.email;

      const recordFB = await db
        .ref(`/${region}/users/${userID}/records/${recordID}`)
        .once("value");

      const record = recordFB.toJSON();
      const { language } = record;
      const title = record.title[language];

      if (!title) {
        logger.log(`No title found for record ${recordID}`);
        return;
      }
      logger.log("region", region);

      if (region === "hakai" && !title.includes("JUST TESTING")) {
        logger.log("Creating github issue");
        await createIssue(
          title,
          // `https://cioos-siooc.github.io/metadata-entry-form/#/${language}/${region}/${userID}/${recordID}`
          // hard coding the front end url as it was done this way before and I can't think of a good way of 
          // making this dynamic. Firebase know where the request came from as this is trigered on update of a record.
          `https://hakaiinstitute.github.io/hakai-metadata-entry-form/#/${language}/${region}/${userID}/${recordID}`, 
        );
      }
      // getting dest email by query string

      // returning result
      if (reviewers.includes(authorEmail)) {
        logger.log("Author is a reviewer, don't notifiy other reviewers");
        return;
      }
      if (!reviewers.length) {
        logger.log(`No reviewers found to notify for region ${region}`);
        return;
      }
      logger.log("Emailing ", reviewers);
      transporter.sendMail(
        mailOptionsReviewer(reviewers, title, region),
        (e, info) => {
          logger.log(info);
          if (e) {
            logger.log(e);
          }
        }
      );
    }
  });
/*
Email the user when a record is published
*/
exports.notifyUserSecondGen = onValueUpdated(
  "/{region}/users/{userID}/records/{recordID}/status",
  async ({ after }, context) => {
    const db = admin.database();
    // The userID of the author
    // We don't know the user ID of the publisher
    const { region, userID, recordID } = context.params;
    if (after.val() === "published") {
      const reviewersFirebase = await db
        .ref(`/admin/${region}/permissions/reviewers`)
        .once("value");

      const reviewers = reviewersFirebase.val().split(",");

      if (!reviewers.length) {
        logger.log("No reviewers for region", region);
        return;
      }
      const recordFB = await db
        .ref(`/${region}/users/${userID}/records/${recordID}`)
        .once("value");

      const authorUserInfoFB = await db
        .ref(`/${region}/users/${userID}/userinfo`)
        .once("value");
      const authorUserInfo = authorUserInfoFB.toJSON();

      const authorEmail = authorUserInfo.email;

      if (reviewers.includes(authorEmail)) {
        logger.log("Author is a reviewer, don't notifiy author");
        return;
      }

      logger.log("Emailing ", authorEmail);

      const record = recordFB.toJSON();
      const { language } = record;
      const title = record.title[language];

      if (!title) {
        logger.log(`No title found for record ${recordID}`);
        return;
      }
      // getting dest email by query string

      // returning result

      transporter.sendMail(
        mailOptionsAuthor(authorEmail, title, region),
        (e, info) => {
          logger.log(info);
          if (e) {
            logger.log(e);
          }
        }
      );
    }
  });
