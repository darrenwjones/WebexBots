#!/usr/bin/env python
#  -*- coding: utf-8 -*-

# Use future for Python v2 and v3 compatibility
from __future__ import (
    absolute_import,
    division,
    print_function,
    unicode_literals,
)
from builtins import *

__author__ = "Chris Lunsford"
__author_email__ = "chrlunsf@cisco.com"
__contributors__ = ["Brad Bester <brbester@cisco.com>", "darrenwjones06@gmail.com"]
__copyright__ = "Copyright (c) 2016-2019 Cisco and/or its affiliates."
__license__ = "MIT"

from flask import Flask, request
import requests
from webexteamssdk import WebexTeamsAPI, Webhook
import random

# Module constants
GIPHY_URL = "https://api.giphy.com/v1/gifs/search?api_key=fwAMRmabyfhzMFQXmOmaQf6KIAIt3zrR&q='{}'&limit=10&offset=0&rating=PG-13&lang=en"

# Initialize the environment
# Create the web application instance
flask_app = Flask(__name__)
# Create the Webex Teams API connection object
api = WebexTeamsAPI()

# Helper functions
def get_gif(text):

    response = requests.get(GIPHY_URL.format(text), verify=True)
    response.raise_for_status()
    json_data = response.json()
    return json_data["data"][random.randint(0,len(json_data["data"]))]["images"]["downsized"]["url"]

# Core bot functionality
# Your Webex Teams webhook should point to http://<serverip>:8081/
@flask_app.route('/', methods=['GET', 'POST'])
def webex_teams_webhook_events():

    """Processes incoming requests to the '/' URI."""
    if request.method == 'GET':
        return ("""<!DOCTYPE html>
                   <html lang="en">
                       <head>
                           <meta charset="UTF-8">
                           <title>Webex Teams Bot served via Flask</title>
                       </head>
                   <body>
                   <p>
                   <strong>Your Flask web server is up and running!</strong>
                   </p>
                   </body>
                   </html>
                """)
    elif request.method == 'POST':
        """Respond to inbound webhook JSON HTTP POST from Webex Teams."""

        # Get the POST data sent from Webex Teams
        json_data = request.json
        #print("\n")
        #print("WEBHOOK POST RECEIVED:")
        #print(json_data)
        #print("\n")

        # Create a Webhook object from the JSON data
        webhook_obj = Webhook(json_data)
        # Get the room details
        room = api.rooms.get(webhook_obj.data.roomId)
        # Get the message details
        message = api.messages.get(webhook_obj.data.id)
        # Get the sender's details
        person = api.people.get(message.personId)

        # This is a VERY IMPORTANT loop prevention control step.
        # If you respond to all messages...  You will respond to the messages
        # that the bot posts and thereby create a loop condition.
        me = api.people.me()
        if message.personId == me.id:
            # Message was sent by me (bot); do not respond.
            return 'OK'

        else:
			# Message was sent by someone else; parse message and respond.
            print("\n")
            print("NEW MESSAGE IN ROOM '{}'".format(room.title))
            print("FROM '{}'".format(person.displayName))
            print("MESSAGE '{}'\n".format(((message.text).replace("TheBetterGifBot", "")).strip()))
            
            #print("\n")
            print("FETCHING GIF")
            # Get a gif
            try:
                gif = get_gif(((message.text).replace("TheBetterGifBot", "")).strip())
                print("SENDING GIF")
                # Post the gif to the room where the request was received
                api.messages.create(room.id, file=gif)
                return 'OK'
            except:
                api.messages.create(room.id, text="Sorry, I couldn't find any gifs... try searching with a new keyword or phrase.")

if __name__ == '__main__':
    # Start the Flask web server
    flask_app.run(host='0.0.0.0', port=8081)
