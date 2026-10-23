FROM python:3

RUN apt update && apt install -y \
    git\
    && rm -rf /var/lib/apt/lists/*

WORKDIR /usr/src/app

COPY requirements.txt ./
RUN python -m pip install --no-cache-dir "pip @ https://files.pythonhosted.org/packages/3f/06/3e4420302363fbb71be3c7f35ce042f54bfca330e3e66b3a2e3c4cca579f/pip-26.2.2-py3-none-any.whl#sha256=fd7f4dfa8190e014013b9f08f3e973f4e4c26ffd179a204895533a7254813a70"
RUN pip install --no-cache-dir -r requirements.txt
EXPOSE 8000
COPY . .

RUN mkdir ./xml && git clone --depth 1 --branch main --single-branch https://github.com/HakaiInstitute/hakai-metadata-entry-form-files.git ./xml

CMD ["gunicorn", "--access-logfile","-","-b","0.0.0.0:8000", "app:app"]