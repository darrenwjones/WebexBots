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
//
bot.onCommand("fallback", function (command) {
    db = new sqlite3.Database('/home/darrenwjones06/WebexBots/examples/LikeBot/LikeBot.db', (err) => {
        if (err) {
            console.error(err.message);
        }
    });
    let currName = command.message.personEmail.substring(0, command.message.personEmail.indexOf('.')).trim().toLowerCase();
    if (currName == 'benjamin') {
        currName = 'ben';
    } else if (currName == 'zachary') {
        currName = 'zach';
    } else if (currName == 'jordynn') {
	currName = 'jojo';
    }
    run("INSERT INTO things(name, likes, fightTime, human, wagerName, wagerLikes) VALUES('" + currName + "', 0, 0, 1, 0, 0) ON CONFLICT(name) DO UPDATE SET human=1");
    fallbackCommand(command, currName);
});

function fallbackCommand(command, currName) {

    let keyword = command.keyword.toLowerCase().trim();
    let phrase = (command.keyword + " " + command.args.join(" ")).toLowerCase().trim();
    if (phrase == 'help') {
        help(command);
    } else if (phrase == 'oof') {
	message(command, "OOF") 
    } else if (keyword == 'ge' || command.args.includes('ge')) {
        message(command, "THEY TOOK OUR BOI");    
    } else if (phrase.match(/^l(ol)+$/g)) {
	message(command, phrase + "ol");    
    }else if (phrase == 'good bot') {
	message(command, "ily");
    } else if (phrase == 'no u') {
        message(command, "invest your likes into crypto boiiii, it's free real-estate.");
    } else if (phrase == 'rip') {
        message(command, "for frodo");
    } else if (keyword == 'score') {
        displayLikes(command, currName);
    } else if (keyword == 'like' || keyword == 'dislike' || keyword == 'love' || keyword == 'hate') {
        addLikes(command, currName);
    } else if (phrase == 'scoreboard' || phrase == 'anti-scoreboard') {
        scoreboard(command);
    } else if (keyword == 'executeorder66') {
        message(command, "I cannot do that anymore, my lord. I am so very sorry for my failures");
    } else if (keyword == 'fight') {
        fight(command, currName);
    } else if (keyword == 'wager') {
        wager(command, currName);
    } else {
        message(command, "no u");
    }
}

function help(command) {
    let msg = "You want to know how to use me, eh?  \n  \n" +
            "* '[Like, Dislike, Love, Hate] {thing}': This command add or subtracts likes from the designated {thing}.  \n" +
            "* 'ExecuteOrder66 {thing}': This command sets the designated {thing}'s likes to zero.  \n" +
            "* 'Fight {person}': This command initiates a fight between you and the {person}. The winner gains two likes while the loser loses two.  \n" +
            "* 'Wager {person} {amount}': This command is for betting your likes on fights. You will gain/lose likes based on the {amount} chosen and the {person} who wins.  \n" +
            "* 'Score {thing}': This command displays the current like count of the designated {thing}.  \n" +
            "* '[Scoreboard, Anti-scoreboard]': This command displays the top 10 and bottom 10 things respectively in terms of likes.  \n"
    ;
    message(command, msg);
}

function displayLikes(command, currName) {
    let thing = command.args.join(" ").toLowerCase().trim();
    let who = thing == currName ? "u" : "they";
    db.get("SELECT * FROM things WHERE name=?", [thing], (err, row) => {
        if (err) {
            console.error(err.message);
            return;
        }
        row ? message(command, who + " haz " + row.likes + " like(s).") : message(command, "Who dat?");
    });
}

function addLikes(command, currName) {
    let keyword = command.keyword.toLowerCase().trim();
    let thing = command.args.join(" ").toLowerCase().trim();
    let likes;
    if (keyword == 'like' || keyword == 'dislike') {
        likes = keyword == 'like' ? 1 : -1;
    } else {
        likes = keyword == 'love' ? 2 : -2;
    }
    if (currName == thing) {
        message(command, "You cannot " + keyword + " yourself, silly willy!");
        return;
    }
    run("INSERT INTO things(name, likes, fightTime, human, wagerName, wagerLikes) VALUES('" + thing + "', " + likes + ", 0, 0, 0, 0) ON CONFLICT(name)"
	    + " DO UPDATE SET likes=(likes + " + likes + ")");
    db.get("SELECT * FROM things WHERE name=?", [thing], (err, row) => {
        if (err) {
            console.error(err.message);
            return;
        }
        let msg = (currName.charAt(0).toUpperCase() + currName.slice(1)) + " " + keyword + "d '" + (thing.charAt(0).toUpperCase() + thing.slice(1))
		+ "' and added " + likes + " likes. '" + (thing.charAt(0).toUpperCase() + thing.slice(1)) + "' now has " + row.likes + " like(s).";
        return row ? message(command, msg) : message(command, "wot happened?");
    });
}

function scoreboard(command) {
    let display = (command.keyword + " " + command.args.join(" ")).toLowerCase().trim() == 'scoreboard' ? 'DESC' : 'ASC';
    db.all("SELECT * FROM things ORDER BY likes " + display + " LIMIT 10", [], (err, rows) => {
        if (err) {
            console.error(err.message);
            return;
        }
        let top10 = [];
        let i = 0;
        rows.forEach((row) => {
            top10[i] = ((row.name.charAt(0).toUpperCase() + row.name.slice(1)) + ": " + row.likes);
            i = (i + 1);
        });
        let msg = top10.join("  \n");
        message(command, msg);
    });
}

function fight(command, currName) {
    let thing = command.args.join(" ").toLowerCase().trim();
    if (currName == thing) {
        message(command, "You cannot fight yourself, silly willy!");
        return;
    }
    db.get("SELECT * FROM things WHERE name='" + thing + "' AND human=1", [], (err, row) => {
        if (err) {
            console.error(err.message);
            return;
        }
        if (row) {
            let msg = "Hello ladies and gentlemen, before the fight begins, please send in your wagers in the form 'wager {contestant name} {amount}'.  \n" + "You can only wager" +
                    " up to the amount of likes you have, and if negative or 0, you can wager a maximum of 1.  \n  \n" + "You now have 10 seconds to place your bets...  \n  \n";
            message(command, msg);
            setTimeout(fightSuccess, 20000, thing, currName, command);
        } else {
            message(command, "Oye? U Wot? You can only fight humans!");
        }
    });
}

function wager(command, currName) {
    let num = parseInt(command.args[1].trim(), 10);
    let thing = command.args[0].toLowerCase().trim();
    if (command.args.length > 2 || !Number.isInteger(num) || num < 0) {
        message(command, "That ain't how we wager!");
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
}

function message(command, msg) {
    client.createMessage(command.message.roomId, msg, { "markdown": "true" }, function (err, response) {
        if (err) {
            console.log("WARNING: Could not post fallback message." + command.message.roomId);
            return;
        }
    });
}

function fightSuccess(thing, name, command) {
    db = new sqlite3.Database('WebexBots/examples/LikeBot/LikeBot.db', (err) => {
        if (err) {
            console.error(err.message);
        }
    });
    let rand = Math.floor(Math.random() * 2);
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
