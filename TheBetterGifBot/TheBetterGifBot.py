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
import sqlite3
import Database
import re

GIPHY_URL = "https://api.giphy.com/v1/gifs/search?api_key=fwAMRmabyfhzMFQXmOmaQf6KIAIt3zrR&q='{}'&limit=10&offset=0&rating=PG-13&lang=en"
conn = Database.main()
flask_app = Flask(__name__)
api = WebexTeamsAPI()

def set_dis(msg, room, message, person):
    prevMsg = Database.get_last_message_phrase(conn, person.id)
    prevUrl = Database.get_last_message_url(conn, person.id)
    Database.create_default(conn, (person.id, prevMsg, prevUrl))
    if room.type == 'group':
        api.messages.create(room.id, markdown="<@personId:{}|{}>, your default gif for '{}' has been set.".format(person.id, person.firstName, prevMsg))
    else:
        api.messages.create(room.id, text="Your default gif for '{}' has been set.".format(prevMsg))
    return 'OK'

def unset_dis(msg, room, message, person):
    prevMsg = Database.get_last_message_phrase(conn, person.id)
    Database.delete_default(conn, (person.id, prevMsg))
    if room.type == 'group':
        api.messages.create(room.id, markdown="<@personId:{}|{}>, your default gif for '{}' has been unset.".format(person.id, person.firstName, prevMsg))
    else:
        api.messages.create(room.id, text="Your default gif for '{}' has been unset.".format(prevMsg))
    return 'OK'

def saved_commands(msg, room, message, person):
    commands = Database.get_defaults(conn, person.id)
    commandMsg = ''
    for command in commands:
        commandMsg += "- {}\n".format(command[0])
    if room.type == 'group':
        api.messages.create(room.id, markdown="<@personId:{}|{}>, here are your currently saved commands.\n".format(person.id, person.firstName) + commandMsg)
    else:
        api.messages.create(room.id, markdown="Here are your currently saved commands.\n" + commandMsg)
    return 'OK'

def delete_dis(msg, room, message, person):
    api.messages.delete(Database.get_last_messageId(conn, person.id))
    return 'OK'

def helper(msg, room, message, person):
    help_str = ("###**Commands**\n"
        "- **help** - That's this command!\n"
        "- **delete.dis** - Deletes the last gif that was sent to you.\n"
        "- **set.dis** - Sets the last gif that was sent to you as the default response for the chatted word/phrase.\n"
        "- **unset.dis** - If the last gif sent to you was created by 'set.dis' this will delete that default response.\n"
        "- **saved.commands** - Lists all the saved commands you currently have."
    )
    api.messages.create(room.id, markdown=help_str)
    return 'OK'

def fetch_gif(msg, room, message, person):
    url = Database.get_default_url(conn, (person.id, msg))
    if url:
        print("SENDING DEFAULT GIF")
        url = url[0][0]
        Database.update_last_message(conn, ((api.messages.create(room.id, file=url)).id, msg, url, person.id))
    else:
        print("FETCHING GIF")
        try:
            response = requests.get(GIPHY_URL.format(msg), verify=True)
            response.raise_for_status()
            json_data = response.json()
            gif = json_data["data"][random.randint(0,len(json_data["data"])-1)]["images"]["original"]["url"]
            print("SENDING GIF")
            Database.update_last_message(conn, ((api.messages.create(room.id, file=gif)).id, msg, gif, person.id))
        except:
            api.messages.create(room.id, text="Sorry, I couldn't find any gifs... try searching with a new keyword or phrase.")
    return 'OK'

def process_command(msg, room, message, person):
    switcher={
        'set.dis':set_dis,
        'unset.dis':unset_dis,
        'saved.commands':saved_commands,
        'delete_dis':delete_dis,
        'help':helper
    }
    func = switcher.get(msg, fetch_gif)
    return func(msg, room, message, person)

@flask_app.route('/', methods=['GET', 'POST'])
def webex_teams_webhook_events():

    if request.method == 'GET':
        return ("""<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8">
        <title>Webex Teams Bot served via Flask</title></head><body><p>
        <strong>Your Flask web server is up and running!</strong></p></body></html>""")

    elif request.method == 'POST':
        json_data = request.json
        webhook_obj = Webhook(json_data)
        if webhook_obj.resource != "messages" or webhook_obj.event != "created":
            return 'OK'
        else:
            room = api.rooms.get(webhook_obj.data.roomId)
            message = api.messages.get(webhook_obj.data.id)
            person = api.people.get(message.personId)
            
            if message.personId == api.people.me().id:
                return 'OK'
            else:
                if not Database.get_user(conn, person.id):
                    Database.create_user(conn, (person.id, person.emails[0], None, None, None))

                msg = ((message.text).replace("TheBetterGifBot", "")).strip().lower()
                print("\nNEW MESSAGE IN ROOM '{}'".format(room.title))
                print("FROM '{}'".format(person.displayName))
                print("MESSAGE '{}'".format(msg))
                return process_command(msg, room, message, person)
            
if __name__ == '__main__':
    flask_app.run(host='0.0.0.0', port=8081)
