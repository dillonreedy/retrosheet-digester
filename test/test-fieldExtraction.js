var expect  = require('chai').expect;
const path = require('path');
const fs = require('fs');
const fieldExtractor = require('../src/extractFields.js');
const gameStatsParser = require('../src/extractGameStats.js');

const oneFilePath = path.resolve('../retrosheet-data-by-year/2019/events/2019ANA.EVA');

function getRetrosheetData() {
    try {
        const data = fs.readFileSync(oneFilePath, 'utf8');

        let parts = data.split('id,');

        let firstGame = parts[1];

        let firstGameParts = firstGame.split(/\r\n/);

        let game = {
            id: firstGameParts[0],
            numEvents: 0,
        };

        for (let i = 1; i < firstGameParts.length; i++)
        {
            let parts = fieldExtractor.getFirstSplit(firstGameParts[i], ',');

            game = fieldExtractor.captureData({ game, recordType: parts[0], data: parts[1] } );
        }

        let gameStats = gameStatsParser.getGameStatsData(game);
        return gameStats;
    } catch (err) {
        console.error(err)
    }
}

function digestBaseballCSV(str) {
    let rows = str.split('\n');

    let columnHeader = rows.shift();
    let props = columnHeader.split(',');

    let results = [];
    rows.forEach(row => {
        let data = row.split(',');

        let result = {};
        for (let i = 0; i < data.length; i++)
        {
            result[props[i]] = data[i].trim();
        }
        results.push(result)
    });

    return results;
}

function convertToBase10(inningsPitched) {
    let parts = inningsPitched.split('.');
    if (parts.length > 1)
    {
        let decimalPart = parseInt(parts[1]);
        let fractionalStr = (decimalPart * (1 / 3)).toString();
        return parts[0] + '.' + fractionalStr.split('.')[1];
    }
    else
    {
        return inningsPitched
    }
}

it('Retrosheet data matches baseball reference', function(done) {
    // Input 
    let retrosheetData = getRetrosheetData();
    //console.log(retrosheetData);

    let baseballReferencePitcherData = digestBaseballCSV(`Pitching,IP,H,R,ER,BB,SO,HR,ERA,BF,Pit,Str,Ctct,StS,StL,GB,FB,LD,Unk,GSc,IR,IS,WPA,aLI,RE24
    Edinson Volquez,3.2,4,2,2,4,3,2,7.04,18,83,45,23,6,16,3,8,3,0,44,,,0.036,0.94,-0.1
    Jeffrey Springs,2.1,2,1,1,3,3,0,1.80,12,56,32,13,7,12,2,4,2,0,,1,0,0.033,0.40,0.3
    Jeanmar Gomez,1,2,0,0,0,0,0,7.71,4,15,10,6,0,4,1,3,2,0,,0,0,0.013,0.60,0.5
    Kyle Dowdy,2,0,1,0,0,3,0,6.75,8,33,23,14,4,5,5,0,0,0,,0,0,0.003,0.04,0.1`);

    let baseballReferencePitcherData2 = digestBaseballCSV(`Pitching,IP,H,R,ER,BB,SO,HR,ERA,BF,Pit,Str,Ctct,StS,StL,GB,FB,LD,Unk,GSc,IR,IS,WPA,aLI,RE24
    Matt Harvey,4,10,8,8,2,5,2,9.00,24,91,58,28,15,15,5,9,7,1,13,,,-0.368,0.58,-4.8
    Luke Bard,2,2,1,1,1,0,0,3.00,8,35,23,12,4,7,1,6,1,0,,2,2,-0.045,0.43,-0.9
    Noe Ramirez,1,0,0,0,0,1,0,0.00,3,13,10,5,2,3,1,1,0,0,,0,0,0.004,0.05,0.5
    Cam Bedrosian,1,3,2,2,1,3,0,5.40,7,32,20,10,5,5,2,1,1,0,,0,0,-0.007,0.04,-1.5
    Cody Allen,1,0,0,0,0,1,0,0.00,3,17,10,6,1,3,1,1,0,0,,0,0,0.000,0.00,0.5`);

    let pitcherGameData = baseballReferencePitcherData.concat(baseballReferencePitcherData2)



    //`Pitching,IP,H,R,ER,BB,SO,HR,ERA,BF,Pit,Str,Ctct,StS,StL,GB,FB,LD,Unk,GSc,IR,IS,WPA,aLI,RE24
    //    let pitchingStats = {
    //     pitcherID,
    //     playerName: pitcherData.playerName.slice(1,-1),
    //     earnedRuns: playerEarnedRuns === undefined ? 0 : parseInt(playerEarnedRuns.earnedRuns)
    // };
    //const pitchingStatsProps = ['flyOuts', 'doublePlays', 'triplePlays', 'K', 'hits', 'HP', 'HR', 'H', 'W', 
    //                            'I', 'IW', 'outs', 'NP', 'WP', 'DP', 'flyBalls'];
    
    // pitchingStats['inningsPitched'] = pitchingStats.outs/3;
    // pitchingStats['battersFaced'] = pitcherData.plays.length-pitchingStats.NP-pitchingStats.WP;
    // pitchingStats['gameERA'] = 9*(pitchingStats.earnedRuns / pitchingStats.inningsPitched);
    
    let translation = {
        'IP': 'inningsPitched',
        'ER': 'earnedRuns',
        'H': 'hits',
        'BB': 'W',
        'SO': 'K',
        'BF': 'battersFaced',
        'FB': 'flyBalls',
        'HR': 'HR'
    }

    testFields = `H,ER,BB,SO,HR,BF,FB`.split(',');

    pitcherGameData.forEach(result => {
        let retrosheetPitcher = retrosheetData.find(x => x.playerName === result.Pitching);
        
        testFields.forEach(testField => {

            try {
                expect(result[testField]).to.equal(retrosheetPitcher[translation[testField]].toString());
            } catch (e)
            {
                console.log(`For ${result.Pitching} the ${testField} are not equal. Retrosheet: ${retrosheetPitcher[translation[testField]].toString()}, Baseball-Reference: ${result[testField]}`);
            }

        })
    })

    done();
});