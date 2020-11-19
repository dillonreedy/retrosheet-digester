

/**
    xFIP formula - 
    xFIP = ((13*(Fly balls * lgHR/FB%))+(3*(BB+HBP))-(2*K))/IP + constant

    We want to capture number of fly balls given up
    
    FIP constant - 
    FIP Constant = lgERA – (((13*lgHR)+(3*(lgBB+lgHBP))-(2*lgK))/lgIP)

    See further description of events at retrosheet.org

**/


const eventDescs = require('./eventDescRegexes.js'); 

interpretEvent = (play) => {
    let parts = play.event.split('.');
    let modifiers = [];
    let desc = '';
    let baseAdvance = [];

    if (parts.length == 2)
    {
        modifiers = parts[0].split('/');
        desc = modifiers.shift();        
        baseAdvance = parts[1].split(';');    
    }
    else if (parts.length == 1)
    {
        modifiers = parts[0].split('/');
        desc = modifiers.shift();
    }
    else
    {
        console.log(`There are ${parts.length} parts to the event.`);
        throw new Error();
    }

    return {
        desc,
        modifiers,
        baseAdvance
    }
}

evaluatePitchingStats = (pitcherID, pitcherData, gameData) => {
    let flyOutRegex = /^\d{1,2}$/
    let hitRegex = /^(S|D|T)\d$/
    let doublePlayRegex = /^(\d\(\d\)\d)|(\d\d\(\d\)\d)$/
    let lineDoublePlayRegex = /^\d\(B\)\d\(\d\)$/
    let commonStatRegex = /^(HP|K|HR|H|W|NP|WP|I|IW)$/
    let thirdStrikeRunningPlay = /^K\+(SB(2|3|H)|CS(2|3|H)|OA|PO(2|3|H)|PB|WP|E)$/
    let flyBallRegex = /(L|F)/

    let playerEarnedRuns = gameData.find(x => x.playerID === pitcherID);

    let pitchingStats = {
        pitcherID,
        playerName: pitcherData.playerName.slice(1,-1),
        earnedRuns: playerEarnedRuns === undefined ? 0 : parseInt(playerEarnedRuns.earnedRuns)
    };

    
    const pitchingStatsProps = ['flyOuts', 'doublePlays', 'triplePlays', 'K', 'hits', 'HP', 'HR', 'H', 'W', 'I', 'IW', 'outs', 'NP', 'WP', 'DP', 'flyBalls'];
    
    pitchingStatsProps.forEach(prop => {
        pitchingStats[prop] = 0;
    })

    console.log(eventDescs);
    pitcherData.plays.forEach(play => {


    })

    pitcherData.plays.forEach(datum => {
        let playDesc = datum.desc;

        if (flyOutRegex.test(playDesc)) {
            pitchingStats.flyOuts++;
        } 
        else if (commonStatRegex.test(playDesc)) {
            pitchingStats[playDesc]++;
        }
        else if (hitRegex.test(playDesc)) {
            pitchingStats.hits++;
        }
        else if (doublePlayRegex.test(playDesc) || lineDoublePlayRegex.test(playDesc)) pitchingStats.doublePlays++;
        else if (thirdStrikeRunningPlay.test(playDesc)) {
            if (!/PB|WP/.test(playDesc)) pitchingStats.K++;
        }

        datum.modifiers.forEach(modifier => {
            if (flyBallRegex.test(modifier)) pitchingStats.flyBalls++;
        })
        
        datum.baseAdvance.forEach(baseAdvancement => {
            if (baseAdvancement.includes('X')) pitchingStats.outs++;
        })

    })

    pitchingStats.hits += pitchingStats.HR + pitchingStats.H;
    pitchingStats.outs += pitchingStats.flyOuts+(pitchingStats.doublePlays*2)+pitchingStats.K;

    pitchingStats['inningsPitched'] = pitchingStats.outs/3;
    pitchingStats['battersFaced'] = pitcherData.plays.length-pitchingStats.NP-pitchingStats.WP;
    pitchingStats['gameERA'] = 9*(pitchingStats.earnedRuns / pitchingStats.inningsPitched);

    return pitchingStats;
}


getGameStatsData = (gameData) => {
    let currentPlayers = gameData['start'];

    let playData = gameData.play.concat(gameData.sub[0]).concat(gameData.sub[1]);

    playData.sort((a,b) => a.eventID - b.eventID);

    let pitchingPlays = {};

    playData.forEach(play => {
        if (play.isSub) currentPlayers[play.isHome][play.fieldingPosition] = play;
        else {
            let interpretedPlay = interpretEvent(play);
            let pitchingTeam = play.isHomeBatting === '1' ? '0' : '1';
            let currentPitcher = currentPlayers[pitchingTeam][1];

            if (pitchingPlays[currentPitcher.playerID] === undefined) pitchingPlays[currentPitcher.playerID] = { plays: [], playerName: currentPitcher.playerName};

            pitchingPlays[currentPitcher.playerID].plays.push(interpretedPlay);
        }
    });

    // let pitcherID = 'dowdk001';
    // evaluatePitchingStats(pitcherID, pitchingPlays[pitcherID], gameData['data'])

    return Object.keys(pitchingPlays).map(pitcherID => {
        return evaluatePitchingStats(pitcherID,  pitchingPlays[pitcherID], gameData['data']);
    })
}

module.exports = {
    getGameStatsData
}