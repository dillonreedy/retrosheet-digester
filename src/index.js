const path = require('path');
const fs = require('fs');
const fieldExtractor = require('./extractFields.js');
const gameStatsParser = require('./extractGameStats.js');

const oneFilePath = path.resolve('../retrosheet-data-by-year/2019/events/2019ANA.EVA');

// Input 

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
    console.log(gameStats);

} catch (err) {
    console.error(err)
}