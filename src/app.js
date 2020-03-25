import { OpaVote } from './DAO/opavote.js'
import { OpaVoteElectionLogic } from './BLO/OpaVoteElection.js'
import { loadVoters } from './../config.js'
import { getLine } from './util.js'
import { MenuString } from './templates.js'

console.log("🦊 Welcome to the EA NTNU Opavote <-> Slack broker")

const voters = loadVoters()

async function main() {
    if(!await OpaVote.login()) {
        console.error("Could not login to OpaVote!")
        return false
    }
    
    while(true) {
        console.log(MenuString)

        let answer = await getLine()
        let args = answer.split(" ")

        if (answer.startsWith("1"))
            await OpaVoteElectionLogic(args[1], voters)
        else if (answer == "2") 
            break
    }
    
    return true
}

await main()

process.exit()