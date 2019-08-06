const fs = require('fs');
const readline = require('readline');
const { google } = require('googleapis');

// If modifying these scopes, delete token.json.
const SCOPES = ['https://www.googleapis.com/auth/gmail.readonly'];
// The file token.json stores the user's access and refresh tokens, and is
// created automatically when the authorization flow completes for the first
// time.
const TOKEN_PATH = 'token.json';

/**
 * Create an OAuth2 client with the given credentials, and then execute the
 * given callback function.
 * @param {Object} credentials The authorization client credentials.
 * @param {function} callback The callback to call with the authorized client.
 */
function authorize() {
  return new Promise((resolve, reject) => {
    fs.readFile('credentials.json', (err, content) => {
      if (err) {
        console.log('Error loading client secret file:', err);
        reject(err);
      }
      const credentials = JSON.parse(content);

      const { client_secret, client_id, redirect_uris } = credentials.installed;
      const oAuth2Client = new google.auth.OAuth2(
        client_id,
        client_secret,
        redirect_uris[0],
      );

      // Check if we have previously stored a token.
      fs.readFile(TOKEN_PATH, (err, token) => {
        if (err) {
          getNewToken(oAuth2Client)
            .then(resolve)
            .catch(reject);
        }
        oAuth2Client.setCredentials(JSON.parse(token));
        resolve(oAuth2Client);
      });
    });
  });
}

/**
 * Get and store new token after prompting for user authorization, and then
 * execute the given callback with the authorized OAuth2 client.
 * @param {google.auth.OAuth2} oAuth2Client The OAuth2 client to get token for.
 * @param {getEventsCallback} callback The callback for the authorized client.
 */
function getNewToken(oAuth2Client) {
  return new Promise((resolve, reject) => {
    const authUrl = oAuth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: SCOPES,
    });
    console.log('Authorize this app by visiting this url:', authUrl);
    // const rl = readline.createInterface({
    //   input: process.stdin,
    //   output: process.stdout,
    // });
    //rl.question('Enter the code from that page here: ', (code) => {
    const code = '4/hAEPPPeHYnodw8lNsCFYjZkFAE1-owGGmhGrLIU_TWT0a71VLYrHA8o';
    //rl.close();
    oAuth2Client.getToken(code, (err, token) => {
      if (err) {
        console.log('Error retrieving access token', err);
        reject(err);
      }
      oAuth2Client.setCredentials(token);
      // Store the token to disk for later program executions
      fs.writeFile(TOKEN_PATH, JSON.stringify(token), (err) => {
        if (err) {
          console.log(err);
          reject(err);
        }
        console.log('Token stored to', TOKEN_PATH);
      });
      resolve(oAuth2Client);
    });
    //});
  });
}

/**
 * Lists the labels in the user's account.
 *
 * @param {google.auth.OAuth2} auth An authorized OAuth2 client.
 */
function listLabels(auth) {
  return new Promise((resolve, reject) => {
    const gmail = google.gmail({ version: 'v1', auth });
    gmail.users.labels.list(
      {
        userId: 'me',
      },
      (err, res) => {
        if (err) reject(err);
        const labels = res.data.labels;
        resolve(labels);
      },
    );
  });
}

/**
 * Lists the messages in the user's account.
 *
 * @param {google.auth.OAuth2} auth An authorized OAuth2 client.
 */
function listMessages(auth) {
  return new Promise((resolve, reject) => {
    const gmail = google.gmail({ version: 'v1', auth });
    gmail.users.messages.list(
      {
        userId: 'me',
        maxResults: 10,
      },
      (err, res) => {
        if (err) reject(err);
        const messages = res.data.messages;
        resolve(messages);
      },
    );
  });
}

/**
 * Lists the threads in the user's account.
 *
 * @param {google.auth.OAuth2} auth An authorized OAuth2 client.
 */
function listThreads(auth) {
  return new Promise((resolve, reject) => {
    const gmail = google.gmail({ version: 'v1', auth });
    gmail.users.threads.list(
      {
        userId: 'me',
        maxResults: 10,
      },
      (err, res) => {
        if (err) reject(err);
        const threads = res.data.threads;
        resolve(threads);
      },
    );
  });
}

const express = require('express');
const app = express();
const port = 8080;

app.get('/labels', async (req, res) => {
  const auth = await authorize();
  const result = await listLabels(auth);
  res.json(result);
});
app.get('/messages', async (req, res) => {
  const auth = await authorize();
  const result = await listMessages(auth);
  res.json(result);
});
app.get('/threads', async (req, res) => {
  const auth = await authorize();
  const result = await listThreads(auth);
  res.json(result);
});

app.listen(port, () => console.log(`Example app listening on port ${port}!`));
