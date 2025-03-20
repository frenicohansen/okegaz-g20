# --------- requirements ---------
FROM python:3.11 as requirements-stage

WORKDIR /tmp

RUN pip install poetry poetry-plugin-export

# Copy only necessary files for dependency resolution
COPY ./backend/pyproject.toml ./backend/poetry.lock* /tmp/

RUN poetry export -f requirements.txt --output requirements.txt --without-hashes

# --------- final image build ---------
FROM python:3.11

WORKDIR /code

# Copy dependencies from previous stage
COPY --from=requirements-stage /tmp/requirements.txt /code/requirements.txt

# Install dependencies
RUN pip install --no-cache-dir --upgrade -r /code/requirements.txt

# Copy the backend app
COPY ./backend/src/app /code/app

# -------- replace with comment to run with gunicorn --------
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8005", "--reload"]
# CMD ["gunicorn", "app.main:app", "-w", "4", "-k", "uvicorn.workers.UvicornWorker", "-b", "0.0.0.0:8005"]
    