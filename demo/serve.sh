#!/bin/bash

# run a server
node ../server/spot-server.js -c postgres://archsci@localhost/archsci -s iDarkSession.json
