# Webex Teams Chatbot examples in Node.js

Interested in creating your own Webex Teams Chatbots ? 
Go through the examples below.

If you feel inspired, run your own version of these bots. 
Simply take the step-by-step tutorials at DevNet: [Run a Webex Teams bot locally](https://learninglabs.cisco.com/tracks/collab-cloud/spark-apps/collab-spark-botl-ngrok/step/1).

Then, pick a [template](templates/) that suits your scenario, and customize it.

Note that these bot samples leverage the [node-sparkbot](https://github.com/CiscoDevNet/node-sparkbot) Chatbot framework.

__Also, if you're new to Webex Teams API, note that DevNet provides a full learning track: [Learning track](https://learninglabs.cisco.com/tracks/collab-cloud).__



## [inspect](examples/inspector.js)

Provides instant access to Webex Teams technical data (such as the space id, or the email of a space participant).

Features illustrated by this example:
- **Help command to display available commands**
- **About command to get meta info about the bot**
- **Welcome message as the bot is added in a room**
- **Fallback message if a command is not recognized**
- Uses the "node-sparky" library to requests the Webex Teams API



## [roomId](examples/roomid-phantom.js)

Fetches the identifier of the space in which this bot has just been added, 
pushes the roomId via a direct message, and leaves the inquired space right away.

Features illustrated by this example:
- Help command to display available commands
- About command to get meta info about the bot
- Fallback message if a command is not recognized
- **Send a direct message and leaves the room**
- Uses "node-sparky" library to interact with Webex Teams



## [room-stats](examples/room-stats.js)

Computes stats for the space it is invoked from. 

Features illustrated by this example:
- Help message to display bot commands
- Welcome message as the bot is added in a room
- **Custom command prefix #**
- **Markdown formatting with lists & mentions**
- **Runs with a Developer account**
- Uses "node-sparky" library to invoke the Webex Teams API

Note that this webhook must be run with a personal access token (from a fake Webex Teams account), because the bot must be able to fetch all messages from spaces, not only those for which bot is mentionned.



## [events](examples/devnet/bot.js)

Tells you about upcoming DevNet events.

Features illustrated by this example:
- Help command to display available commands
- About command to get meta info about the bot
- Welcome message as the bot is added in a room
- Fallback message if a command is not recognized
- **Command with integer argument** 
 - **Markdown formatting with lists and hyperlinks**
- Uses "node-sparky" library to wrap calls to the Webex Teams REST API



## [helloworld](examples/helloworld.js)

A simple template to start from.

Features illustrated by this example:
- Welcome message as the bot is added in a room
- Help command to display available commands
- Fallback message if a command is not recognized
- **Markdown formatting with mention**
- Leverages the "node-sparkclient" library to wrap calls to the Webex Teams REST API



## [TheBetterGifBot](examples/TheBetterGifBot.js)

A simple template to start from.

Features illustrated by this example:
- Calls Giphy API and picks a random gif from a result of 10 on every command
- Fallback message if command is unreadable of the API returns no results
- **Markdown formatting with mention**
- Leverages the "node-sparkclient" library to wrap calls to the Webex Teams REST API

This bot can be run as is with either a Developer or a Bot access token



## [LikeBot](examples/LikeBot.js)

A simple template to start from.

Features illustrated by this example:
- Ability to like/dislike objects/users with the command "{Object/User} like/dislike"
- "Scoreboard" command that displays top 10 liked objects/users
- Ability to trigger fights from you against other users with the command "fight {User}"
- Ability to wager on these fights with the command "wager {User} {Amount}"
- **Markdown formatting with mention**
- Leverages the "node-sparkclient" library to wrap calls to the Webex Teams REST API

This bot can be run as is with either a Developer or a Bot access token
