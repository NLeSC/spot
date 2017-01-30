# Server

spot server connects to a database
TODO: spot-server needs connection string
and looks for a metadata table

## With metadata

TODO: read metadata table
spot-server reads metadata table, constructs Datasets object

## Without metadata

spot-server scans all tables and constructs Datasets object
TODO: create table scanner ie '\d' command

## Create metadata

### Metadata table

table name: spot_meta_data
name: text
description: text
facets: JSON

TODO: create metadata table
TODO: populate metadata table from a saved session
TODO: update metadata table using a saved session

### Data import tool

Commandline tool to insert a dataset in the database.

1. Import a file from local file system
2. create Facets
  a. using scanData
  b. TODO: by parsing a saved session
3. Validate / normalize contents using the crossfilter dataset
4. Create database table where the columns and their types correspond to the Facets. TODO: mapping to best SQL types
5. Perform a COPY FROM and stream into the database
6. TODO: If present, update the metadata table

# Client

## Connect

client connects to spot-server, server sends Datasets object

## getData

client sends Datasets, the currently active Dataset, and the Filter
spot-server builds temporary table based on the Datasets / Dataset
spot-server executes query for the Filter on the temporary table

# Security concerns

## sql injection via `facet.accessor`

Facet accessor can be set by the client, and is used unchecked in the query.
Recommended to limit spot-server PostgreSQL privilege to read only.
See for instance (this blog post)[https://blog.ed.gs/2016/01/12/add-read-only-postgres-user/]
