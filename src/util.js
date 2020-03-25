import readline from 'readline'

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

export const getLine = (function () {
    const getLineGen = (async function* () {
        for await (const line of rl) {
            yield line;
        }
    })();
    return async () => ((await getLineGen.next()).value);
})();

export const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms))