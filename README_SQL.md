# Server

spot server connects to a database using a connection string, can be 'localhost'.

## With metadata

it parses a session file for the available Datasets.

## Without metadata

spot-server scans all tables and constructs Datasets object
TODO: create table scanner ie '\d' command

## Data import tool

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

client connects to spot-server, and requests Datasets.
server sends the Datasets

## getData

client sends Datasets, the currently active Dataset, and the Filter
spot-server builds temporary table based on the Datasets / Dataset
spot-server executes query for the Filter on the temporary table

# Security concerns

## sql injection via `facet.accessor` and `dataset.datasetTable`

Facet accessor can be set by the client, and is used unchecked in the query.
Recommended to limit spot-server PostgreSQL privilege to read only.
See for instance (this blog post)[https://blog.ed.gs/2016/01/12/add-read-only-postgres-user/]
