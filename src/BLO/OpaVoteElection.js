import { Slack } from '../DAO/slack.js'
import { OpaVote } from '../DAO/opavote.js'
import { getLine, sleep } from '../util.js'
import { VoteBotElectionButton, ElectionStatusBlocks, ElectionResultBlocks, VoteBotBlocks } from '../templates.js'
import { SLACK_CHANNEL_ID } from '../../config.js'

export const OpaVoteElectionLogic = async (electionID, voters) => {
    let nvotes = 0
    let nvoters = voters.length

    /**
     * Make sure OpaVotes generates the same amount of codes as the number of voters
     */
    await OpaVote.setNumberOfCodes(electionID, nvoters)
    
    /**
     * Fetch metadata from the election to use in slack messages
     */
    let title = await OpaVote.getElectionTitle(electionID)
    
    /**
     * Start the election
     */
    let codes = await OpaVote.startVoting(electionID)
    for(let i = 0; i < nvoters; i++) {
        //Send every voter a button to vote
        try {
            await Slack.post(voters[i].id, VoteBotBlocks(title), VoteBotElectionButton(electionID, codes[i]));
            //Guard against API rate limitation
            await sleep(100)
        }
        catch(ex) {
            console.error(`Failed to send code ${codes[i]} to ${voters[i].real_name} (${voters[i].name})`)
        }
    }

    /**
     * Posts the initial status message to the public slack channel 
     */
    let statusMessageTimestamp = await Slack.post(SLACK_CHANNEL_ID, ElectionStatusBlocks(title, nvotes, nvoters))

    /**
     * Checks every three seconds if new votes are in
     * Updates the slack status message if so
     */
    while (nvotes != nvoters) {
        let newnvotes = await OpaVote.getNumberOfVotes(electionID)
        if (nvotes != newnvotes) {
            nvotes = newnvotes
            await Slack.update(SLACK_CHANNEL_ID, statusMessageTimestamp, ElectionStatusBlocks(title, nvotes, nvoters))
        }
        
        await sleep(3000)
    }

    //The number of votes is now equal to the number of voters, we can safely end the election
    try {
        await OpaVote.stopVoting(electionID)
    }
    catch(ex) {
        console.log(ex)
        console.error("Failed to stop election. Please intervene manually. Press enter to continue.")
        await getLine()
    }
    

    /**
     * It takes a couple of seconds for OpaVote to generate the results
     */
    await sleep(2000)

    let summary
    try {
        summary = await OpaVote.getResults(electionID)
    }
    catch(ex) {
        console.error(ex)
        summary = "Klarte ikke hente resultater automatisk. Klikk på linken."
    }
    
    /**
     * Posts the results to the public slack channel
     */
    await Slack.post(SLACK_CHANNEL_ID, ElectionResultBlocks(summary, electionID))
    
    console.log("--- Election complete ---")
}