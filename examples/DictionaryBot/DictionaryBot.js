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
const randomWord = require('random-word');
const Dictionary = require("oxford-dictionary");
const sqlite3 = require('sqlite3').verbose();
var db;

//
// Fallback command
//
bot.onCommand("fallback", function (command) {
    fallbackCommand(command);
});
	
function fallbackCommand(command){

    if (command == null) {
        error(command, "Are you actually trying to define something?"); 
        return;	    
    }

    var define = false;
    var phrase = (command.keyword + " " + command.args.join(" ")).trim().toLowerCase();	
    if (phrase == 'pick random') {
	phrase = randomWord();
    } else if (command.keyword == 'DEFINE' && command.args.includes('AS')) {

	var define = true;
	phrase = command.args.slice(0, command.args.indexOf('AS')).join(" ").trim().toLowerCase();
	var definition = command.args.slice((command.args.indexOf('AS') + 1), command.args.length).join(" ").trim().toLowerCase();
	var name = command.message.personEmail.substring(0, command.message.personEmail.indexOf('.')).trim().toLowerCase();
    }

    db = new sqlite3.Database('WebexBots/examples/DictionaryBot/DictionaryBot.db', (err) => {
        if (err) {
            console.error(err.message);
        }
    });

    db.get("SELECT * FROM definitions WHERE phrase='" + phrase + "'", [], (err, row) => {
        if (err) {
            console.error(err.message);
            db.close();
            return;
        }
        if (row) {
            message(command, "According to **" + (row.name.charAt(0).toUpperCase() + row.name.slice(1)) + "**, *" + (row.phrase.charAt(0).toUpperCase()
                    + row.phrase.slice(1)) + "* is defined as:  \n  \n* " + row.definition);
        } else {
	    oxford(command, phrase, define, definition, name);
	}
    });
}

function oxford(command, phrase, define, definition, name) {
    	
    var options = {
	app_id : "8749e6b9",
	app_key : "69a7a0ae687d283ad4e125382036b61d",
        source_lang : "en"
    };

    var dict = new Dictionary(options);

    var props = {
        word: encodeURI(phrase),
        // filter: "grammaticalFeatures=singular,past;lexicalCategory=noun",
        // region: "us",
        // target_language: "es"
    };

    var lookup = dict.definitions(props);	
    lookup.then(function(res) {

	var definitions = [];
	let count = 0;    
	for (var i = 0; i < res.results[0].lexicalEntries.length; i++) {
	    for (var j = 0; j < res.results[0].lexicalEntries[i].entries.length; j++) {
		for (var k = 0; k < res.results[0].lexicalEntries[i].entries[j].senses.length; k++) {
		    definitions[count] = res.results[0].lexicalEntries[i].entries[j].senses[k].definitions[0].trim();
		    count++;
		}
	    }
	}
	definitions ? message(command, ("According to the **Oxford** Dictionary, *" + (phrase.charAt(0).toUpperCase() + phrase.slice(1))
		+ "* is defined as:  \n  \n* " + definitions.join("  \n  \n* "))) : webster(command, phrase, define, definition, name);
    },
    function(err) {
        webster(command, phrase, define, definition, name);
    }); 
}

function message(command, message) {
    client.createMessage(command.message.roomId, message, { "markdown":"true" }, function(err, response) {
        if (err) {
            console.log("WARNING: Could not post fallback message after finding no definitions." + command.message.roomId);
            return;
        }
    });
}

function webster(command, phrase, define, definition, name) {

    var msg;
    var def;
    var options = {
	'method': 'GET',
	'hostname': 'dictionaryapi.com',
	'path': '/api/v3/references/collegiate/json/' + encodeURI(phrase) + '?key=0143d4cb-e83b-4c32-88c5-fb7665e9bee7'
    };
    var req = https.request(options, function (response) {
	var chunks = [];
	response.on('data', function (chunk) {
	    chunks.push(chunk);
	});

	response.on("end", function () {
	    try {	
		msg = Buffer.concat(chunks).toString();
	        msg = JSON.parse(msg);

	        var definitions = [];
	        let count = 0;
	        for (var i = 0; i < msg.length; i++) {
		    for (var j = 0; j < msg[i].shortdef.length; j++) {
		        definitions[count] = msg[i].shortdef[j].trim();
		        count++;
		    }
	        }
		    console.log(definitions);
		if (Array.isArray(definitions) && definitions.length) { 
	            message(command, ("According to the **Merriam-Webster** Dictionary, *" + (phrase.charAt(0).toUpperCase() + phrase.slice(1))
			    + "* is defined as:  \n  \n* " + definitions.join("  \n  \n* ")));
		} else {

		    if (define) {
			writeDef(command, phrase, definition, name);
		    } else {
		        message(command, "even idk wot *" + (phrase.charAt(0).toUpperCase() + phrase.slice(1)) + "* is!  \n  \n" +
			        "If you would like to define this, please send me a message in the form 'DEFINE {word/phrase} AS {definition}'");
		    }
		}
	    } catch (err) {
	        if (define) {
                    writeDef(command, phrase, definition, name);
                } else {
                    message(command, "even idk wot *" + (phrase.charAt(0).toUpperCase() + phrase.slice(1)) + "* is!  \n  \n" +
                            "If you would like to define this, please send me a message in the form 'DEFINE {word/phrase} AS {definition}'");
                }
	    }
	});
    });

    req.on('error', function(err) {
        if (define) {
            writeDef(command, phrase, definition, name);
        } else {
            message(command, "even idk wot *" + (phrase.charAt(0).toUpperCase() + phrase.slice(1)) + "* is!  \n  \n" +
                    "If you would like to define this, please send me a message in the form 'DEFINE {word/phrase} AS {definition}'");
        }
    });
    req.end();
}

function writeDef(command, phrase, definition, name) {

    db = new sqlite3.Database('WebexBots/examples/DictionaryBot/DictionaryBot.db', (err) => {
        if (err) {
            console.error(err.message);
        }
    });

    db.run("INSERT OR IGNORE INTO definitions VALUES(?, ?, ?)", [phrase, definition, name], function(err) {
        if (err) {
	    console.error(err.message);
	    db.close();
            return;
	}
    });
    message(command, "The definition for *" + phrase + "* has now been set.");
}
