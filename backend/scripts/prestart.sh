#! /usr/bin/env bash

set -e
set -x

# Let the DB start (wait for Postgres to be ready)
python scripts/backend_pre_start.py

# Initialize database schema and seed initial data
python scripts/initial_data.py
