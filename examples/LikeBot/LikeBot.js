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
var db = new sqlite3.Database('/home/darrenwjones06/WebexBots/examples/LikeBot/LikeBot.db', (err) => {
    if (err) {
        console.error(err.message);
    }
});

//
// Fallback command
//
//
bot.onCommand("fallback", function (command) {
    message(command, "no u bro beans try 32");
});

bot.onCommand("help", function (command) {
    let msg = "You want to know how to use me, eh?  \n  \n" +
            "* '[Like, Dislike, Love, Hate] {thing}': This command add or subtracts likes from the designated {thing}.  \n" +
            "* 'ExecuteOrder66 {thing}': This command sets the designated {thing}'s likes to zero.  \n" +
            "* 'Fight {person}': This command initiates a fight between you and the {person}. The winner gains two likes while the loser loses two.  \n" +
            "* 'Wager {person} {amount}': This command is for betting your likes on fights. You will gain/lose likes based on the {amount} chosen and the {person} who wins.  \n" +
            "* 'Score {thing}': This command displays the current like count of the designated {thing}.  \n" +
            "* '[Scoreboard, Anti-scoreboard]': This command displays the top 10 and bottom 10 things respectively in terms of likes.  \n"
    ;
    message(command, msg);
});

bot.onCommand("scoreboard", function (command) {
    db.all("SELECT * FROM things ORDER BY likes DESC LIMIT 10", [], (err, rows) => {
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
        message(command, top10.join("  \n"));
    });
});

bot.onCommand("anti-scoreboard", function (command) {
    db.all("SELECT * FROM things ORDER BY likes ASC LIMIT 10", [], (err, rows) => {
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
        message(command, top10.join("  \n"));
    });
});

bot.onCommand("score", function (command) {
    let thing = command.args.join(" ");
    currName = getCurrentName(command);
    let who = thing == currName ? "u" : "they";
    db.get("SELECT * FROM things WHERE name=?", [thing], (err, row) => {
        if (err) {
            console.error(err.message);
            return;
        }
        row ? message(command, who + " haz " + row.likes + " like(s).") : message(command, "Who dat?");
    });
});

bot.onCommand("like", function (command) {
    doLikes(command, "1");
});

bot.onCommand("dislike", function (command) {
    doLikes(command, "-1");
});

bot.onCommand("love", function (command) {
    doLikes(command, "2");
});

bot.onCommand("hate", function (command) {
    doLikes(command, "-2");
});

bot.onCommand("executeorder66", function (command) {
    let thing = command.args.join(" ");
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
});

bot.onCommand("fight", function (command) {
    let thing = command.args.join(" ");
    currName = getCurrentName(command);

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
});

bot.onCommand("register", function (command) {
    currName = getCurrentName(command);
    run("INSERT INTO things(name, likes, fightTime, human, wagerName, wagerLikes) VALUES('" + currName + "', 0, 0, 1, 0, 0) ON CONFLICT(name) DO UPDATE SET human=1");
});

bot.onCommand("wager", function (command) {
    let num = parseInt(command.args[1], 10);
    let thing = command.args[0];
    if (command.args.length > 2 || !Number.isInteger(num) || num < 0) {
        message(command, "That ain't how we wager!");
        return;
    }
    currName = getCurrentName(command);
    currName = (currName.charAt(0).toUpperCase() + currName.slice(1));	

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
                db.get("SELECT * FROM things WHERE name='" + currName.toLowerCase() + "' AND human=1", [], (err, row) => {
                    if (err) {
                        console.error(err.message);
                        return;
                    }
                    if (num != 1 && row.likes <= 0) {
                        message(command, "Nice try, " + currName + "! I have switched your wager to 1 since you do not have any likes.");
                        run("UPDATE things SET wagerName='" + thing + "', wagerLikes=" + 1 + " WHERE name='" + currName.toLowerCase() + "' AND human=1");
                    } else if (num > row.likes && num != 1) {
                        message(command, "Nice try, " + currName + "! I have switched your wager to equal your like count.");
                        run("UPDATE things SET wagerName='" + thing + "', wagerLikes=" + row.likes + " WHERE name='" + currName.toLowerCase() + "' AND human=1");
                    } else {
			message(command, currName + ", your wager has been set to " + num);
                        run("UPDATE things SET wagerName='" + command.args[0] + "', wagerLikes=" + num + " WHERE name='" + currName.toLowerCase() + "' AND human=1");
                    }
                });
            }
        });
    });
});

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
                " and has pried 2 likes from their cold dead hands...  \n  \n" + "Took quite a fall, didn't we, Master " + (thing.charAt(0).toUpperCase() + thing.slice(1)) + "?" +
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

function getCurrentName(command) {
    var currName = command.message.personEmail.substring(0, command.message.personEmail.indexOf('.')).toLowerCase();
    if (currName == 'benjamin') {
        currName = 'ben';
    } else if (currName == 'zachary') {
        currName = 'zach';
    } else if (currName == 'jordynn') {
	currName = 'jojo';
    }
    return currName;
}

function doLikes(command, likes) {
    let keyword = command.keyword;
    let thing = command.args.join(" ");
    let currName = getCurrentName(command);
    currName = (currName.charAt(0).toUpperCase() + currName.slice(1));

    if (currName.toLowerCase() == thing) {
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
	if (row) {
            let msg = currName + " " + keyword + "d '" + (thing.charAt(0).toUpperCase() + thing.slice(1)) + "' and added " + likes +
		    " likes. '" + (thing.charAt(0).toUpperCase() + thing.slice(1)) + "' now has " + row.likes + " like(s).";
            message(command, msg)
	} else {
	    message(command, "wot happened?");
	}
    });
}
