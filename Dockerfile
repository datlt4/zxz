FROM python:3.11-slim-buster
ENV DEBIAN_FRONTEND noninteractive

WORKDIR /python-docker

ENV FLASK_APP=fhost
ENV FLASK_ENV=production

COPY requirements.txt requirements.txt
RUN apt update && apt install -y libmagic-dev && apt clean
RUN pip3 install -r requirements.txt

COPY . .
RUN cp instance/config.example.py instance/config.py && \
    sed -i "s/^SQLALCHEMY_DATABASE_URI = .*/SQLALCHEMY_DATABASE_URI = \'sqlite:\/\/\/\/python-docker\/fhost_db.sql\/fhost.db\'/" "instance/config.py" && \
    sed -i "s/^MAX_CONTENT_LENGTH = .*/MAX_CONTENT_LENGTH = 512 \* 1024 \* 1024/" "instance/config.py" && \
    sed -i "s/^FHOST_MIN_EXPIRATION = .*/FHOST_MIN_EXPIRATION = 14  \* 24 \* 60 \* 60 \* 1000/" "instance/config.py" && \
    sed -i "s/^FHOST_STORAGE_PATH = .*/FHOST_STORAGE_PATH = \"\/files\"/" "instance/config.py"

CMD [ "/bin/bash", "entrypoint.sh" ]
