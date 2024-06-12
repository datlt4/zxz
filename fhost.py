#!/usr/bin/env python3
# -*- coding: utf-8 -*-

"""
    Copyright © 2020 Mia Herkt
    Licensed under the EUPL, Version 1.2 or - as soon as approved
    by the European Commission - subsequent versions of the EUPL
    (the "License");
    You may not use this work except in compliance with the License.
    You may obtain a copy of the license at:

        https://joinup.ec.europa.eu/software/page/eupl

    Unless required by applicable law or agreed to in writing,
    software distributed under the License is distributed on an
    "AS IS" basis, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND,
    either express or implied.
    See the License for the specific language governing permissions
    and limitations under the License.
"""

from flask import Flask, abort, make_response, redirect, request, send_from_directory, url_for, jsonify, Response, render_template, send_file, flash, current_app
from flask_sqlalchemy import SQLAlchemy
from flask_migrate import Migrate
from sqlalchemy import and_, or_, Enum
from jinja2.exceptions import *
from jinja2 import ChoiceLoader, FileSystemLoader
from hashlib import sha256
from magic import Magic
from mimetypes import guess_extension
import click
import re
import os
import io
import sys
import time
import datetime
import typing
import requests
import secrets
import tempfile
import shutil
from validators import url as url_valid
from pathlib import Path
from slugify import slugify
from flask_cors import CORS
from http import HTTPStatus
from inspect import currentframe, getframeinfo
from flask_login import UserMixin, login_required, login_user, current_user, logout_user, LoginManager
from werkzeug.security import generate_password_hash, check_password_hash
from flask_mail import Mail, Message
from itsdangerous import URLSafeTimedSerializer as Serializer
from functools import wraps
from threading import Thread

HTTP_URL_PATTERN = re.compile(r"(http[s]*://[\w.:]+)/?.*")
EMAIL_ADDRESS_PATTERN = re.compile(r"^[\w. +-]+@[\w-]+\.[\w.-]+$")

app = Flask(__name__, instance_relative_config=True)
CORS(app, support_credentials=True, resources={r"/api/*": {"origins": "*"}})
app.secret_key = sha256(str(time.time()).encode("utf-8")).hexdigest()
app.config.update(
    SQLALCHEMY_TRACK_MODIFICATIONS = False,
    PREFERRED_URL_SCHEME = "https", # nginx users: make sure to have 'uwsgi_param UWSGI_SCHEME $scheme;' in your config
    USE_X_SENDFILE = False,
    FHOST_USE_X_ACCEL_REDIRECT = True, # expect nginx by default
    FHOST_STORAGE_PATH = "up",
    FHOST_MAX_EXT_LENGTH = 9,
    FHOST_SECRET_BYTES = 16,
    FHOST_EXT_OVERRIDE = {
        "audio/flac" : ".flac",
        "image/gif" : ".gif",
        "image/jpeg" : ".jpg",
        "image/jpeg" : ".jpeg",
        "image/png" : ".png",
        "image/svg+xml" : ".svg",
        "video/webm" : ".webm",
        "video/x-matroska" : ".mkv",
        "application/octet-stream" : ".bin",
        "text/plain" : ".log",
        "text/plain" : ".txt",
        "text/x-diff" : ".diff",
    },
    FHOST_MIME_BLACKLIST = [
        "application/x-dosexec",
        "application/java-archive",
        "application/java-vm"
    ],
    FHOST_UPLOAD_BLACKLIST = None,
    NSFW_DETECT = False,
    NSFW_THRESHOLD = 0.608,
    VSCAN_SOCKET = None,
    VSCAN_QUARANTINE_PATH = "quarantine",
    VSCAN_IGNORE = [
        "Eicar-Test-Signature",
        "PUA.Win.Packer.XmMusicFile",
    ],
    VSCAN_INTERVAL = datetime.timedelta(days=7),
    URL_ALPHABET = "DEQhd2uFteibPwq0SWBInTpA_jcZL5GKz3YCR14Ulk87Jors9vNHgfaOmMXy6Vx-",
    REMEMBER_COOKIE_DURATION = datetime.timedelta(hours=12),
    # Gmail config
    MAIL_SERVER = os.environ.get("MAIL_SERVER", "smtp.gmail.com"),
    MAIL_PORT = int(os.environ.get("MAIL_PORT", 587)),
    MAIL_USERNAME = os.environ.get("MAIL_USERNAME"),
    MAIL_PASSWORD = os.environ.get("MAIL_PASSWORD"),
    MAIL_USE_TLS = bool(int(os.environ.get("MAIL_USE_TLS", True))),
    MAIL_USE_SSL = bool(int(os.environ.get("MAIL_USE_SSL", False))),
    # Email token expiration
    RESET_PASSWORD_TOKEN_EXPIRES_IN = int(os.environ.get("RESET_PASSWORD_TOKEN_EXPIRES_IN", 20)),
    ACTIVATE_EMAIL_TOKEN_EXPIRES_IN = int(os.environ.get("ACTIVATE_EMAIL_TOKEN_EXPIRES_IN", 20)),
)

if not app.config["TESTING"]:
    app.config.from_pyfile("config.py")
    app.jinja_loader = ChoiceLoader([
        FileSystemLoader(str(Path(app.instance_path) / "templates")),
        app.jinja_loader
    ])

    if app.config["DEBUG"]:
        app.config["FHOST_USE_X_ACCEL_REDIRECT"] = False

if app.config["NSFW_DETECT"]:
    from nsfw_detect import NSFWDetector
    nsfw = NSFWDetector()

try:
    mimedetect = Magic(mime=True, mime_encoding=False)
except:
    print("""Error: You have installed the wrong version of the 'magic' module.
Please install python-magic.""")
    sys.exit(1)

db = SQLAlchemy(app)
migrate = Migrate(app, db)
mail = Mail(app)

login_manager = LoginManager()
login_manager.login_view = 'login'
login_manager.init_app(app)

def calculate_sha256(file_path, chunk_size=4096):
    sha256_result = sha256()  # Initialize SHA-256 hash object
    # Open the file in binary mode for reading
    with open(file_path, 'rb') as file:
        # Read the file in chunks and update the hash
        while True:
            chunk = file.read(chunk_size)  # Read a chunk of data
            if not chunk:  # End of file
                break
            sha256_result.update(chunk)  # Update the hash with the chunk
    # Return the hexadecimal representation of the hash digest
    return sha256_result.hexdigest()

class User(UserMixin, db.Model):
    __tablename__ = "User"
    id = db.Column(db.Integer, primary_key = True)
    username = db.Column(db.UnicodeText(255), unique = True, nullable=False)
    fullname = db.Column(db.UnicodeText(255), default="")
    biography = db.Column(db.UnicodeText(10000), default="")
    email = db.Column(db.UnicodeText(255), unique = True, nullable=False)
    password = db.Column(db.UnicodeText(255), nullable=False)
    website = db.Column(db.UnicodeText(1000), default="")
    location = db.Column(db.UnicodeText(255), default="")
    visibility = db.Column(db.Integer, default=1)
    hide_email = db.Column(db.Boolean, default=False)
    hide_activity = db.Column(db.Boolean, default=False)
    is_admin = db.Column(db.Boolean, default=False)
    avatar_method = db.Column(db.Boolean, default=True) # True: use custom avatar, False: lookup avatar by email address
    avatar = db.Column(db.UnicodeText(255), default="")
    is_confirmed = db.Column(db.Boolean, nullable=False, default=False)
    confirmed_on = db.Column(db.DateTime, nullable=True)
    remember_token = db.Column(db.UnicodeText(255), nullable=True)
    is_active = db.Column(db.Boolean, default=False)
    created_at = db.Column(db.DateTime, default=datetime.datetime.utcnow)  # Column to store creation timestamp
    updated_at = db.Column(db.DateTime, default=datetime.datetime.utcnow)

    __table_args__ = (
        db.CheckConstraint(visibility.in_([1, 2, 3]), name='valid_range'),
    )

    def __init__(self, username, email, password, is_admin=False, is_active=False, email_verified_at=None):
        self.username = username
        self.email = email
        self.password = generate_password_hash(password)
        self.is_admin = is_admin
        self.is_active = is_active
        self.email_verified_at = email_verified_at
        self.created_at = datetime.datetime.utcnow()
        self.updated_at = datetime.datetime.utcnow()

    def get_reset_password_token(self, expires_in: int, type_token: str):
        s = Serializer(current_app.config['SECRET_KEY'])
        return s.dumps({"user_id": self.id, "type_token": type_token, "expiration": time.time() + expires_in})

    @staticmethod
    def verify_reset_password_token(token, type_token):
        s = Serializer(current_app.config['SECRET_KEY'])
        try:
            user_id = s.loads(token)['user_id']
            expiration = s.loads(token)['expiration']
            if (s.loads(token)['type_token'] != type_token) or (expiration < time.time()):
                return None
        except:
            return None
        return db.session.get(User, user_id)

    def get_username(self):
        return self.username

    def get_email(self):
        return self.email

    def set_admin_role(self):
        self.is_admin = True
        self.updated_at = datetime.datetime.utcnow()

    def remove_admin_role(self):
        self.is_admin = False
        self.updated_at = datetime.datetime.utcnow()

    def activate_user(self):
        self.is_active = True
        self.updated_at = datetime.datetime.utcnow()

    def confirm_email(self):
        self.is_confirmed = True
        self.confirmed_on = datetime.datetime.utcnow()
        self.updated_at = datetime.datetime.utcnow()

    def change_password(self, new_password):
        self.password = generate_password_hash(new_password)
        self.updated_at = datetime.datetime.utcnow()

    def deactivate_user(self):
        self.is_active = False
        self.email_verified_at = None
        self.updated_at = datetime.datetime.utcnow()

    def __repr__(self):
        return f'<User:\tusername: "{self.username}"\n\temail: "{self.email}"\n>'

class URL(db.Model):
    __tablename__ = "URL"
    id = db.Column(db.Integer, primary_key = True)
    url = db.Column(db.UnicodeText, unique = True)
    # user_id = db.Column

    def __init__(self, url):
        self.url = url

    def __repr__(self):
        return f'<URL: link: "{self.url}">'

    def getname(self):
        return su.enbase(self.id)

    def geturl(self):
        return url_for("get", path=self.getname(), _external=True) + "\n"

    def get(url):
        u = URL.query.filter_by(url=url).first()

        if not u:
            u = URL(url)
            db.session.add(u)
            db.session.commit()

        return u

class File(db.Model):
    id = db.Column(db.Integer, primary_key = True)
    sha256 = db.Column(db.String, unique = True)
    ext = db.Column(db.UnicodeText)
    mime = db.Column(db.UnicodeText)
    addr = db.Column(db.UnicodeText)
    ua = db.Column(db.UnicodeText)
    removed = db.Column(db.Boolean, default=False)
    nsfw_score = db.Column(db.Float)
    expiration = db.Column(db.BigInteger)
    mgmt_token = db.Column(db.String)
    secret = db.Column(db.String)
    last_vscan = db.Column(db.DateTime)
    size = db.Column(db.BigInteger)

    def __init__(self, sha256, ext, mime, addr, ua, expiration, mgmt_token):
        self.sha256 = sha256
        self.ext = ext
        self.mime = mime
        self.addr = addr
        self.ua = ua
        self.expiration = expiration
        self.mgmt_token = mgmt_token

    @property
    def is_nsfw(self) -> bool:
        return self.nsfw_score and self.nsfw_score > app.config["NSFW_THRESHOLD"]

    def getname(self):
        return u"{0}{1}".format(su.enbase(self.id), self.ext)

    def geturl(self):
        n = self.getname()

        if self.is_nsfw:
            return url_for("get", path=n, secret=self.secret, _external=True, _anchor="nsfw") + "\n"
        else:
            return url_for("get", path=n, secret=self.secret, _external=True) + "\n"

    def getpath(self) -> Path:
        return Path(app.config["FHOST_STORAGE_PATH"]) / self.sha256

    def delete(self, permanent=False):
        self.expiration = None
        self.mgmt_token = None
        self.removed = permanent
        self.getpath().unlink(missing_ok=True)

    # Returns the epoch millisecond that a file should expire
    #
    # Uses the expiration time provided by the user (requested_expiration)
    # upper-bounded by an algorithm that computes the size based on the size of the
    # file.
    #
    # That is, all files are assigned a computed expiration, which can voluntarily
    # shortened by the user either by providing a timestamp in epoch millis or a
    # duration in hours.
    def get_expiration(requested_expiration, size) -> int:
        current_epoch_millis = time.time() * 1000;

        # Maximum lifetime of the file in milliseconds
        this_files_max_lifespan = get_max_lifespan(size);

        # The latest allowed expiration date for this file, in epoch millis
        this_files_max_expiration = this_files_max_lifespan + 1000 * time.time();

        if requested_expiration is None:
            return this_files_max_expiration
        elif requested_expiration < 1650460320000:
            # Treat the requested expiration time as a duration in hours
            requested_expiration_ms = requested_expiration * 60 * 60 * 1000
            return min(this_files_max_expiration, current_epoch_millis + requested_expiration_ms)
        else:
            # Treat the requested expiration time as a timestamp in epoch millis
            return min(this_files_max_expiration, requested_expiration)

    """
    requested_expiration can be:
        - None, to use the longest allowed file lifespan
        - a duration (in hours) that the file should live for
        - a timestamp in epoch millis that the file should expire at

    Any value greater that the longest allowed file lifespan will be rounded down to that
    value.
    """
    def store(file_, requested_expiration: typing.Optional[int], addr, ua, secret: str, temp_filename: str = None):
        data = None
        digest = None
        if (temp_filename):
            digest = calculate_sha256(temp_filename)
        else:
            data = file_.read()
            digest = sha256(data).hexdigest()

        def get_mime():
            guess = mimedetect.from_file(temp_filename) if temp_filename else mimedetect.from_buffer(data)
            app.logger.debug(f"MIME - specified: '{file_.content_type}' - detected: '{guess}'")

            if not file_.content_type or not "/" in file_.content_type or file_.content_type == "application/octet-stream":
                mime = guess
            else:
                mime = file_.content_type

            if mime in app.config["FHOST_MIME_BLACKLIST"] or guess in app.config["FHOST_MIME_BLACKLIST"]:
                abort(415)

            if len(mime) > 128:
                abort(400)

            if mime.startswith("text/") and not "charset" in mime:
                mime += "; charset=utf-8"

            return mime

        def get_ext(mime):
            ext = "".join(Path(file_.filename).suffixes[-2:])
            if len(ext) > app.config["FHOST_MAX_EXT_LENGTH"]:
                ext = Path(file_.filename).suffixes[-1]
            gmime = mime.split(";")[0]
            guess = guess_extension(gmime)

            app.logger.debug(f"extension - specified: '{ext}' - detected: '{guess}'")

            if not ext:
                if gmime in app.config["FHOST_EXT_OVERRIDE"]:
                    ext = app.config["FHOST_EXT_OVERRIDE"][gmime]
                elif guess:
                    ext = guess
                else:
                    ext = ""

            return "." + (ext[:app.config["FHOST_MAX_EXT_LENGTH"]] or ".bin").split(".")[-1]

        file_size = os.path.getsize(temp_filename)
        expiration = File.get_expiration(requested_expiration, file_size if temp_filename else len(data))
        isnew = True

        f = File.query.filter_by(sha256=digest).first()
        if f:
            # If the file already exists
            if f.removed:
                # The file was removed by moderation, so don't accept it back
                abort(451)
            if f.expiration is None:
                # The file has expired, so give it a new expiration date
                f.expiration = expiration

                # Also generate a new management token
                f.mgmt_token = secrets.token_urlsafe()
            else:
                # The file already exists, update the expiration if needed
                f.expiration = max(f.expiration, expiration)
                isnew = False
        else:
            mime = get_mime()
            ext = get_ext(mime)
            mgmt_token = secrets.token_urlsafe()
            f = File(digest, ext, mime, addr, ua, expiration, mgmt_token)

        f.addr = addr
        f.ua = ua

        if isnew:
            f.secret = None
            if secret is not None:
                f.secret = secrets.token_urlsafe(app.config["FHOST_SECRET_BYTES"]) if (secret == "") else secret

        storage = Path(app.config["FHOST_STORAGE_PATH"])
        storage.mkdir(parents=True, exist_ok=True)
        p = storage / digest

        if not p.is_file():
            if temp_filename:
                # Move the temporary file to the specified destination path
                shutil.move(temp_filename, str(p))
            else:
                with open(p, "wb") as of:
                    of.write(data)

        f.size = file_size if temp_filename else len(data)

        if not f.nsfw_score and app.config["NSFW_DETECT"]:
            f.nsfw_score = nsfw.detect(str(p))

        db.session.add(f)
        db.session.commit()
        return f, isnew

class UrlEncoder(object):
    def __init__(self,alphabet, min_length):
        self.alphabet = alphabet
        self.min_length = min_length

    def enbase(self, x):
        n = len(self.alphabet)
        str = ""
        while x > 0:
            str = (self.alphabet[int(x % n)]) + str
            x = int(x // n)
        padding = self.alphabet[0] * (self.min_length - len(str))
        return '%s%s' % (padding, str)

    def debase(self, x):
        n = len(self.alphabet)
        result = 0
        for i, c in enumerate(reversed(x)):
            result += self.alphabet.index(c) * (n ** i)
        return result

su = UrlEncoder(alphabet=app.config["URL_ALPHABET"], min_length=1)

def fhost_url(scheme=None):
    if not scheme:
        return url_for(".fhost", _external=True).rstrip("/")
    else:
        return url_for(".fhost", _external=True, _scheme=scheme).rstrip("/")

def is_fhost_url(url):
    return url.startswith(fhost_url()) or url.startswith(fhost_url("https"))

def shorten(url):
    if len(url) > app.config["MAX_URL_LENGTH"]:
        abort(414)

    if not url_valid(url) or is_fhost_url(url) or "\n" in url:
        abort(400)

    u = URL.get(url)

    return u.geturl()

def in_upload_bl(addr):
    if app.config["FHOST_UPLOAD_BLACKLIST"]:
        with app.open_instance_resource(app.config["FHOST_UPLOAD_BLACKLIST"], "r") as bl:
            check = addr.lstrip("::ffff:")
            for l in bl.readlines():
                if not l.startswith("#"):
                    if check == l.rstrip():
                        return True

    return False

"""
requested_expiration can be:
    - None, to use the longest allowed file lifespan
    - a duration (in hours) that the file should live for
    - a timestamp in epoch millis that the file should expire at

Any value greater that the longest allowed file lifespan will be rounded down to that
value.
"""
def store_file(f, requested_expiration:  typing.Optional[int], addr, ua, secret: str, temp_filename: str = None):
    if in_upload_bl(addr):
        return "Your host is blocked from uploading files.\n", 451

    sf, isnew = File.store(f, requested_expiration, addr, ua, secret, temp_filename)

    response = make_response(sf.geturl())
    response.headers["X-Expires"] = sf.expiration
    response.headers["X-Token"] = sf.mgmt_token
    return response

def store_url(url, addr, ua, secret: str):
    if is_fhost_url(url):
        abort(400)

    h = { "Accept-Encoding" : "identity" }
    r = requests.get(url, stream=True, verify=False, headers=h)

    try:
        r.raise_for_status()
    except requests.exceptions.HTTPError as e:
        return str(e) + "\n"

    if "content-length" in r.headers:
        l = int(r.headers["content-length"])

        if l <= app.config["MAX_CONTENT_LENGTH"]:
            def urlfile(**kwargs):
                return type('',(),kwargs)()

            f = urlfile(read=r.raw.read, content_type=r.headers["content-type"], filename="")

            return store_file(f, None, addr, ua, secret)
        else:
            abort(413)
    else:
        abort(411)

def manage_file(f):
    try:
        assert(request.form["token"] == f.mgmt_token)
    except:
        abort(401)

    if "delete" in request.form:
        f.delete()
        db.session.commit()
        return ""
    if "expires" in request.form:
        try:
            requested_expiration = int(request.form["expires"])
        except ValueError:
            abort(400)

        f.expiration = File.get_expiration(requested_expiration, f.size)
        db.session.commit()
        return "", 202

    abort(400)

def send_async_email(app, msg):
    with app.app_context():
        mail.send(msg)

def send_email(subject, sender, recipients, text_body, html_body):
    msg = Message(subject, sender=sender, recipients=recipients)
    msg.body = text_body
    msg.html = html_body
    # thr = Thread(target=send_async_email, args=[app, msg])
    # thr.start()
    mail.send(msg)

def logout_required(func):
    @wraps(func)
    def decorated_function(*args, **kwargs):
        print("current_user:", current_user)
        if (current_user is not None) and (current_user.is_authenticated):
            flash("You are already authenicated", "logged-in")
            return redirect(url_for("fhost"))
        return func(*args, **kwargs)
    return decorated_function

def activate_required(func):
    @wraps(func)
    def decorated_function(*args, **kwargs):
        if (current_user is not None) and (current_user.is_authenticated) and (not current_user.is_confirmed):
            flash("Your account has not activated yet", "not-activated")
            return render_template("auth/activate-account.html")
        return func(*args, **kwargs)
    return decorated_function

def unactivate_required(func):
    @wraps(func)
    def decorated_function(*args, **kwargs):
        if (current_user is not None) and (current_user.is_authenticated) and (current_user.is_confirmed):
            flash("Your account has activated already", "account-activated")
            return redirect(url_for("fhost"))
        return func(*args, **kwargs)
    return decorated_function

@login_manager.user_loader
def load_user(user_id):
    return User.query.get(int(user_id))

@login_manager.unauthorized_handler
def unauthorized():
    abort(HTTPStatus.UNAUTHORIZED)
    return

@app.route('/check-email', methods=["POST"])
def check_email():
    email = request.form.get('email').strip()
    user = User.query.filter_by(email=email).first()
    if user is None:
        abort(HTTPStatus.NOT_FOUND)
    else:
        return {"status": "OK"}

@app.route('/check-username', methods=["POST"])
def check_username():
    username = request.form.get('username').strip()
    user = User.query.filter_by(username=username).first()
    if user is None:
        abort(HTTPStatus.NOT_FOUND)
    else:
        return {"status": "OK"}

@app.route('/check-is-confirmed', methods=["POST"])
@login_required
def check_is_confirmed():
    if current_user is None:
        abort(HTTPStatus.NOT_FOUND)
    else:
        return {"confirmed": current_user.is_confirmed}

@app.route('/request-activate-account', methods=[ "POST"])
@login_required
@unactivate_required
def request_activate_account():
    if request.method == "POST":
        if current_user is None:
            flash('You have not logged in yet. Retry to login again', 'unlogged-in')
            return redirect(url_for("login"))
        else:
            try:
                token = current_user.get_reset_password_token(app.config["ACTIVATE_EMAIL_TOKEN_EXPIRES_IN"]*60, "activate-account");
                send_email(subject="Activate your ZXZ account",
                            sender=app.config["MAIL_USERNAME"],
                            recipients=[current_user.email], text_body="HELLO",
                            html_body=render_template("auth/email-activate-account.html", token=token, expires_in=app.config["ACTIVATE_EMAIL_TOKEN_EXPIRES_IN"]))
                return {"status": "OK"}
            except Exception as e:
                print(e)
                abort(HTTPStatus.INTERNAL_SERVER_ERROR)

@app.route('/activate-account/<token>', methods=["GET"])
def activate_account(token):
    user = User.verify_reset_password_token(token, type_token="activate-account")
    if user is None:
        flash('TOKEN IS INVALID OR EXPIRED.', 'invalid-activate-token')
        return redirect(url_for("fhost"))
    elif user.is_confirmed:
        flash('ACCOUNT WAS ACTIVATED SUCCESSFULLY.', 'account-activated')
        return render_template("auth/activate-account-success.html")
    else:
        user.confirm_email()
        db.session.commit()
        flash('ACCOUNT WAS ACTIVATED SUCCESSFULLY.', 'account-activated')
        return render_template("auth/activate-account-success.html")

@app.route('/forgot-password', methods=["GET", "POST"])
@logout_required
def forgot_password():
    if request.method == "POST":
        email = request.form.get('email').strip()
        user = User.query.filter_by(email=email).first()
        if user is None:
            flash(email, 'email')
            flash('Email address has not unregistered yet.', 'unregistered')
            return redirect(url_for("signup"))
        token = user.get_reset_password_token(app.config["RESET_PASSWORD_TOKEN_EXPIRES_IN"]*60, type_token="reset-password")
        # return render_template("auth/email-reset-password.html", token=token, expires_in=app.config["RESET_PASSWORD_TOKEN_EXPIRES_IN"])
        try:
            send_email(subject="Reset your ZXZ account password",
                        sender=app.config["MAIL_USERNAME"],
                        recipients=[email], text_body="HELLO",
                        html_body=render_template("auth/email-reset-password.html", token=token, expires_in=app.config["RESET_PASSWORD_TOKEN_EXPIRES_IN"]))
            flash('Reset password request sent. Check your email.', 'mail-sent')
            flash(email, 'fill-email')
            return redirect(url_for("login"))
        except Exception as e:
            abort(HTTPStatus.INTERNAL_SERVER_ERROR)
    else:
        return render_template("auth/forgot-password.html")

@app.route('/reset-password/<token>', methods=["GET", "POST"])
@logout_required
def reset_password(token:str):
    user = User.verify_reset_password_token(token, type_token="reset-password")
    if user is None:
        flash('TOKEN IS INVALID OR EXPIRED.', 'invalid-reset-token')
        return redirect(url_for("forgot_password"))

    if request.method == "POST":
        new_password = request.form.get('password')
        if new_password is None:
            abort(400)
        try:
            # create new user with the form data. Hash the password so plaintext version isn't saved.
            user.change_password(new_password)
            # add the new user to the database
            db.session.commit()
            flash("Password has been successfully reset", 'change-password-successfully')
            return redirect(url_for("login"))
        except Exception as e:
            print(e)
            abort(500)
    else:
        flash(user.email, 'email')
        flash(user.username, 'username')
        return render_template("auth/reset-password.html", token=token)

@app.route('/login', methods=["GET", "POST"])
@logout_required
def login():
    if request.method == "POST":
        user_info = request.form.get('user_info').strip()
        password = request.form.get('password')
        remember = True if request.form.get('remember') else False

        if user_info == "anonymous" or user_info == "anonymous@zxz.com":
            flash("Permission denied", 'permission-denied')
            return redirect(url_for('login'))
        user = User.query.filter_by(email=user_info).first()
        if user is None:
            user = User.query.filter_by(username=user_info).first()

        # check if user actually exists
        # take the user supplied password, hash it, and compare it to the hashed password in database
        if user is None:
            flash('Please check your login details', 'unregistered')
            flash(user_info, 'user_info')
            flash(remember, 'remember')
            return redirect(url_for('login')) # if user doesn't exist or password is wrong, reload the page
        if not check_password_hash(user.password, password):
            flash('Password is incorrect. Retry again', 'incorrect-password')
            flash(user_info, 'user_info')
            flash(remember, 'remember')
            return redirect(url_for('login')) # if user doesn't exist or password is wrong, reload the page

        # if the above check passes, then we know the user has the right credentials
        login_user(user, remember=remember)
        flash("Welcome", 'logged-in')
        return redirect(url_for("fhost"))
    else:
        if db.session.query(User).count() <= 1:
            flash("", 'first-user')
            return redirect(url_for('signup'))
        else:
            return render_template("auth/login.html")

@app.route('/signup', methods=["GET", "POST"])
@logout_required
def signup():
    if request.method == "POST":
        username = request.form.get('username').strip()
        email = request.form.get('email').strip()
        password = request.form.get('password')

        user_existed = False
        if User.query.filter_by(username=username).first():
            user_existed = True
            flash('Username has already registered', 'username-registered')

        email_existed = False
        if User.query.filter_by(email=email).first():
            email_existed = True
            flash('Email address already exists', 'email-registered')

        if email_existed or user_existed:
            flash(username, 'username')
            flash(email, 'email')
            return redirect(url_for('signup'))

        try:
            # create new user with the form data. Hash the password so plaintext version isn't saved.
            new_user = User(username, email, password)
            new_user.activate_user()
            if db.session.query(User).count() <= 1:
                new_user.set_admin_role()
                new_user.confirm_email()

            # add the new user to the database
            db.session.add(new_user)
            db.session.commit()
            flash(username, 'signup-successfully')
            token = new_user.get_reset_password_token(app.config["ACTIVATE_EMAIL_TOKEN_EXPIRES_IN"]*60, type_token="activate-account")

            try:
                send_email(subject="Activate your ZXZ account",
                            sender=app.config["MAIL_USERNAME"],
                            recipients=[email], text_body="HELLO",
                            html_body=render_template("auth/email-activate-account.html", token=token, expires_in=app.config["ACTIVATE_EMAIL_TOKEN_EXPIRES_IN"]))
                flash('Activate account request sent. Check your email.', 'mail-sent')
            except Exception as e:
                print(e)
    
            flash(email, 'fill-email')
            return redirect(url_for("login"))
        except Exception as e:
            print(e)
            abort(500)
    else:
        if db.session.query(User).count() <= 1:
            flash("", 'first-user')
        return render_template('auth/signup.html')

@app.route('/logout', methods=["GET", "POST"])
@login_required
def logout():
    logout_user()
    return redirect(url_for('fhost'))

@app.route('/profile', methods=["GET", "POST"])
@login_required
@activate_required
def profile():
    return render_template("auth/profile.html")

@app.route('/change-password', methods=["POST"])
@login_required
@activate_required
def change_password():
    if request.method == "POST":
        current_password = request.form.get('current-password')
        new_password = request.form.get('new-password')
        if not check_password_hash(current_user.password, current_password):
            flash('Password is incorrect. Retry again', 'incorrect-password')
            abort(400)
        try:
            # create new user with the form data. Hash the password so plaintext version isn't saved.
            current_user.change_password(new_password)
            # add the new user to the database
            db.session.commit()
            flash("Password changed successfully", 'change-password-successfully')
            return "Password changed successfully", 200
        except Exception as e:
            print(e)
            abort(500)
    else:
        abort(403)

@app.route('/delete-account', methods=["POST"])
@login_required
@activate_required
def delete_account():
    if request.method == "POST":
        password = request.form.get('password')
        if not check_password_hash(current_user.password, password):
            flash('Password is incorrect. Retry again', 'incorrect-password')
            abort(400)
        try:
            user = User.query.get_or_404(current_user.id)
            logout_user()
            db.session.delete(user)
            db.session.commit()
            flash("Password changed successfully", 'change-password-successfully')
            return "Password changed successfully", 200
        except Exception as e:
            print(e)
            abort(500)
    else:
        abort(403)

@app.route('/update-profile', methods=["POST"])
@login_required
@activate_required
def update_profile():
    user = User.query.get_or_404(current_user.id)
    if request.method == "POST":
        username = request.form.get('username')
        if (username is not None) and (username != "") and (username != current_user.username):
            if User.query.filter_by(username=username).first():
                abort(409)
            else:
                user.username = username[: 255 if len(username) > 255 else len(username)]
        fullname = request.form.get('fullname')
        if (fullname is not None):
            user.fullname = fullname[: 255 if len(fullname) > 255 else len(fullname)]
        biography = request.form.get('biography')
        if (biography is not None):
            user.biography = biography[: 10000 if len(biography) > 10000 else len(biography)]
        website = request.form.get('website')
        if (website is not None):
            user.website = website[: 1000 if len(website) > 1000 else len(website)]
        location = request.form.get('location')
        if (location is not None):
            user.location = location[: 255 if len(location) > 255 else len(location)]
        visibility = request.form.get('visibility')
        if (visibility is not None):
            user.visibility = int(visibility)

        hide_email = request.form.get('hide-email')
        user.hide_email = hide_email is not None
        hide_activity = request.form.get('hide-activity')
        user.hide_activity = hide_activity is not None
        user.updated_at = datetime.datetime.utcnow()
        db.session.commit()
        try:
            return "Update profile successfully", 200
        except Exception as e:
            print(e)
            abort(500)
    else:
        abort(403)

@app.route("/<path:path>", methods=["GET", "POST"])
@app.route("/s/<secret>/<path:path>", methods=["GET", "POST"])
@activate_required
def get(path, secret=None):
    try:
        p = Path(path.split("/", 1)[0])
        sufs = "".join(p.suffixes[-2:])
        name = p.name[:-len(sufs) or None]

        if "." in name:
            abort(404)

        id = su.debase(name)
        if sufs:
            f = File.query.get(id)

            if f and f.ext == sufs:
                if f.secret != secret:
                    abort(404)

                if f.removed:
                    abort(451)

                fpath = f.getpath()

                if not fpath.is_file():
                    abort(404)

                if request.method == "POST":
                    return manage_file(f)

                if app.config["FHOST_USE_X_ACCEL_REDIRECT"]:
                    response = make_response()
                    response.headers["Content-Type"] = f.mime
                    response.headers["Content-Length"] = f.size
                    response.headers["X-Accel-Redirect"] = "/" + str(fpath)
                else:
                    response = send_from_directory(app.config["FHOST_STORAGE_PATH"], f.sha256, mimetype = f.mime, download_name=path)

                response.headers["X-Expires"] = f.expiration
                return response
        else:
            if request.method == "POST":
                abort(405)

            if "/" in path:
                abort(404)

            u = URL.query.get(id)
            if u:
                return redirect(u.url)

        abort(404)
    except OverflowError as e:
        print(e)
        abort(500)

@app.route("/", methods=["GET", "POST"])
@activate_required
def fhost():
    if request.method == "POST":
        sf = None
        if "file" in request.files:
            # Create a temporary directory to store the uploaded file
            temp_dir = tempfile.mkdtemp()
            try:
                # Get the file from the request
                file = request.files['file']
                # Generate a random filename
                temp_filename = next(tempfile._get_candidate_names())
                # Save the file to disk in chunks
                file_path = os.path.join(temp_dir, temp_filename)
                with open(file_path, 'wb') as f:
                    while True:
                        chunk = file.stream.read(8192)  # Read 8KB at a time
                        if not chunk:
                            break
                        else:
                            f.write(chunk)
                os.system(f"ls -lht {file_path}")
                
                # get expires and handle if if expires fields is NaN
                expires = None
                try:
                    if "expires" in request.form:
                        expires = int(request.form["expires"])
                except Exception as e:
                    print(e)
                
                # Store the file with the requested expiration date
                return store_file(
                    request.files["file"],
                    expires,
                    request.remote_addr,
                    request.user_agent.string,
                    slugify(request.form["secret"]) if ("secret" in request.form) else None,
                    file_path
                )
            except Exception as e:
                print(e)
                abort(int(str(e)[:3]))
            finally:
                if os.path.exists(temp_dir):
                    shutil.rmtree(temp_dir)
        elif "url" in request.form:
            return store_url(
                request.form["url"],
                request.remote_addr,
                request.user_agent.string,
                slugify(request.form["secret"]) if (("secret" in request.form)) else None
            )
        elif "shorten" in request.form:
            return shorten(request.form["shorten"])

        abort(400)
    else:
        return render_template("pages/index.html")

@app.route('/fetch-content', methods=["POST"])
@activate_required
def fetch_content():
    if request.method == "POST":
        url = request.form["url"]
        if len(HTTP_URL_PATTERN.findall(url))==0:
            url = os.path.join(f"http://localhost:{request.environ.get('SERVER_PORT')}", url)
        else:
            base_url = HTTP_URL_PATTERN.findall(request.url)
            if len(base_url) > 0:
                base_url = base_url[0]
                url = url.replace(base_url, f"http://localhost:{request.environ.get('SERVER_PORT')}")

        if not request.url:
            return jsonify({"error": "URL parameter is required"}), 400
        print("fetch-content:", url)
        try:
            response = requests.get(url)
            if response.status_code != 200:
                return "Failed to fetch file", response.status_code

            # Return the file content
            return response.text, 200
        except Exception as e:
            return jsonify({"error": str(e)}), 500

@app.route('/fetch-file', methods=["POST"])
def fetch_file():
    if request.method == "POST":
        url = request.form["url"]
        if len(HTTP_URL_PATTERN.findall(url))==0:
            url = os.path.join(f"http://localhost:{request.environ.get('SERVER_PORT')}", url)
        else:
            base_url = HTTP_URL_PATTERN.findall(request.url)
            if len(base_url) > 0:
                base_url = base_url[0]
                url = url.replace(base_url, f"http://localhost:{request.environ.get('SERVER_PORT')}")

        if not request.url:
            return jsonify({"error": "URL parameter is required"}), 400
        print("fetch-file:", url)
        try:
            response = requests.get(url)
            if response.status_code != 200:
                return "Failed to fetch file", response.status_code
            # Return the file content
            # return response.text, 200
            res_f = make_response(send_file(io.BytesIO(response.content), as_attachment=True, download_name=os.path.basename(url)))
            res_f.headers["Content-Type"] = response.headers["Content-Type"]
            return res_f
        except Exception as e:
            print(e)
            return jsonify({"error": str(e)}), 500

@app.route("/robots.txt")
def robots():
    return """User-agent: *
Disallow: /
"""

@app.errorhandler(400)
@app.errorhandler(401)
@app.errorhandler(403)
@app.errorhandler(404)
@app.errorhandler(405)
@app.errorhandler(409)
@app.errorhandler(411)
@app.errorhandler(413)
@app.errorhandler(414)
@app.errorhandler(415)
@app.errorhandler(451)
@app.errorhandler(500)
def ehandler(e):
    try:
        return render_template(f"errors/{e.code}.html", id=id, request=request), e.code
    except TemplateNotFound:
        return "Segmentation fault\n", e.code

@app.cli.command("prune")
def prune():
    """
    Clean up expired files

    Deletes any files from the filesystem which have hit their expiration time.  This
    doesn't remove them from the database, only from the filesystem.  It's recommended
    that server owners run this command regularly, or set it up on a timer.
    """
    current_time = time.time() * 1000;

    # The path to where uploaded files are stored
    storage = Path(app.config["FHOST_STORAGE_PATH"])

    # A list of all files who've passed their expiration times
    expired_files = File.query\
        .where(
            and_(
                File.expiration.is_not(None),
                File.expiration < current_time
            )
        )

    files_removed = 0;

    # For every expired file...
    for file in expired_files:
        # Log the file we're about to remove
        file_name = file.getname()
        file_hash = file.sha256
        file_path = storage / file_hash
        print(f"Removing expired file {file_name} [{file_hash}]")

        # Remove it from the file system
        try:
            os.remove(file_path)
            files_removed += 1;
        except FileNotFoundError:
            pass # If the file was already gone, we're good
        except OSError as e:
            print(e)
            print(
                "\n------------------------------------"
                "Encountered an error while trying to remove file {file_path}.  Double"
                "check to make sure the server is configured correctly, permissions are"
                "okay, and everything is ship shape, then try again.")
            return;

        # Finally, mark that the file was removed
        file.expiration = None;
    db.session.commit()

    print(f"\nDone!  {files_removed} file(s) removed")

""" For a file of a given size, determine the largest allowed lifespan of that file

Based on the current app's configuration:  Specifically, the MAX_CONTENT_LENGTH, as well
as FHOST_{MIN,MAX}_EXPIRATION.

This lifespan may be shortened by a user's request, but no files should be allowed to
expire at a point after this number.

Value returned is a duration in milliseconds.
"""
def get_max_lifespan(filesize: int) -> int:
    min_exp = app.config.get("FHOST_MIN_EXPIRATION", 30 * 24 * 60 * 60 * 1000)
    max_exp = app.config.get("FHOST_MAX_EXPIRATION", 365 * 24 * 60 * 60 * 1000)
    max_size = app.config.get("MAX_CONTENT_LENGTH", 256 * 1024 * 1024)
    return min_exp + int((-max_exp + min_exp) * (filesize / max_size - 1) ** 3)

def do_vscan(f):
    if f["path"].is_file():
        with open(f["path"], "rb") as scanf:
            try:
                f["result"] = list(app.config["VSCAN_SOCKET"].instream(scanf).values())[0]
            except:
                f["result"] = ("SCAN FAILED", None)
    else:
        f["result"] = ("FILE NOT FOUND", None)

    return f

@app.cli.command("vscan")
def vscan():
    if not app.config["VSCAN_SOCKET"]:
        print("""Error: Virus scanning enabled but no connection method specified.
Please set VSCAN_SOCKET.""")
        sys.exit(1)

    qp = Path(app.config["VSCAN_QUARANTINE_PATH"])
    qp.mkdir(parents=True, exist_ok=True)

    from multiprocessing import Pool
    with Pool() as p:
        if isinstance(app.config["VSCAN_INTERVAL"], datetime.timedelta):
            scandate = datetime.datetime.now() - app.config["VSCAN_INTERVAL"]
            res = File.query.filter(or_(File.last_vscan < scandate,
                                        File.last_vscan == None),
                                    File.removed == False)
        else:
            res = File.query.filter(File.last_vscan == None, File.removed == False)

        work = [{"path" : f.getpath(), "name" : f.getname(), "id" : f.id} for f in res]

        results = []
        for i, r in enumerate(p.imap_unordered(do_vscan, work)):
            if r["result"][0] != "OK":
                print(f"{r['name']}: {r['result'][0]} {r['result'][1] or ''}")

            found = False
            if r["result"][0] == "FOUND":
                if not r["result"][1] in app.config["VSCAN_IGNORE"]:
                    r["path"].rename(qp / r["name"])
                    found = True

            results.append({
                "id" : r["id"],
                "last_vscan" : None if r["result"][0] == "SCAN FAILED" else datetime.datetime.now(),
                "removed" : found})

        db.session.bulk_update_mappings(File, results)
        db.session.commit()
