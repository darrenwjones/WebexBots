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

    var phrase = (command.keyword + " " + command.args.join(" ")).trim().toLowerCase();	
    if (phrase == 'pick random') {
	phrase = randomWord();
    } else if (command.keyword == 'DEFINE' && command.args.includes('AS') && command.args.length >= 3) {
	var word = command.args.slice(0, command.args.indexOf('AS')).join(" ").trim().toLowerCase();
	var definition = command.args.slice((command.args.indexOf('AS') + 1), command.args.length).join(" ").trim().toLowerCase();
	var name = command.message.personEmail.substring(0, command.message.personEmail.indexOf('.')).trim().toLowerCase();
	writeDef(command, word, definition, name);
    } else if (command.keyword == 'CHANGE' && command.args.includes('DEFINITION') && command.args.includes('TO') && command.args.length >= 5) {
	var word = command.args.slice(0, command.args.indexOf('DEFINITION')).join(" ").trim().toLowerCase();
	var definition = command.args.slice((command.args.indexOf('TO') + 1), command.args.length).join(" ").trim().toLowerCase();
	var index = command.args[(command.args.indexOf('DEFINITION') + 1)];
	var name = command.message.personEmail.substring(0, command.message.personEmail.indexOf('.')).trim().toLowerCase();
	changeDef(command, word, index, definition, name);
    } else if (phrase == 'help') {
	message(command, "Here is how to use me ;)  \n  \n" +
			"* '{word/phrase}' - The database, Oxford, and Webster will all attempt to define the {word/phrase}.  \n" +
			"* 'Pick random' - A random word will be chosen to be defined as above.  \n" +
			"* 'DEFINE {word/phrase} AS {definition}' - A custom {definition} will be set, under your name, for that {word/phrase}.  \n" +
			"* 'CHANGE {word/phrase} DEFINITION {index} TO {definition}' - Changes your {index}th definition of {word/phrase} to {definition}.  \n"
	);
	return;
    }
    oxford(command, phrase);
    webster(command, phrase);
    database(command, phrase);
}
function database(command, phrase) {

    db = new sqlite3.Database('/home/darrenwjones06/WebexBots/examples/DictionaryBot/DictionaryBot.db', (err) => {
        if (err) {
            console.error(err.message);
        }
    });

    // Change to all
    db.all("SELECT * FROM definitions WHERE phrase='" + phrase + "'", [], (err, rows) => {
        if (err) {
            console.error(err.message);
            db.close();
            return; 
        }
	
        rows.forEach((row) => {
      	    var definitions = row.definition.split('|');
	    var results = definitions.length;
	    results > 5 ? results = 5 : results = definitions.length;
            message(command, "According to **" + (row.name.charAt(0).toUpperCase() + row.name.slice(1)) + "**, *" + (row.phrase.charAt(0).toUpperCase()
                    + row.phrase.slice(1)) + "* is defined as:  \n  \n* " + definitions.slice(0, results).join("  \n  \n* "));
        });
    });
}

function oxford(command, phrase) {
    	
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
	
	if (definitions) {
	    var results = definitions.length;
	    results > 5 ? results = 5 : results = definitions.length;
	    message(command, ("According to the **Oxford** Dictionary, *" + (phrase.charAt(0).toUpperCase() + phrase.slice(1))
		    + "* is defined as:  \n  \n* " + definitions.slice(0, results).join("  \n  \n* ")));
        }
    },
    function(err) {
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

function webster(command, phrase) {

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
	
		if (Array.isArray(definitions) && definitions.length) {
                    var results = definitions.length;
                    results > 5 ? results = 5 : results = definitions.length; 
	            message(command, ("According to the **Merriam-Webster** Dictionary, *" + (phrase.charAt(0).toUpperCase() + phrase.slice(1))
			    + "* is defined as:  \n  \n* " + definitions.slice(0, results).join("  \n  \n* ")));
		}
	    } catch (err) {
	    }
	});
    });

    req.on('error', function(err) {
        message(command, "it looks like I ran into an error! " + err);
    });
    req.end();
}

function writeDef(command, phrase, definition, name) {

    db = new sqlite3.Database('WebexBots/examples/DictionaryBot/DictionaryBot.db', (err) => {
        if (err) {
            console.error(err.message);
        }
    });

    db.run("INSERT INTO definitions VALUES(?, ?, ?) ON CONFLICT(phrase,name) DO UPDATE SET definition = definition || ?", [phrase, definition, name, ("|" + definition)], function(err) {
        if (err) {
	    console.error(err.message);
	    db.close();
            return;
	} else {
	    message(command, "The definition for *" + (phrase.charAt(0).toUpperCase() + phrase.slice(1)) + "* has now been set.");
	}
    });
}

function changeDef(command, phrase, index, definition, name) {

    db = new sqlite3.Database('WebexBots/examples/DictionaryBot/DictionaryBot.db', (err) => {
        if (err) {
            console.error(err.message);
        }
    });

    db.get("SELECT * FROM definitions WHERE phrase=? AND name=?", [phrase, name], (err, row) => {
        if (err) {
            console.error(err.message);
            db.close();
            return;
        }
	if (row) {
	    var definitions = row.definition.split('|');
	    if (index > definitions.length) {
		message(command, "invalid index!");
		return;
	    }
	    definitions[index-1] = definition;
	    var newDef = definitions.join('|');
            db.run("UPDATE definitions SET definition = ? WHERE phrase = ? AND name = ?", [newDef, phrase, name],
		     function(err) {
        	if (err) {
            	    console.error(err.message);
            	    db.close();
            	    return;
        	} else {
		    message(command, "Definition " + index + " for *" + (phrase.charAt(0).toUpperCase() + phrase.slice(1)) + "* has now been changed.");
		}
    	    });
        }
    });
}
