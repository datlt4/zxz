The First Pointer
=================

This is a no-bullshit file hosting service that also runs
# `0x1a.ro <https://0x1a.ro>`_, which was forked from the wonderful `0x0.st <https://0x0.st>`
`0x0.dat <192.168.120.103:8000>`_ which was merged `0x1a.ro <https://0x1a.ro>` and the wonderful `0x0.st <https://0x0.st>`

<details>
  <summary>Click to expand</summary>

Configuration
-------------

To change settings, copy ``config.py.example`` to ``instance/config.py`` and modify to your liking.
For more information on instance configuration, see `the Flask documentation <https://flask.palletsprojects.com/en/2.0.x/config/#instance-folders>`_.

To customize the home and error pages, create a ``templates`` directory
in your instance directory and copy any templates you want to modify there.

If you are running nginx, you should use the ``X-Accel-Redirect`` header.
To make it work, include this in your nginx config’s ``server`` block::

    location /up {
        internal;
    }

where ``/up`` is whatever you’ve configured as ``FHOST_STORAGE_PATH``.

For all other servers, set ``FHOST_USE_X_ACCEL_REDIRECT`` to ``False`` and
``USE_X_SENDFILE`` to ``True``, assuming your server supports this.
Otherwise, Flask will serve the file with chunked encoding, which has several
downsides, one of them being that range requests will not work. This is a
problem for example when streaming media files: It won’t be possible to seek,
and some ISOBMFF (MP4) files will not play at all.

To make files expire, simply run ``FLASK_APP=fhost flask prune`` every
now and then. You can use the provided systemd unit files for this::

    0x0-prune.service
    0x0-prune.timer

Make sure to edit them to match your system configuration. In particular,
set the user and paths in ``0x0-prune.service``.

Before running the service for the first time and every time you update it
from this git repository, run ``FLASK_APP=fhost flask db upgrade``.


Moderation UI
-------------

.. image:: modui.webp
  :height: 300

0x0 features a TUI program for file moderation. With it, you can view a list
of uploaded files, as well as extended information on them. It allows you to
take actions like removing files temporarily or permanently, as well as
blocking IP addresses and associated files.

If a sufficiently recent version of python-mpv with libmpv is present and
your terminal supports it, you also get graphical file previews, including
video playback. Upstream mpv currently supports sixels and the
`kitty graphics protocol <https://sw.kovidgoyal.net/kitty/graphics-protocol/>`_.
For this to work, set the ``MOD_PREVIEW_PROTO`` option in ``instance/config.py``.

Requirements:

* `Textual <https://textual.textualize.io/>`_

Optional:

* `python-mpv <https://github.com/jaseg/python-mpv>`_
  (graphical previews)
* `PyAV <https://github.com/PyAV-Org/PyAV>`_
  (information on multimedia files)
* `PyMuPDF <https://github.com/pymupdf/PyMuPDF>`_
  (previews and file information for PDF, XPS, EPUB, MOBI and FB2)
* `libarchive-c <https://github.com/Changaco/python-libarchive-c>`_
  (archive content listing)

.. note::
    `Mosh <https://mosh.org/>`_ currently does not support sixels or kitty graphics.

.. hint::
    You may need to set the ``COLORTERM`` environment variable to
    ``truecolor``.

.. tip::
    Using compression with SSH (``-C`` option) can significantly
    reduce the bandwidth requirements for graphics.

Docker Build & Run
------------------
block::

    docker build . -t 0x1a:latest

Then run with Docker-Compose block::

    version: "3"
    services:
      "0x1a":
        image: 0x1a:latest
          container_name: "0x1a"
            volumes:
              - ./upload:/files
              - ./instance:/python-docker/instance
              - ./fhost_db.sql:/python-docker/fhost_db.sql



NSFW Detection
--------------

0x0 supports classification of NSFW content via Yahoo’s open_nsfw Caffe
neural network model. This works for images and video files and requires
the following:

* Caffe Python module (built for Python 3)
* `PyAV <https://github.com/PyAV-Org/PyAV>`_


Virus Scanning
--------------

0x0 can scan its files with ClamAV’s daemon. As this can take a long time
for larger files, this does not happen immediately but instead every time
you run the ``vscan`` command. It is recommended to configure a systemd
timer or cronjob to do this periodically. Examples are included::

    0x0-vscan.service
    0x0-vscan.timer

Remember to adjust your size limits in clamd.conf, including
``StreamMaxLength``!

This feature requires the `clamd module <https://pypi.org/project/clamd/>`_.


Network Security Considerations
-------------------------------

Keep in mind that 0x0 can fetch files from URLs. This includes your local
network! You should take precautions so that this feature cannot be abused.
0x0 does not (yet) have a way to filter remote URLs, but on Linux, you can
use firewall rules and/or namespaces. This is less error-prone anyway.

For instance, if you are using the excellent `FireHOL <https://firehol.org/>`_,
it’s very easy to create a group on your system and use it as a condition
in your firewall rules. You would then run the application server under that
group.

</details>

# My Tutorials

## Install in native environment

1. Create new config gile

  - Copy `instance/config.example.py` and place in `instance` with new name `config.py`

     ```bash
     cp instance/config.example.py instance/config.py
     ```

  - Config sqlite database's absolute path.

     ```bash
     SQLALCHEMY_DATABASE_URI = 'sqlite:////home/emoi/Downloads/Miscellaneous/zxz/fhost_db.sql/fhost.db'
     ```

  - Config maximum size of upload files

     ```bash
     MAX_CONTENT_LENGTH = 512 * 1024 * 1024
     ```

  - Update maximum and minimum expiration time

     ```bash
     FHOST_MIN_EXPIRATION = 14  * 24 * 60 * 60 * 1000
     FHOST_MAX_EXPIRATION = 365 * 24 * 60 * 60 * 1000
     ```

  - Config storage path

     ```bash
     FHOST_STORAGE_PATH = "/home/emoi/Downloads/Miscellaneous/zxz/uploads"
     ```

  - Config preview protocol

     ```bash
     MOD_PREVIEW_PROTO = "sixel"
     ```

  - Config server name

     ```
     SERVER_NAME = "127.0.0.1:5000"
     ```

  - All commands

     ```bash
     cp instance/config.example.py instance/config.py
     mkdir -p fhost_db.sql uploads
     sed -i "s|^SQLALCHEMY_DATABASE_URI = .*|SQLALCHEMY_DATABASE_URI = \'sqlite:\/\/\/`pwd`\/fhost_db.sql\/fhost.db\'|" "instance/config.py"
     sed -i "s|^MAX_CONTENT_LENGTH = .*|MAX_CONTENT_LENGTH = 512 \* 1024 \* 1024|" "instance/config.py"
     sed -i "s|^FHOST_MIN_EXPIRATION = .*|FHOST_MIN_EXPIRATION = 14  \* 24 \* 60 \* 60 \* 1000|" "instance/config.py"
     sed -i "s|^FHOST_MAX_EXPIRATION = .*|FHOST_MAX_EXPIRATION = 365 \* 24 \* 60 \* 60 \* 1000|" "instance/config.py"
     sed -i "s|^FHOST_STORAGE_PATH = .*|FHOST_STORAGE_PATH = \"`pwd`\/uploads\"|" "instance/config.py"
     sed -i "s|^FHOST_USE_X_ACCEL_REDIRECT = .*|FHOST_USE_X_ACCEL_REDIRECT = False|" "instance/config.py"
     # sed -i "s|.*MOD_PREVIEW_PROTO = .*|MOD_PREVIEW_PROTO = \"sixel\"|" "instance/config.py"
     # sed -i "s|.*SERVER_NAME = .*|SERVER_NAME = \"127.0.0.1:5000\"|" "instance/config.py"
     ```

2. Install all dependencies

  - Install ubuntu packages

     ```bash
     sudo apt update
     sudo apt install -y libmagic-dev
     sudo apt clean
     ```

  - Install python dependencies

     ```bash
     python3 -m pip install -r requirements.txt
     ```

3. Start service

  - Run

     ```bash
     export FLASK_APP=fhost
     export FLASK_ENV=production
     flask db upgrade
     flask run -h 0.0.0.0

     # flask run -h 0.0.0.0 [-p 8003] [--debug] [--cert=adhoc]
     ```
  
  - Create migration
    
     ```bash
     export FLASK_APP=fhost
     export FLASK_ENV=production
     flask db migrate -m "Create user table"
     ```

## Install in docker

1. Start service

```bash
bash ./zxz_tools.sh
```

2. Rebuild service

```bash
bash ./zxz_tools.sh --build
```

3. Restart service

```bash
bash ./zxz_tools.sh --restart
```

4. Backup

```bash
bash ./zxz_tools.sh -b
```

5. Restore

```bash
bash ./zxz_tools.sh -r
bash ./zxz_tools.sh -r <backup_id>
```
