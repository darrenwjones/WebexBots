# Webex Teams Chatbot examples in Node.js

Interested in creating your own Webex Teams Chatbots ? 
Go through the examples below.

If you feel inspired, run your own version of these bots. 
Simply take the step-by-step tutorials at DevNet: [Run a Webex Teams bot locally](https://learninglabs.cisco.com/tracks/collab-cloud/spark-apps/collab-spark-botl-ngrok/step/1).

Then, pick a [template](templates/) that suits your scenario, and customize it.

Note that these bot samples leverage the [node-sparkbot](https://github.com/CiscoDevNet/node-sparkbot) Chatbot framework.

__Also, if you're new to Webex Teams API, note that DevNet provides a full learning track: [Learning track](https://learninglabs.cisco.com/tracks/collab-cloud).__



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
- Ability to like/dislike & love/hate things with the command "[like,dislike,love,hate] {thing}"
- "Scoreboard" command that displays top 10 liked objects/users. "Antiscoreboard" displays the bottom 10.
- Ability to trigger fights from you against other users with the command "fight {User}"
- Ability to wager on these fights with the command "wager {User} {Amount}"
- **Markdown formatting with mention**
- Leverages the "node-sparkclient" library to wrap calls to the Webex Teams REST API

This bot can be run as is with either a Developer or a Bot access token
