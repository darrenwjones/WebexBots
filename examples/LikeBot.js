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
    console.log("> ACCESS_TOKEN=XXXXXXXXXXXX DEBUG=sparkbot* node LikeBot.js");
    process.exit(1);
}
var client = new SparkAPIWrapper(process.env.ACCESS_TOKEN);
var https = require("https");
var Utils = {};
module.exports = Utils;
var fs = require('fs');
const sqlite3 = require('sqlite3').verbose();
var db;

//
// Fallback command
//
bot.onCommand("fallback", function (word) {
    
    let command = word;	
    db = new sqlite3.Database('LikeBot.db', (err) => {
        if (err) {
            console.error(err.message);
        }
    });

    let sql = 'INSERT INTO things(name, likes, fightTime, human, wagerName, wagerLikes) VALUES(?, ?, ?, 1, 0, 0) ON CONFLICT(name) DO UPDATE SET human=1';

    let currName = command.message.personEmail.substring(0, command.message.personEmail.indexOf('.')).toLowerCase();
    if (currName == 'benjamin') {
        currName = 'ben';
    } else if (currName == 'zachary') {
        currName = 'zach';
    }

    db.run(sql, [currName, 0, 0], function(err) {
        if (err) {
            console.error(err.message);
            return;
        }
    });

    fallbackCommand(command, currName);
    //db.close();
});
	
function fallbackCommand(command, currName){

    let keyword = command.keyword.toLowerCase().trim();
    let args = command.args.join(" ").toLowerCase().trim();    
    command.keyword = (command.keyword + " " + args).toLowerCase().trim();
    
    let msg;
    let cmd;
    let thing;

    if (command.args.length == 0) {
	cmd = null;
    } else {
        cmd = command.args[command.args.length - 1].toLowerCase().trim();
    }

    if (command.keyword == 'no u') {
	message(command, "invest your likes into crypto boiiii, it's free real-estate.");
    } else if (command.keyword == 'rip') {
	message(command, "for frodo");
    } else if (cmd == 'likes') {

	thing = command.keyword.substring(0, (command.keyword.length - (cmd.length + 1)));
	thing == currName ? who = "u" : who = "they";
	db.get("SELECT * FROM things WHERE name=?", [thing], (err, row) => {

	    if (err) {
		console.error(err.message);
		return;
	    }
	
	    return row ? message(command, who + " haz " + row.likes + " like(s).") : message(command, "Who dat?");
	});

    } else if (cmd == 'like' || cmd == 'dislike' || cmd == 'love' || cmd == 'hate') {

	var likes; 
        if (cmd == 'like' || cmd == 'dislike') {
	    likes = (cmd == 'like' ? 1 : -1);
        } else {
	    likes = (cmd == 'love' ? 2 : -2);
        }
	thing = command.keyword.substring(0, (command.keyword.length - (cmd.length + 1)));
		
        if (currName == thing) {
	    message(command, "You cannot " + cmd + " yourself, silly willy!");
	    return;
        }

	run("INSERT INTO things(name, likes, fightTime, human, wagerName, wagerLikes) VALUES('" + thing + "', " + likes + ", 0, 0, 0, 0) ON CONFLICT(name) DO UPDATE SET likes=(likes + " + likes + ")");

	db.get("SELECT * FROM things WHERE name=?", [thing], (err, row) => {
            
            if (err) {
                console.error(err.message);
                return;
            }
	    msg = (currName.charAt(0).toUpperCase() + currName.slice(1)) + " " + cmd + "d '" + (thing.charAt(0).toUpperCase() + thing.slice(1)) + "' and added " + likes + " likes. '"
                    + (thing.charAt(0).toUpperCase() + thing.slice(1)) + "' now has " + row.likes + " like(s).";
            return row ? message(command, msg) : message(command, "wot happened?");
        });

    } else if ((keyword == 'scoreboard' || 'anti-scoreboard') && command.args.length == 0) {

	let display;    
	keyword == 'scoreboard' ? display = 'DESC' : display = 'ASC'; 
        db.all("SELECT * FROM things ORDER BY likes " + display + " LIMIT 10", [], (err, rows) => {
            
            if (err) {
                console.error(err.message);
                return;
            }

	    var top10 = [];
    	    var i = 0;
    	    rows.forEach((row) => {
                top10[i] = ((row.name.charAt(0).toUpperCase() + row.name.slice(1)) + ": " + row.likes);
                i = (i + 1);
            });
            msg = top10.join("  \n");
	    message(command, msg); 

        });

    } else if (cmd == 'executeorder66' && command.args.length == 1) {

        thing = command.keyword.substring(0, (command.keyword.length - (cmd.length + 1)));
        if (thing == 'ben' || thing == 'darren' || thing == 'dylan') {
            message(command, "Not today, my lord.");
        } else {

	    db.get("SELECT * FROM things WHERE name='" + thing + "'", [], (err, row) => {

                if (err) {
                    console.error(err.message);
                    return;
                }
		
		if (row) {
		    run("UPDATE things SET likes=0 WHERE name='" + thing + "'");
		    message(command, "It will be done my lord. Likes are now 0.");
		} else {
		    message(command, "My lord, I do not know who that is.");
		}
	    });
        }

    } else if (keyword == 'fight') {

	thing = args;
        if (currName == args) {
            message(command, "You cannot fight yourself, silly willy!");       
	    return;
	}

        db.get("SELECT * FROM things WHERE name='" + args + "' AND human=1", [], (err, row) => {
            
            if (err) {
                console.error(err.message);
                return;
            }

	    if (row) {	
	        msg = "Hello ladies and gentlemen, before the fight begins, please send in your wagers in the form 'wager {contestant name} {amount}'.  \n" + "You can only wager" +
                        " up to the amount of likes you have, and if negative, you can wager a maximum of 1.  \n  \n" + "You now have 10 seconds to place your bets...  \n  \n";
		message(command, msg);
	        setTimeout(fightSuccess, 20000, thing, currName, command);
	    } else {
	        message(command, "Oye? U Wot? You can only fight humans, scrub!");
	    }
        });
	    
    } else if (keyword == 'wager') {
    	
	var num = parseInt(command.args[1], 10);
	thing = command.args[0].toLowerCase().trim();    
        if (command.args.length > 2 || !Number.isInteger(num) || num < 0) {
	    message(command, "no u");
	    return;
	}

	db.serialize(() => {	

	    db.get("SELECT * FROM things WHERE name='" + thing + "' AND human=1", [], (err, row) => {

                if (err) {
                    console.error(err.message);
                    return;
                }
		
		if (!row) {
		    message(command, "Who dat?");
                    return;
		} else {

		    db.get("SELECT * FROM things WHERE name='" + currName + "' AND human=1", [], (err, row) => {

                	if (err) {
                    	    console.error(err.message);
                    	    return;
                	}

                	if (num != 1 && row.likes <= 0) {
                    	    message(command, "Nice try, " + (currName.charAt(0).toUpperCase() + currName.slice(1)) + "! I have switched your wager to 1 since you do not have any likes.");
                    	    run("UPDATE things SET wagerName='" + thing + "', wagerLikes=" + 1 + " WHERE name='" + currName + "' AND human=1");
                	} else if (num > row.likes && num != 1) {
                    	    message(command, "Nice try, " + (currName.charAt(0).toUpperCase() + currName.slice(1)) + "! I have switched your wager to equal your like count.");
                    	    run("UPDATE things SET wagerName='" + thing + "', wagerLikes=" + row.likes + " WHERE name='" + currName + "' AND human=1");
                	} else {
                    	    run("UPDATE things SET wagerName='" + command.args[0].toLowerCase() + "', wagerLikes=" + num + " WHERE name='" + currName + "' AND human=1");
                        }
                    });
		}
            });
	});

    } else {
        message(command, "no u");
    }
}

function message(command, msg) {

    client.createMessage(command.message.roomId, msg, { "markdown":"true" }, function(err, response) {
        if (err) {
            console.log("WARNING: Could not post fallback message." + command.message.roomId);
            return;
        }
    });
}

function fightSuccess(thing, name, command) {

    db = new sqlite3.Database('LikeBot.db', (err) => {
        if (err) {
            console.error(err.message);
        }
    });

    var rand = Math.floor(Math.random()*2);
    let winner;
    let loser;
    let msg;
 
    if (rand >= 1) {

       	loser = thing;
        winner = name;
        run("UPDATE things SET likes=(likes - 2) WHERE name='" + thing + "' AND human=1");
	run("UPDATE things SET likes=(likes + 2) WHERE name='" + name + "' AND human=1");

	msg = "" + (name.charAt(0).toUpperCase() + name.slice(1)) + " hath slayed " + (thing.charAt(0).toUpperCase() + thing.slice(1)) +
                " and has pried 2 likes from their cold dead hands...  \n" + "Took quite a fall, didn't we, Master " + (thing.charAt(0).toUpperCase() + thing.slice(1)) + "?" +
                " And why do we fall, " + (thing.charAt(0).toUpperCase() + thing.slice(1)) + "? So we can learn to pick ourselves back up.";
	message(command, msg);

    } else {

        loser = name;
        winner = thing;
        run("UPDATE things SET likes=(likes - 2) WHERE name='" + name + "' AND human=1");
	run("UPDATE things SET likes=(likes + 2) WHERE name='" + thing + "' AND human=1");
	
	msg = "" + (thing.charAt(0).toUpperCase() + thing.slice(1)) + " hath slayed " + (name.charAt(0).toUpperCase() + name.slice(1)) +
                " and has pried 2 likes from their cold dead hands...  \n" + "Took quite a fall, didn't we, Master " + (name.charAt(0).toUpperCase() + name.slice(1)) + "?" +
                " And why do we fall, " + (name.charAt(0).toUpperCase() + name.slice(1)) + "? So we can learn to pick ourselves back up.";
        message(command, msg);
    }

    db.serialize(() => {
        run("UPDATE things SET likes=(likes+wagerLikes) WHERE wagerName='" + winner + "' AND human=1");
        run("UPDATE things SET likes=(likes-wagerLikes) WHERE wagerName='" + loser + "' AND human=1");
        run("UPDATE things SET wagerLikes=0 WHERE human=1");
    });
}

function run(sql) {

    db.run(sql, [], (err) => {
        if (err) {
            console.error(err.message);
            return;
        }
    });
}
