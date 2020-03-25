# eantnu-voting-broker

Logs in to OpaVote and sends voting codes to all the people specified in the `config/voters` json files.

## Prerequisites

NodeJS 13.3 or greater

## Installation

`npm install`

## Configuration

You need to define the following environment variables for the application to run properly.

```
SLACK_CHANNEL_ID
SLACK_API_TOKEN
OPAVOTE_API_KEY
```

## Executing

`npm start dev`
or
`npm start prod`

Uses the voters.dev.json and voters.prod.json files respectively
