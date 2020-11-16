const path = require('path');
const fs = require('fs');
const { get } = require('https');

const oneFilePath = path.resolve('../retrosheet-data-by-year/2019/events/2019ANA.EVA');

// Input: "info,visteam,TEX", ","
// Output: ["info", "visteam,TEX"]
function getFirstSplit(origStr, sep)
{
    let firstSepIndex = origStr.indexOf(sep);
    let firstPart = origStr.substr(0,firstSepIndex);
    let secondPart = origStr.substr(firstSepIndex+1);
    return [firstPart, secondPart];
}

function extractStartField(data)
{
    // Breakdown of given field: PlayerID, Player Name, Home/Visitor, Batting order position, fielding position
    let parts = data.split(',');
    return {
        playerID: parts[0],
        playerName: parts[1],
        isHome: parts[2],
        battingOrder: parts[3],
        fieldingPosition: parts[4]
    };
}

function extractPlayField(data)
{
    /**
     * 1. The first field is the inning, an integer starting at 1.
     *
     *  2. The second field is either 0 (for visiting team) or 1 (for home team).
     *
     *  3. The third field is the Retrosheet player id of the player at the plate.
     *
     *  4. The fourth field is the count on the batter when this particular event (play) occurred. Most Retrosheet games do not have this information, and in such cases, "??" appears in this field.
     *
     *  5. The fifth field is of variable length and contains all pitches to this batter in this plate appearance and is described below. If pitches are unknown, this field is left empty, nothing is between the commas.
     *
     *  6. The sixth field describes the play or event that occurred.
     *
     *  play,5,1,ramir001,00,,S8.3-H;1-2
     * 
     */

     let parts = data.split(',');
     return {
         inning: parts[0],
         isHomeBatting: parts[1],
         battingPlayerID: parts[2],
         count: parts[3],
         pitches: parts[4],
         event: parts[5]
     }
}

function extractDataField(data) {
    let parts = data.split(',');
    return {
        playerID: parts[1],
        earnedRuns: parts[2]
    }
}


function captureData(input) {
    
    // There are 11 different types of records, minus ID and VERSION, we should have 9.
    switch(input.recordType)
    {
        case 'info':

            if (input.game[input.recordType] === undefined) input.game[input.recordType] = {};
            
            const parts = getFirstSplit(input.data, ',');
            input.game[input.recordType][parts[0]] = parts[1];
            
            break;
        case 'start': 
            
            if (input.game[input.recordType] === undefined) 
            {
                input.game[input.recordType] = [
                    [],
                    []
                ];
            }

            let starter = extractStartField(input.data);

            input.game[input.recordType][starter.isHome][starter.fieldingPosition] = starter;

            break;
        case 'play':
            if (input.game[input.recordType] === undefined) {
                input.game[input.recordType] = [];
            }

            let play = extractPlayField(input.data);
            
            play['eventID'] = input.game.numEvents;
            input.game[input.recordType].push(play);
            input.game.numEvents++;
            
            break;
        case 'sub':
            if (input.game[input.recordType] === undefined) 
            {
                input.game[input.recordType] = [
                    [],
                    []
                ];
            }

            let sub = extractStartField(input.data);

            sub['eventID'] = input.game.numEvents;
            input.game[input.recordType][sub.isHome].push(sub);
            input.game.numEvents++;

            break;
        case 'badj': // Batter bats from the side that is not expected
            break;
        case 'padj': // Pitcher changes pitching hand
            break;
        case 'ladj': // Team bats out of order
            break;
        case 'data': // data records appear after every all the play records
            if (input.game[input.recordType] === undefined)
            {
                input.game[input.recordType] = [];
            }

            let datum = extractDataField(input.data);

            input.game[input.recordType].push(datum);
            break;
        case 'com': // Is a comment on the previous field
        default:
            break;
    }

    return input.game;
}

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
        let parts = getFirstSplit(firstGameParts[i], ',');

        game = captureData({ game, recordType: parts[0], data: parts[1] } );
    }

    console.log(game);

} catch (err) {
    console.error(err)
}