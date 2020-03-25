import fs from 'fs'

export const SLACK_CHANNEL_ID = process.env.SLACK_CHANNEL_ID
export const SLACK_API_TOKEN = process.env.SLACK_API_TOKEN
export const OPAVOTE_API_KEY = process.env.OPAVOTE_API_KEY

/**
 * @typedef Voter
 * @property {number} id
 * @property {string} name Username in slack
 * @property {string} real_name Full name
 */

/**
 * Loads the active voters (slack users) from a JSON file
 * @returns {Array<Voter>}
 */
export const loadVoters = () => {
    if (process.env.NODE_ENV === "production")
        return JSON.parse(fs.readFileSync('config/voters.prod.json'))
    else
        return JSON.parse(fs.readFileSync('config/voters.dev.json'))
}