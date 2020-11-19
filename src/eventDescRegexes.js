let fielders = /([1-9])/;
let baseLiterals = ['1','2','3','H'];
let bases = new RegExp(`(${baseLiterals.join('|')})`);

let hitLiterals = ['S','D','T'];
let hitTypes = new RegExp(`(${hitLiterals.join('|')})`);

let results = {
    flyOut: new RegExp(`${fielders.source}`),
    groundOut: new RegExp(`${fielders.source}{2,}`),
    groundDP: new RegExp(`${fielders.source}{1,}\(${bases.source}\)${fielders.source}`),
    lineDP: new RegExp(`${fielders.source}\(\B\)${fielders.source}{1,}\(${bases.source}\)`),
    interference: /\C/,
    hit: new RegExp(`${hitTypes.source}(${fielders.source}{1,})`),
    groundRuleDouble: /^DGR$/,
    error: new RegExp(`E${fielders.source}`),
    fieldersChoice: new RegExp(`FC${fielders.source}`),
    errorOnFoulBall: new RegExp(`FLE${fielders.source}`),
    homeRun: /\H|HR/,
    insideParkHomeRun: new RegExp(`H${fielders.source}|HR${fielders.source}`),
    hitBatter: /HP/,
    strikeout: /\K/,
    // thirdStrikeEvent: /^K\+(SB(2|3|H)|CS(2|3|H)|OA|PO(2|3|H)|PB|WP|E${fielders.source})$/,
    noPlay: /NP/,
    intentionalWalk: /\I|IW/,
    walk: /\W/,
    // walkEvent: /^W\+(SB(2|3))$/
}

addBeginningAndEnding = (str) => `^${str}$`;

let regexes = Object.keys(results).map(key => {
    return new RegExp(addBeginningAndEnding(results[key].source)); 
});

module.exports = {
    regexes
}