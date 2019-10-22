import sqlite3
from sqlite3 import Error
 
def create_connection(db_file):
    conn = None
    try:
        conn = sqlite3.connect('test.db', check_same_thread=False)
        return conn
    except Error as e:
        print(e) 
    return conn
  
def create_table(conn, create_table_sql):
    try:
        c = conn.cursor()
        c.execute(create_table_sql)
    except Error as e:
        print(e)

def create_user(conn, person):
    print("Creating User")
    sql = '''INSERT INTO users(personId,email,last_messageId,last_message_phrase,last_message_url) VALUES(?,?,?,?,?)'''
    cur = conn.cursor()
    cur.execute(sql, person)
    return cur.lastrowid

def get_user(conn, person):
    print("Getting User")
    sql = '''SELECT * FROM users WHERE personId=?'''
    cur = conn.cursor()
    cur.execute(sql, (person,))
    return cur.fetchall()

def create_default(conn, default):
    print("Creating Default")
    sql = '''INSERT INTO defaults(personId,phrase,url) VALUES(?,?,?)'''
    cur = conn.cursor()
    cur.execute(sql, default)
    conn.commit()
    return 'OK'

def get_default_url(conn, default):
    print("Getting Default")
    sql = '''SELECT url FROM defaults WHERE personId=? AND phrase=?'''
    cur = conn.cursor()
    cur.execute(sql, default)
    return cur.fetchall()

def get_defaults(conn, person):
    print("Getting all Defaults")
    sql = '''SELECT phrase FROM defaults WHERE personId=?'''
    cur = conn.cursor()
    cur.execute(sql, (person,))
    return cur.fetchall()

def delete_default(conn, default):
    print("Deleting Default")
    sql = '''DELETE FROM defaults WHERE personId=? AND phrase=?'''
    cur = conn.cursor()
    cur.execute(sql, default)
    conn.commit()
    return 'OK'

def get_last_messageId(conn, person):
    print("Getting Last Message ID")
    sql = '''SELECT last_messageId FROM users WHERE personId=?'''
    cur = conn.cursor()
    cur.execute(sql, (person,))
    return cur.fetchall()[0][0]

def get_last_message_phrase(conn, person):
    print("Getting Last Message Phrase")
    sql = '''SELECT last_message_phrase FROM users WHERE personId=?'''
    cur = conn.cursor()
    cur.execute(sql, (person,))
    return cur.fetchall()[0][0]

def get_last_message_url(conn, person):
    print("Getting Last Message Url")
    sql = '''SELECT last_message_url FROM users WHERE personId=?'''
    cur = conn.cursor()
    cur.execute(sql, (person,))
    return cur.fetchall()[0][0]

def update_last_message(conn, person):
    print("Updating Last Message")
    sql = '''UPDATE users SET last_messageId=?, last_message_phrase=?, last_message_url=? WHERE personId=?'''
    cur = conn.cursor()
    cur.execute(sql, person)
    conn.commit()
    return 'OK'

def main():
    database = "~/WebexBots/TheBetterGifBot/sqlite.db"
    sql_create_users_table = """CREATE TABLE IF NOT EXISTS users (
                                        id integer PRIMARY KEY,
                                        personId text NOT NULL,
                                        email text NOT NULL,
                                        last_messageId text,
                                        last_message_phrase text,
                                        last_message_url text
                                    );"""
    sql_create_defaults_table = """CREATE TABLE IF NOT EXISTS defaults (
                                    id integer PRIMARY KEY,
                                    personId text NOT NULL,
                                    phrase text NOT NULL,
                                    url text NOT NULL
                                );"""
    conn = create_connection(database)
    if conn is not None:
        create_table(conn, sql_create_users_table)
        create_table(conn, sql_create_defaults_table)
    else:
        print("Error! cannot create the database connection.")
    return conn
