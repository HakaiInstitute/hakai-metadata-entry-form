FROM python:3

RUN apt update && apt install -y \
    git\
    && rm -rf /var/lib/apt/lists/*

WORKDIR /usr/src/app

COPY requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt
EXPOSE 8000
COPY . .

RUN mkdir ./xml && git clone --depth 1 --branch main --single-branch https://github.com/HakaiInstitute/hakai-metadata-entry-form-files.git ./xml

CMD ["gunicorn", "--access-logfile","-","-b","0.0.0.0:8000", "app:app"]