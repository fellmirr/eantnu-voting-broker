import request from 'request-promise-native'
import jsdom from 'jsdom';
import { OPAVOTE_API_KEY } from '../../config.js'

const { JSDOM } = jsdom
const cookieJar = request.jar()

class OpaVote {
    static loggedIn = false;
    static #electionsFormData = {};

    static async login() {
        try {
            let res = await request.get({
                url: `https://www.opavote.com/key-login?key=${OPAVOTE_API_KEY}`,
                jar: cookieJar
            })

            this.loggedIn = true;
        }
        catch(ex) {
            console.error(`Failed to login to OpaVote`)
            this.loggedIn= false;
        }

        return this.loggedIn;
    }

    /**
     * Starts an election. This is not reversable, once election is started you cannot retrieve codes!
     * @param {string} electionID 
     * @returns {Array<String>} Election voting codes
     */
    static async startVoting(electionID) {
        if (this.#electionsFormData[electionID] == null) await this.fethcElectionFormData(electionID);

        let codes = await this.getElectionCodes(electionID)

        let data = {
            ...this.#electionsFormData[electionID],
            "submit": "start-voting"
        }

        try {
            let res = await request.post({
                url: `https://www.opavote.com/manage/${electionID}`,
                jar: cookieJar,
                formData: data
            })
        }
        catch(ex) {
            //302 redirect, is a success, otherwise throw
            if (ex.statusCode !== 302)
                throw ex
        }

        return codes;
    }
    
     /**
      * Stops the voting
      * @param {string} electionID 
      * @returns {boolean}
      */
     static async stopVoting(electionID) {
        await this.fetchCsrfToken(electionID)

        let data = {
            "csrf_token": this.#electionsFormData[electionID]["csrf_token"],
            "status": "VOTING",
            "email_txt": "",
            "email_text": "",
            "n_codes": 0,
            "submit": "stop-voting"
        }

        try {
            let res = await request.post({
                url: `https://www.opavote.com/manage/${electionID}`,
                jar: cookieJar,
                formData: data
            })
        }
        catch(ex) {
            //302 redirect, is a success, otherwise throw
            if (ex.statusCode !== 302)
                throw ex
        }

        return true
    }

    /**
     * Sets the number of codes available for voting
     * @param {string} electionID
     * @param {number} n Number of codes to generate
     * @returns {Array<string>} The election codes
     */
    static async setNumberOfCodes(electionID, n) {
        if (this.#electionsFormData[electionID] == null) await this.fethcElectionFormData(electionID);

        let data = {
            ...this.#electionsFormData[electionID],
            "n-code-voters": n,
            "submit": "change-code-voters"
        }

        try {
            let res = await request.post({
                url: `https://www.opavote.com/manage/${electionID}`,
                jar: cookieJar,
                formData: data
            })
        }
        catch(ex) {
            //302 redirect, is a success, otherwise throw
            if (ex.statusCode !== 302)
                throw ex
        }

        await this.fethcElectionFormData(electionID);
        return this.getElectionCodes(electionID);
    }

    /**
     * Fetches the election codes for a given election
     * @param {string} electionID 
     * @returns {Array<String>} Election voting codes
     */
    static async getElectionCodes(electionID) {
        let res = await request.get({
            url: `https://www.opavote.com/manage/${electionID}/codes-text`,
            jar: cookieJar
        })

        return res.trim().split("\n")
    }

    /**
     * Gets number of votes in an active election
     * @param electionID 
     * @returns {number} Number of votes
     */
    static async getNumberOfVotes(electionID) {
        let DOMstring = await request.get({
            url: `https://www.opavote.com/manage/${electionID}/voted`,
            jar: cookieJar
        })

        let DOM = new JSDOM(DOMstring)

        return DOM.window.document.querySelectorAll(".voter-columns ul li").length
    }

    /**
     * Gets the title of an election
     * @param {string} electionID 
     * @returns {string}
     */
    static async getElectionTitle(electionID) {
        if (this.#electionsFormData[electionID] == null) await this.fethcElectionFormData(electionID);

        return this.#electionsFormData[electionID].title;
    }


    /**
     * Gets election result
     * @param {string} electionID 
     * @returns {string} Summary of the results
     */
    static async getResults(electionID) {
        let DOMstring = await request.get({
            url: `https://www.opavote.com/results/${electionID}`,
            jar: cookieJar
        })

        let DOM = new JSDOM(DOMstring)

        let summary = Array.from(DOM.window.document.getElementsByTagName("h3")).find((el) => el.innerHTML == "Summary").nextElementSibling.innerHTML
        let winner = Array.from(DOM.window.document.getElementsByTagName("h3")).find((el) => el.innerHTML == "Winners").nextElementSibling.innerHTML

        if (summary.indexOf("Plurality/FPTP/SNTV") != -1) {
            let results = JSON.parse(await request.get(`https://www.opavote.com/reports/${electionID}/0?style=json`, {jar: cookieJar}))

            summary += results.candidates.map((candidate, index) => (`${candidate.padEnd(10)} - ${results.count[index]} stemmer | ~ ${((results.count[index]/results.n_votes)*100).toFixed(2)}%`)).join(`
`)
        }

        return `*${winner}*
\`\`\`${summary}\`\`\``
    }

    /**
     * Utility
     */

    static async fethcElectionFormData(electionID) {
        let res = await request.get({
            url: `https://www.opavote.com/manage/${electionID}`,
            jar: cookieJar
        })

        this.updateElectionFormData(electionID, res);
    }

    static updateElectionFormData(electionID, DOMstring) {
        let DOM = new JSDOM(DOMstring);

        let csrf = DOM.window.document.getElementById("csrf_token").getAttribute("value");
        let title = DOM.window.document.getElementById("title").getAttribute("value");
        let desc = DOM.window.document.getElementById("desc").innerHTML;
        let candidates = DOM.window.document.getElementById("contests-0-candidates").innerHTML;

        let n_seats = DOM.window.document.getElementById("contests-0-n_seats").value;
        let method = DOM.window.document.getElementById("contests-0-method").value;
        let ballot_type = DOM.window.document.getElementById("contests-0-ballot_type").value;
        let shuffle = DOM.window.document.getElementById("contests-0-shuffle_cand").value;


        this.#electionsFormData[electionID] = {
            "csrf_token": csrf,
            "stripeToken": "",
            "status": "EDITING",
            "expert": "True",
            "tab": "info",
            "title": title,
            "desc": desc,
            "language": "English",
            "show_results": "no",
            "auto_remind": "no",
            "anonymous": "yes",
            "contests-0-title": "Contest Title",
            "contests-0-candidates": candidates,
            "contests-0-method": method,
            "contests-0-ballot_type": ballot_type,
            "contests-0-require_full": "no",
            "contests-0-n_seats": n_seats,
            "contests-0-shuffle_cand": shuffle,
            "voter_list": "",
            "weights": "",
            "order-0": "",
            "voter-list": "",
            "n-code-voters": "0"
        }
    }

    static async fetchCsrfToken(electionID) {
        let res = await request.get({
            url: `https://www.opavote.com/manage/${electionID}`,
            jar: cookieJar
        })

        this.updateCsrfToken(electionID, res);
    }

    static updateCsrfToken(electionID, DOMstring) {
        let DOM = new JSDOM(DOMstring);

        let csrf = DOM.window.document.getElementById("csrf_token").getAttribute("value");

        this.#electionsFormData[electionID]["csrf_token"] = csrf;
    }
}

export { OpaVote }