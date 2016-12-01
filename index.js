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
   accessToken: '4a1744e4f41b05cbb0bd9cf463fbffee32ee22f928c0c41ae9a30395852c',
   clientID: WL_CLIENT_ID
});

wunderlistAPI.http.lists.all()
  .done(function (lists) {
    /* do stuff */
  })
  .fail(function () {
    console.error('there was a problem');
  });



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
    res.send('Hi, I am a chat bot assistant for Taskfit. Up and running!')
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
        createList();
        console.log('Hello message sent');
        continue
      }
      if (text === 'Login') {
        sendLoginMessage(sender);
        console.log('Login message sent');
        continue
      }
      if (text === 'Show tasks') {
        showLists(sender);
        console.log('Showing tasks');
        continue
      }
      //else send genericmessage
      sendGenericMessage(sender);
    }
    //Postback events
    if (event.postback) {
      let text = JSON.stringify(event.postback)
      if (text === '{"payload":"show_tasks"}') {
        showLists(sender);
        console.log('Showing tasks, postback');
        continue
        }
    }
  }
  res.sendStatus(200)
})

function createList() {
  request({
    url: 'https://a.wunderlist.com/api/v1/lists',
    //qs: {access_token:FB_PAGE_ACCESS_TOKEN},
    method: 'POST',
    json: {
    "title": "Halloooo"
    }
  }, function(error, response, body) {
    if (error) {
      console.log('Error sending messages: ', error)
    } else if (response.body.error) {
      console.log('Error: ', response.body.error)
    }
  })
}

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
        "text":"Please choose from the options below:",
        "buttons":[
          {
            "type":"postback",
            "title":"Create new task",
            "payload":"Create new task"
          },
          {
            "type":"postback",
            "title":"Show tasks",
            "payload":"show_tasks"
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
            "url": "https://www.wunderlist.com/oauth/authorize?client_id=" + WL_CLIENT_ID + "&state=ADAMEX"
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

function showLists(sender) {
  let messageData = {
    "attachment": {
        "type": "template",
        "payload": {
            "template_type": "list",
            "top_element_style": "compact",
            "elements": [
                {
                    "title": "Inbox",
                    "image_url": "https://peterssendreceiveapp.ngrok.io/img/white-t-shirt.png",
                    "subtitle": "16 tasks",
                    "default_action": {
                        "type": "web_url",
                        "url": "https://peterssendreceiveapp.ngrok.io/view?item=100",
                        "messenger_extensions": true,
                        "webview_height_ratio": "tall",
                        "fallback_url": "https://peterssendreceiveapp.ngrok.io/"
                    },
                    "buttons": [
                        {
                            "title": "Select",
                            "type": "postback",
                            "payload":"USER_DEFINED_PAYLOAD"               
                        }
                    ]                
                },
                {
                    "title": "Personal",
                    "image_url": "https://peterssendreceiveapp.ngrok.io/img/blue-t-shirt.png",
                    "subtitle": "8 tasks",
                    "default_action": {
                        "type": "web_url",
                        "url": "https://peterssendreceiveapp.ngrok.io/view?item=101",
                        "messenger_extensions": true,
                        "webview_height_ratio": "tall",
                        "fallback_url": "https://peterssendreceiveapp.ngrok.io/"
                    },
                    "buttons": [
                        {
                            "title": "Select",
                            "type": "postback",
                            "payload":"USER_DEFINED_PAYLOAD"                        
                        }
                    ]                
                },
                {
                    "title": "Basewalk",
                    "image_url": "https://peterssendreceiveapp.ngrok.io/img/black-t-shirt.png",
                    "subtitle": "31 tasks",
                    "default_action": {
                        "type": "web_url",
                        "url": "https://peterssendreceiveapp.ngrok.io/view?item=102",
                        "messenger_extensions": true,
                        "webview_height_ratio": "tall",
                        "fallback_url": "https://peterssendreceiveapp.ngrok.io/"
                    },
                    "buttons": [
                        {
                            "title": "Select",
                            "type": "postback",
                            "payload":"USER_DEFINED_PAYLOAD"                      
                        }
                    ]                
                },
                {
                    "title": "Shopping",
                    "image_url": "https://peterssendreceiveapp.ngrok.io/img/gray-t-shirt.png",
                    "subtitle": "1 task",
                    "default_action": {
                        "type": "web_url",
                        "url": "https://peterssendreceiveapp.ngrok.io/view?item=103",
                        "messenger_extensions": true,
                        "webview_height_ratio": "tall",
                        "fallback_url": "https://peterssendreceiveapp.ngrok.io/"
                    },
                    "buttons": [
                        {
                            "title": "Select",
                            "type": "postback",
                            "payload":"USER_DEFINED_PAYLOAD"                      
                        }
                    ]                
                }
            ],
             "buttons": [
                {
                    "title": "View More",
                    "type": "postback",
                    "payload": "payload"                        
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


/*
function WunderlistAuth(sender, text) {
  request({
    url: 'https://www.wunderlist.com/oauth/access_token',
    method: 'POST',
    json: { 
      "code":"<CODE>", 
      "client_id": WL_CLIENT_ID,
      "client_secret": WL_CLIENT_SECRET
    }
  }, function(error, response, body) {
    if (error) {
      console.log('Error authenticating: ', error)
    } else if (response.body.error) {
      console.log('Error: ', response.body.error)
    }
  })
}

function startWunderlistAuthServer(clientId, clientSec, onAuth) {
  var app = express();
  app.get('/webhook', function (req, res) {
    console.log('Incoming wunderlist auth:', req.query);
    var post = {
      url: 'https://www.wunderlist.com/oauth/access_token',
      form: {
        client_id: WL_CLIENT_ID,
        client_secret: WL_CLIENT_SECRET,
        code: req.query.code
      }
    };
    console.log('POSTing to:', post.url, '...');
    request.post(post, function(err, httpResponse, body){
      console.log('=> wunderlist POST response:', body);
      try { body = JSON.parse(body); }
      catch (e) { return e.printStack(); }
      onAuth(body.access_token);
    });
    res.send(HTML_AUTOCLOSE);
  });
  server = app.listen(PORT, function () {
  });
}
*/

const simpleOauthModule = require('simple-oauth2');

const oauth2 = simpleOauthModule.create({
  client: {
    id: WL_CLIENT_ID,
    secret: WL_CLIENT_SECRET,
  },
  auth: {
    tokenHost: 'https://www.wunderlist.com',
    tokenPath: '/oauth/access_token',
    authorizePath: '/oauth/authorize',
  },
});

// Authorization uri definition
const authorizationUri = oauth2.authorizationCode.authorizeURL({
  redirect_uri: 'https://messenger.com/messenger_platform/account_linking/?account_linking_token=ARSX9tGlT3Wj3KQb8VSc4gHHIksdRYte_bhynytNmnogp6VBsbjn3mXgn3bE-hcaUqi_fZeIlXSX6KL8cgkZ7CB6i2dzhtik2UaBfYMbPbf8NA',
  state: 'ADAMEX',
});

// Initial page redirecting to Wunderlist
app.get('/auth', (req, res) => {
  console.log(authorizationUri);
  res.redirect(authorizationUri);
});

// Callback service parsing the authorization token and asking for the access token
app.get('/callback', (req, res) => {
  const code = req.query.code;
  const options = {
    code,
  };

  oauth2.authorizationCode.getToken(options, (error, result) => {
    if (error) {
      console.error('Access Token Error', error.message);
      return res.json('Authentication failed');
    }

    console.log('The resulting token: ', result);
    const token = oauth2.accessToken.create(result);

    return res
      .status(200)
      .json(token);
  });
});

app.get('/success', (req, res) => {
  res.send('');
});

app.get('/', (req, res) => {
  res.send('Hello<br><a href="/auth">Log in with Wunderlist</a>');
});


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