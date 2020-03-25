export const MenuString = `
Menu
    1. Run OpaVote election (arg: electionID)
    2. Exit
Input your menu choice followed by any arguments
`

export const VoteBotBlocks = (title) => ([
    {
        "type": "section",
        "text": {
            "type": "mrkdwn",
            "text": `:ballot_box_with_ballot: Stem i valget \`${title}\``
        }
    }
]) 

export const VoteBotElectionButton = (electionID, code) => ([{
    "fallback": "Stem hos OpaVote `https://www.opavote.com/vote/${electionID}?c=${code}`",
    "actions": [
        {
            "type": "button",
            "name": "vote_button",
            "text": "Stem hos OpaVote",
            "url": `https://www.opavote.com/vote/${electionID}?c=${code}`,
            "style": "primary"
        }
    ]
}])

export const ElectionStatusBlocks = (title, nvotes, nvoters) => ([
    {
        "type": "divider"
    },
    {
        "type": "section",
        "text": {
            "type": "mrkdwn",
            "text": `:ballot_box_with_ballot: \`${title}\` har startet`
        }
    },
    {
        "type": "section",
        "text": {
            "type": "mrkdwn",
            "text": `> Har mottatt *${nvotes}* av *${nvoters}* stemmer.`
        }
    }
])

export const ElectionResultBlocks = (summary, electionID) => ([
    {
        "type": "section",
        "text": {
            "type": "plain_text",
            "text": ":dancer: Tada! :tada:",
            "emoji": true
        }
    },
    {
        "type": "section",
        "text": {
            "type": "mrkdwn",
            "text": `> ${summary}`
        }
    },
    {
        "type": "context",
        "elements": [
            {
                "type": "mrkdwn",
                "text": `<https://www.opavote.com/results/${electionID}| Se resultater og detaljert nedbrytning hos OpaVote>`
            }
        ]
    },
    {
        "type": "divider"
    }
])