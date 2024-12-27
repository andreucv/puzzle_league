FROM python:3

RUN apt-get update && apt-get upgrade -y \
    openssl

WORKDIR /workspace/puzzle_league_backend
COPY requirements.txt .
RUN pip install --trusted-host=pypi.python.org --trusted-host=pypi.org --trusted-host=files.pythonhosted.org -r requirements.txt
