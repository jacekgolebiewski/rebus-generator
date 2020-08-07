const diff = require('diff');

const generator = {};

generator.generate = (text, dictionary) => {
    const words = text.split(' ');
    return words.map(word => transform(word, dictionary))
}

function transform(word, dictionary) {
    if (word.length < 2) {
        return [buildLiteral(word)];
    }
    let result = []
    let correctWords = dictionary.filter(dictWord => fits(word, dictWord))
    if (correctWords.length === 0) {
        return [buildLiteral(word)];
    }
    let chosenWord = randomFromArray(correctWords);
    let mainPart = getMainPart(word, chosenWord);
    let wordLeftParts = word.split(mainPart);
    if (wordLeftParts[0].length > 0) {
        result = result.concat(transform(wordLeftParts[0], dictionary));
    }
    result.push(buildElement(chosenWord, mainPart));
    if (wordLeftParts[1].length > 0) {
        result = result.concat(transform(wordLeftParts[1], dictionary));
    }
    return result;
}

function buildLiteral(word) {
    return {
        type: 'LITERAL',
        text: word
    }
}

function buildElement(chosenWord, mainPart) {
    return {
        type: 'ELEMENT',
        name: chosenWord,
        diff: diff.diffChars(chosenWord, mainPart)
    };
}

function fits(text, dictWord) {
    if (getMainPart(text, dictWord).length < 2) {
        return false;
    }
    return true;
}

function getMainPart(word, dictWord) {
    let textDiff = diff.diffChars(dictWord, word);
    let existingParts = textDiff.filter(el => !el.added && !el.removed)
        .sort(function (a, b) {
            return b.count - a.count
        })
    return existingParts.length > 0 ? existingParts[0].value : '';
}

function randomFromArray(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
}

module.exports = generator;
