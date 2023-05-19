#!/bin/bash

# Moving the start command to an entry point which always ensures
# that our upgrades happen

export FLASK_APP=fhost
export FLASK_ENV=production

flask db upgrade

flask run -h 0.0.0.0

