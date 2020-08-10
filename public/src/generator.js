const diff = require('diff');


const generator = {};

generator.WORD_SEPARATOR = ',,';
generator.ELEMENT_PREFIX = '$';
generator.LITERAL_PREFIX = '!';
generator.ADD_PREFIX = '+';
generator.REMOVE_PREFIX = '-';
generator.SKIP_PREFIX = '*';
generator.operations = [

]

generator.generate = (text, dictionary) => {
    const words = text.split(' ');
    return words.map(word => transform(word, dictionary)).join(generator.WORD_SEPARATOR)
}

function transform(word, dictionary) {
    if (word.length < 2) {
        return buildLiteral(word);
    }
    let result = '';
    let correctWords = dictionary.filter(dictWord => fits(word, dictWord))
    if (correctWords.length === 0) {
        return buildLiteral(word);
    }
    let chosenWord = randomFromArray(correctWords);
    let mainPart = getMainPart(word, chosenWord);
    let wordLeftParts = word.split(mainPart);
    if (wordLeftParts[0].length > 0) {
        result += transform(wordLeftParts[0], dictionary);
    }
    result += buildElement(chosenWord, mainPart);
    if (wordLeftParts[1].length > 0) {
        result += transform(wordLeftParts[1], dictionary);
    }
    return result;
}

function buildLiteral(word) {
    return `[${generator.LITERAL_PREFIX}${word}]`;
}

function buildElement(chosenWord, mainPart) {
    let result = `[${generator.ELEMENT_PREFIX}${chosenWord}`;
    diff.diffChars(chosenWord, mainPart).forEach(diffRec => {
        if(diffRec.removed) {
            result += `${generator.REMOVE_PREFIX}${diffRec.value}`;
        } else if(diffRec.added) {
            result += `${generator.ADD_PREFIX}${diffRec.value}`;
        } else {
            result += `${generator.SKIP_PREFIX}${diffRec.value}`;
        }
    });
    return result + ']';
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
