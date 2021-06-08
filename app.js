import axios from 'axios';
import rateLimit from 'axios-rate-limit';
import fs from 'fs'

const client = rateLimit(axios.create(), { maxRequests: 1, perMilliseconds: 1000 })

async function getLeaderBoard(country) {
    const res = await client.get(`https://ch.tetr.io/api/users/lists/league/all?country=${country}`);
    return res.data.data.users;
}

async function getUserRecords(userId) {

    let sprintTime = null;
    let blitzScore = null;

    const res = await client.get(`https://ch.tetr.io/api/users/${userId}/records`);

    try {
        sprintTime = res.data.data.records["40l"].record.endcontext.finalTime
    } catch { }

    try {
        blitzScore = res.data.data.records.blitz.record.endcontext.score
    } catch { }

    return {
        sprint: sprintTime,
        blitz: blitzScore
    };
}

async function createSoloLeadderBoard() {

    let sprintLeaderboard = [];
    let blitzLeaderboard = [];

    const frenchPlayers = (await getLeaderBoard("FR"));

    for (const player of frenchPlayers) {
        const playerRecords = await getUserRecords(player["_id"]);
        console.log(`fetched records for player ${player.username}`);

        if (playerRecords.sprint) {
            sprintLeaderboard.push({
                player: player.username,
                time: playerRecords.sprint
            });
        }

        if (playerRecords.blitz) {
            blitzLeaderboard.push({
                player: player.username,
                score: playerRecords.blitz
            })
        }

    }

    sprintLeaderboard.sort((a, b) => a.time - b.time);
    blitzLeaderboard.sort((a, b) => b.score - a.score);

    return {
        sprintLeaderboard,
        blitzLeaderboard
    }

}

createSoloLeadderBoard().then(res => {
    fs.writeFile("leaderboard.json", JSON.stringify(res), err => {
        if (err) {
            console.log(err)
        }
    });
    console.log('all done :)');
});
