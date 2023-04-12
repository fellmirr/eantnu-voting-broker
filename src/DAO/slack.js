import request from 'request-promise-native'
import { SLACK_API_TOKEN } from './../../config.js'

class Slack {
    /**
     * Posts a message from the bot to the specific channel
     * @param {string} channelID 
     * @param {Object} blocks https://api.slack.com/block-kit
     * @param {Object} attachments https://api.slack.com/messaging/composing/layouts#attachments
     * @returns {string|boolean} timestamp or failed
     */
    static async post(channelID, blocks, attachments = null) {
        let res = await request.post({
            url: 'https://slack.com/api/chat.postMessage',
            headers: {
                'Authorization': 'Bearer ' + SLACK_API_TOKEN,
                'Content-type': 'application/json'
            },
            body: JSON.stringify({
                token: SLACK_API_TOKEN,
                channel: channelID,
                text: "Kunne ikke vise blocks på din enhet",
                blocks,
                attachments,
                unfurl_links: false
            })
        })

        res = JSON.parse(res)

        console.info("Sent message to channel ID " + channelID)

        if (res.ok) return res.ts
        else return false
    }

    /**
     * Updates a message from the bot
     * @param {string} timestamp Used as a message id withing a channel (weirdly)
     * @param {string} channelID
     * @param {Object} blocks https://api.slack.com/block-kit
     * @param {Object} attachments https://api.slack.com/messaging/composing/layouts#attachments
     * @returns {boolean} success or failed
     */
    static async update(channelID, timestamp, blocks, attachments = null) {
        let res = await request.post({
            url: 'https://slack.com/api/chat.update',
            headers: {
                'Authorization': 'Bearer ' + SLACK_API_TOKEN,
                'Content-type': 'application/json'
            },
            body: JSON.stringify({
                token: SLACK_API_TOKEN,
                channel: channelID,
                ts: timestamp,
                text: "Kunne ikke vise blocks på din enhet",
                blocks,
                attachments,
                as_user: true
            })
        })

        res = JSON.parse(res)
        console.info("Updated message in channel " + channelID + " with ts " + timestamp)

        if (res.ok) return true
        else return false
    }
}

export { Slack }