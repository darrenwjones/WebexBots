//
// Copyright (c) 2016 Cisco Systems
// Licensed under the MIT License 
//

var SparkBot = require("node-sparkbot");
var bot = new SparkBot();
bot.interpreter.prefix = ""; // Remove comment to overlad default / prefix to identify bot commands

var SparkAPIWrapper = require("node-sparkclient");
if (!process.env.ACCESS_TOKEN) {
    console.log("Could not start as this bot requires a Webex Teams API access token.");
    console.log("Please add env variable ACCESS_TOKEN on the command line");
    console.log("Example: ");
    console.log("> ACCESS_TOKEN=XXXXXXXXXXXX DEBUG=sparkbot* node TheBetterGifBot.js");
    process.exit(1);
}
var client = new SparkAPIWrapper(process.env.ACCESS_TOKEN);
var https = require("https");
var Utils = {};
module.exports = Utils;
var fs = require('fs');

//
// Fallback command
//
bot.onCommand("fallback", function (command) {
    fallbackCommand(command);
});
	
function fallbackCommand(command){

    if (command == null) {
        
	client.createMessage(command.message.roomId, "Are you actually trying to define something?",
		{ "markdown":"true" }, function(err, response) {
	    if (err) {
		console.log("WARNING: Could not post fallback message when the keyword was null." + command.message.roomId);
		return;
	    }
	});
        return;	    
    }

    command.keyword = (command.keyword + " " + command.args.join(" "));
    var message;
    var def;
    var options = {
	'method': 'GET',
	'hostname': 'dictionaryapi.com',
	'path': '/api/v3/references/collegiate/json/' + encodeURI(command.keyword) + '?key='
    };
    var req = https.request(options, function (response) {
	
	var chunks = [];
	response.on('data', function (chunk) {
	    chunks.push(chunk);
	});

	response.on("end", function () {

	    try {	
	        
		message = Buffer.concat(chunks).toString();
	        message = JSON.parse(message);
	        def = message.shortdef;
	    } catch (err) {
	        
		client.createMessage(command.message.roomId, "Are you actually trying to define something?",
		        { "markdown":"true" }, function(err, response) {
	 	    if (err) {
		        console.log("WARNING: Could not post fallback message after finding no definitions." + command.message.roomId);
		        return;
		    }
	        });
	        return;
	    }

	    if (!def.isEmpty() && def != null) {	
	        
		client.createMessage(command.message.roomId, def, { "markdown":"true" }, function(err, response) {
	            if (err) {
		        console.log("WARNING: could not post definition to room." + command.message.roomId);
		        return;
	            }
	        });
	    } else {
		
		client.createMessage(command.message.roomId, "even idk wot that is...",
		        { "markdown":"true" }, function(err, response) {
		    if (err) {
			console.log("WARNING: Could not post fallback message after finding no definitions." + command.message.roomId);
	   		    return;
		    }
		});
	    }
	});
    });

    req.on('error', function(err) {
	
	client.createMessage(command.message.roomId, "Are you actually trying to define something?",
		{ "markdown":"true" }, function(err, response) {
	    if (err) {
		console.log("WARNING: Could not post fallback message after finding no definitions." + command.message.roomId);
		return;
	    }
	});
    });
    req.end();
}

