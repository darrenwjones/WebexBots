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
from flask import Flask, request
import requests
from webexteamssdk import WebexTeamsAPI, Webhook
import random

# Module constants
GIPHY_URL = "https://api.giphy.com/v1/gifs/search?api_key=fwAMRmabyfhzMFQXmOmaQf6KIAIt3zrR&q='{}'&limit=10&offset=0&rating=PG-13&lang=en"
LAST_MESSAGE = 0

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
    return json_data["data"][random.randint(0,len(json_data["data"]))]["images"]["original"]["url"]

# Core bot functionality
# Your Webex Teams webhook should point to http://<serverip>:8081/
@flask_app.route('/', methods=['GET', 'POST'])
def webex_teams_webhook_events():

    """Processes incoming requests to the '/' URI."""
    if request.method == 'GET':
        return ("""<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8">
        <title>Webex Teams Bot served via Flask</title></head><body><p>
        <strong>Your Flask web server is up and running!</strong></p></body></html>""")

    elif request.method == 'POST':
        """Respond to inbound webhook JSON HTTP POST from Webex Teams."""

        # Get the POST data sent from Webex Teams
        json_data = request.json
        # Create a Webhook object from the JSON data
        webhook_obj = Webhook(json_data)
        if webhook_obj.resource != "messages" or webhook_obj.event != "created":
            return 'OK'

        else:

            # Get the room details
            room = api.rooms.get(webhook_obj.data.roomId)
            # Get the message details
            message = api.messages.get(webhook_obj.data.id)
            # Get the sender's details
            person = api.people.get(message.personId)

            me = api.people.me()
            if message.personId == me.id:
                # Message was sent by me (bot); do not respond.
                return 'OK'

            else:
                global LAST_MESSAGE
                msg = ((message.text).replace("TheBetterGifBot", "")).strip()
			    # Message was sent by someone else; parse message and respond.
                print("\n")
                print("NEW MESSAGE IN ROOM '{}'".format(room.title))
                print("FROM '{}'".format(person.displayName))
                print("MESSAGE '{}'\n".format(msg))
            
                if msg == 'delete.dis':
                    print("DELETING GIF")
                    api.messages.delete(LAST_MESSAGE.id)
                    return 'OK'
 
                else:
                    print("FETCHING GIF")
                    # Get a gif
                    try:
                        gif = get_gif(msg)
                        print("SENDING GIF")
                        # Post the gif to the room where the request was received
                        LAST_MESSAGE = api.messages.create(room.id, file=gif)
                        return 'OK'
                    except:
                        api.messages.create(room.id, text="Sorry, I couldn't find any gifs... try searching with a new keyword or phrase.")

if __name__ == '__main__':
    # Start the Flask web server
    flask_app.run(host='0.0.0.0', port=8081)
