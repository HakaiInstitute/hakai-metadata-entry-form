import React from "react";
import ReactDOM from "react-dom";
import * as Sentry from "@sentry/react";

import "./index.css";
import App from "./components/App";
import * as serviceWorker from "./serviceWorker";

if (process.env.NODE_ENV === "production")
  Sentry.init({
    dsn:
      "https://8fd4b6885cc447c0b11aa0cb3009b0e3@o56764.ingest.sentry.io/5493983",
    // Without this the SDK labels every build "production", so errors from PR
    // preview channels land in the same bucket as real traffic - which is how an
    // error from cioos-metadata-form-dev--pr39-*.web.app came to be tagged
    // production. firebase-hosting-pull-request.yml is the only workflow that
    // builds the app with REACT_APP_DEV_DEPLOYMENT set; github-pages-deploy.yaml,
    // which builds the real site, does not.
    environment: process.env.REACT_APP_DEV_DEPLOYMENT ? "preview" : "production",
    integrations: [
      Sentry.browserTracingIntegration(),
      Sentry.replayIntegration({
        // Additional SDK configuration goes in here, for example:
        maskAllText: false,
        blockAllMedia: true,
      }),
    ],
    replaysSessionSampleRate: 0,
    replaysOnErrorSampleRate: 1,

    // We recommend adjusting this value in production, or using tracesSampler
    // for finer control
    tracesSampleRate: 1.0,
  });

ReactDOM.render(<App />, document.getElementById("root"));

// If you want your app to work offline and load faster, you can change
// unregister() to register() below. Note this comes with some pitfalls.
// Learn more about service workers: https://bit.ly/CRA-PWA
serviceWorker.unregister();
