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

1. Read a file from local file system
2. create Facets
  a. using scanData
  b. by parsing a saved session
3. Export the data to CSV so that it is a valid file for postgres
4. Create database table where the columns and their types correspond to the Facets
5. Perform a COPY FROM
6. If present, update the metadata table

# Client

## Connect

client connects to spot-server, server sends Datasets object

## getData

client sends Datasets, the currently active Dataset, and the Filter
spot-server builds temporary table based on the Datasets / Dataset
spot-server executes query for the Filter on the temporary table

