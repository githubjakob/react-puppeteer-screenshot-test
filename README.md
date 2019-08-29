# React screenshot comparison tests with Puppeteer in Bitbucket pipeline

This project shows how to set up screenshot comparison tests with a 
headless browser in a bitbucket pipeline for a react application.

The react application under test uses a rest backend (which is mocked in the pipeline). 

Screenshots are taken using Puppeteer and a headless Chrome browser. 
The screenshots are compared with baseline images using Pixelmatch and a simple helper function. 
If the actual screenshot matches the baseline image, the test succeeds, otherwise it fails.

This `README` provides some notes on the general setup and how to run the tests.

## Quick Start

The project contains configuration for the tests to run in a bitbucket pipeline. 
The easiest way to run the tests, is to run the bitbucket pipeline locally using `bbrun`.

```
npm install -g bbrun
docker build -t node-11-browser .
bbrun --template bitbucket-pipelines.yml
```

The run the tests without the bitbucket pipelein, ie. without `bbrun`, you can execute each node command separately:

```
npm start
npm run mock
npm run browsertests:mobile
npm run browsertests:desktop
```

### Tipps

In case a screenshot is not matching, you can create a diff that shows the non-matching areas.  
To enable creating a diff set `writeDiff` to true in `BrowserTestUtils.js`. This works with and without using bbrun
and is disabled by default.

You can adjust the threshold of how many non-matching pixels result in a failing test. You can also adjust
the threshold used by Pixelmatch to determine when a single pixel is counted as failed. 
See the constants in `BrowserTestUtils.js` for both thresholds.

For debugging, you can set `headless` to false in `BrowserTestUtils.js` to have Puppeteer start up a Chrome browser (with GUI)
for the tests.

## Test Setup

The project contains a basic setup for a screenshot comparison test for a react application. Screenshots are 
taken with Puppeteer and compared with the expected baseline image using Pixelmatch. The backend for 
the react application is mocked with server-json.

### Take screenshots with Puppeteer

[Puppeteer](https://github.com/GoogleChrome/puppeteer) provides the API to control a headless Chrome browser. 
With puppeteer we can open pages, navigate, click on links and take the screenshots. `App.test.jsx` contains
a simple testcase using Jest and Puppeteer that open up the homepage and take a screenshot.

### Compare screenshots with Pixelmatch

Once the screenshot is taken by Puppeteer, we use [Pixelmatch](https://github.com/mapbox/pixelmatch) 
to compare the screenshot with the baseline image. `BrowserTestUtils.js` contains the helper functions to perform the
screenshot comparison.

An alternative to having a customer helper function is using a library like 
[puppeteer-screenshot-tester](https://www.npmjs.com/package/puppeteer-screenshot-tester)

### Mobile and Desktop

Width and height of the browser viewport are set via env variables. This allows
for reusing the same test cases for testing different resolutions. See `package.json` how the two 
node scripts `npm run browsertests:desktop` and `npm run browsertests:mobile` run the same 
test but with different env variables `width` and `height` set. See also the folder `src/browsertests/screenshots`
how this changes the filename for the baseline images.

### Mocking the backend

Our test react app assumes a backend to retrieve data with rest calls. For the browsertests we need to
mock the backend. For this we use [server-json](https://github.com/typicode/json-server). 
The json payload for the rest calls is stored in `backend-mock/db.json`, `backend-mock/routes.json`
allows to map urls to database entries in `backend-mock/db.json`.

## Bitbucket Setup

This project includes a `bitbucket-pipelines.yml` that contains the configuration to run the browsertest in a bitbucket pipeline.

### Send react and mock process to background

An ampersand ('&') is added to the commands so that the process is sent to the background and 
the commands are run in parallel.

Even though the `npm start` process is now in the background the pipeline will finish 
after the test has finished, i.e. the non-completing react process in the background does not block the whole pipeline: 
If the test succeeds  (fails), the whole pipeline step also succeeds (fails).

### Start react without opening browser window

By default `npm start` opens a browser window. This will make the pipeline crash. 
Therefore, to prevent this, we start react with `BROWSER=none npm start`.

### Docker build image

To run the puppeteer tests inside a bitbucket pipleine, 
we need to install the dependencies for Chrome/Puppeteer in the bitbucket build image.

```
apt update && apt install -y gconf-service libasound2 libatk1.0-0 libc6 libcairo2 libcups2 \
 libdbus-1-3 libexpat1 libfontconfig1 libgcc1 libgconf-2-4 libgdk-pixbuf2.0-0 libglib2.0-0 \
 libgtk-3-0 libnspr4 libpango-1.0-0 libpangocairo-1.0-0 libstdc++6 libx11-6 libx11-xcb1 \
 libxcb1 libxcomposite1 libxcursor1 libxdamage1 libxext6 libxfixes3 libxi6 libxrandr2 \
 libxrender1 libxss1 libxtst6 ca-certificates fonts-liberation libappindicator1 libnss3 lsb-release xdg-utils wget

```

We can do this either directly in the pipeline or create a docker image that we can reuse. The project contains 
a `Dockfile` that we can build and that is used in `bitbucket-pipelines.yml`:

```
docker build -t node-11-browser .
```

It is also possible to use an image provided by CircleCI, e.g. `circleci/node:jessie-browsers`
