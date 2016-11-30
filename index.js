'use strict';

// Messenger API integration for Taskfit

const bodyParser = require('body-parser');
const crypto = require('crypto');
const express = require('express');
const fetch = require('node-fetch');
const request = require('request');

// Webserver parameter
const PORT = process.env.PORT || 8445;

// SERVER VARS
const FB_PAGE_ACCESS_TOKEN = process.env.FB_PAGE_ACCESS_TOKEN;
const FB_APP_SECRET = process.env.FB_APP_SECRET;
const WL_CLIENT_ID = process.env.WL_CLIENT_ID;
const WL_CLIENT_SECRET = process.env.WL_CLIENT_SECRET;
const WL_ACCESS_TOKEN = process.env.WL_ACCESS_TOKEN;



//Wunderlist 
var WunderlistSDK = require('wunderlist');
var wunderlistAPI = new WunderlistSDK({
   accessToken: encodeURIComponent(WL_ACCESS_TOKEN),
   clientID: WL_CLIENT_ID
});

wunderlistAPI.http.lists.all()
  .done(function (lists) {
    /* do stuff */
  })
  .fail(function () {
    console.error('there was a problem');
  });

// ----------------------------------------------------------------------------


// Starting our webserver and putting it all together
const app = express();
app.use(({method, url}, rsp, next) => {
  rsp.on('finish', () => {
    console.log(`${rsp.statusCode} ${method} ${url}`);
  });
  next();
});
app.use(bodyParser.json({ verify: verifyRequestSignature }));

// Index route
app.get('/', function (req, res) {
    res.send('Hi, I am a chat botassistant for Taskfit. Up and running!')
})

// Webhook setup
app.get('/webhook', (req, res) => {
  if (req.query['hub.mode'] === 'subscribe' &&
    req.query['hub.verify_token'] === FB_VERIFY_TOKEN) {
    res.send(req.query['hub.challenge']);
  } else {
    res.sendStatus(400);
  }
});



// to post data
app.post('/webhook/', function (req, res) {
  let messaging_events = req.body.entry[0].messaging
  for (let i = 0; i < messaging_events.length; i++) {
    let event = req.body.entry[0].messaging[i]
    let sender = event.sender.id
    if (event.message && event.message.text) {
      let text = event.message.text
      //if message is ... then ...
      if (text === 'Hello') {
        sendTextMessage(sender, "Hi!");
        sendGenericMessage(sender);
        console.log('Hello message sent');
        continue
      }
      if (text === 'Login') {
        sendGLoginMessage(sender);
        console.log('Login message sent');
        continue
      }
      //else send genericmessage
      sendGenericMessage(sender);
    }
    if (event.postback) {
      let text = JSON.stringify(event.postback)
      sendTextMessage(sender, "Postback received: "+text.substring(0, 200), token)
      continue
    }
  }
  res.sendStatus(200)
})


function sendTextMessage(sender, text) {
  let messageData = { text:text }
  
  request({
    url: 'https://graph.facebook.com/v2.6/me/messages',
    qs: {access_token:FB_PAGE_ACCESS_TOKEN},
    method: 'POST',
    json: {
      recipient: {id:sender},
      message: messageData,
    }
  }, function(error, response, body) {
    if (error) {
      console.log('Error sending messages: ', error)
    } else if (response.body.error) {
      console.log('Error: ', response.body.error)
    }
  })
}


function sendGenericMessage(sender) {
  let messageData = {
    "attachment":{
      "type":"template",
      "payload":{
        "template_type":"button",
        "text":"Please choose from the options:",
        "buttons":[
          {
            "type":"postback",
            "title":"Show tasks",
            "payload":"USER_DEFINED_PAYLOAD"
          },
          {
            "type":"postback",
            "title":"Show lists",
            "payload":"USER_DEFINED_PAYLOAD"
          }
        ]
      }
    }
  }
  request({
    url: 'https://graph.facebook.com/v2.6/me/messages',
    qs: {access_token:FB_PAGE_ACCESS_TOKEN},
    method: 'POST',
    json: {
      recipient: {id:sender},
      message: messageData,
    }
  }, function(error, response, body) {
    if (error) {
      console.log('Error sending messages: ', error)
    } else if (response.body.error) {
      console.log('Error: ', response.body.error)
    }
  })
}

function sendLoginMessage(sender) {
  let messageData = {
    "attachment": {
      "type": "template",
      "payload": {
        "template_type": "generic",
        "elements": [{
          "title": "Welcome Taskfit, please log in to your Wunderlist account.",
          "image_url": "https://d13yacurqjgara.cloudfront.net/users/198461/screenshots/2419865/wunderlist.png",
          "buttons": [{
            "type": "account_link",
            "url": "https://www.wunderlist.com/oauth/authorize?client_id=" + WL_CLIENT_ID + "&redirect_uri=https://infinite-lowlands-16700.herokuapp.com/&state=ADAMEX"
          }]
        }]
      }
    }
  }
  request({
    url: 'https://graph.facebook.com/v2.6/me/messages',
    qs: {access_token:FB_PAGE_ACCESS_TOKEN},
    method: 'POST',
    json: {
      recipient: {id:sender},
      message: messageData,
    }
  }, function(error, response, body) {
    if (error) {
      console.log('Error sending messages: ', error)
    } else if (response.body.error) {
      console.log('Error: ', response.body.error)
    }
  })
}

/*
 * Verify that the callback came from Facebook. Using the App Secret from
 * the App Dashboard, we can verify the signature that is sent with each
 * callback in the x-hub-signature field, located in the header.
 *
 * https://developers.facebook.com/docs/graph-api/webhooks#setup
 *
 */
function verifyRequestSignature(req, res, buf) {
  var signature = req.headers["x-hub-signature"];

  if (!signature) {
    // For testing, let's log an error. In production, you should throw an
    // error.
    console.error("Couldn't validate the signature.");
  } else {
    var elements = signature.split('=');
    var method = elements[0];
    var signatureHash = elements[1];

    var expectedHash = crypto.createHmac('sha1', FB_APP_SECRET)
                        .update(buf)
                        .digest('hex');

    if (signatureHash != expectedHash) {
      throw new Error("Couldn't validate the request signature.");
    }
  }
}

app.listen(PORT);
console.log('Listening on :' + PORT + '...');