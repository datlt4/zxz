FROM python:3.11-slim-buster

WORKDIR /python-docker

ENV FLASK_APP=fhost
ENV FLASK_ENV=production

COPY requirements.txt requirements.txt
RUN apt update && apt install -y libmagic-dev && apt clean
RUN pip3 install -r requirements.txt

COPY . .

CMD [ "/bin/bash", "entrypoint.sh" ]
