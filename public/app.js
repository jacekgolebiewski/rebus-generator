const fs = require('fs')
const generator = require('./src/generator.js')

async function generateText() {
    const text = document.getElementById("text").value;
    const dictionary = readJson('public/dictionary.json').dictionary;
    const result = generator.generate(text, dictionary);
    document.getElementById("rebus-text").value = result;
}

async function generateRebus() {
    await drawRebus(document.getElementById("rebus-text").value);
}

function exportRebus() {
    new p5(function (p) {
        p.setup = () => {
            p.save(CANVAS, getExportFileName());
        }
    }, 'canvas-wrapper');
}

function getExportFileName() {
    return `${new Date().getYear() + 1900}-${new Date().getMonth() + 1 >= 10 ? new Date().getMonth() + 1 : '0' + (new Date().getMonth() + 1)}-${new Date().getDate() >= 10 ? new Date().getDate() : '0' + (new Date().getDate())}-generated.jpg`;
}

function readJson(fileName) {
    const data = fs.readFileSync(fileName);
    return JSON.parse(data);
}

const DISTANCE = 10;
const ELEMENT_SIZE = 200
const HEIGHT = 300

const FOLDER_FS_PREFIX = 'public/';
const ASSETS_FOLDER = 'assets/';
let CANVAS;

function drawRebus(result) {
    const decodedRebus = decodeRebusText(result);

    const fileNames = fs.readdirSync(FOLDER_FS_PREFIX + ASSETS_FOLDER);
    let sketch = function (p) {
        p.setup = async () => {
            const width = 2000;
            p.remove();
            CANVAS = p.createCanvas(width, HEIGHT);
            p.clear();
            p.background(255);
            p.textSize(32);
            let offset = 0;
            for (const word of decodedRebus) {
                offset += DISTANCE;
                for (const element of word) {
                    let firstExpression = element[0];
                    if (firstExpression[0] === generator.LITERAL_PREFIX) {
                        p.fill('red');
                        p.stroke('red');
                        p.strokeWeight(1);
                        p.text(firstExpression.substr(1), offset, HEIGHT / 2 - 20);
                    } else {
                        await drawImage(p, firstExpression.substr(1), offset, fileNames);
                        let offset2 = offset;
                        for(const elementExp of element) {
                            const expOperator = elementExp[0];
                            const expText = elementExp.substr(1);
                            const expCount = expText.length;
                            if (expOperator === generator.REMOVE_PREFIX) {
                                p.fill('black');
                                p.stroke('black');
                                p.strokeWeight(1);
                                p.text(expText, offset2, DISTANCE * 6 + ELEMENT_SIZE);
                                p.fill('red');
                                p.stroke('red');
                                p.strokeWeight(2);
                                p.line(offset2, DISTANCE * 6 + ELEMENT_SIZE,
                                    offset2 + expCount * 12 + DISTANCE, DISTANCE * 4 + ELEMENT_SIZE);
                            } else if (expOperator === generator.ADD_PREFIX) {
                                p.fill('green');
                                p.stroke('green');
                                p.strokeWeight(1);
                                p.text(expText, offset2, DISTANCE * 6 + ELEMENT_SIZE);
                            }
                            if (expOperator !== generator.ELEMENT_PREFIX) {
                                offset2 += expCount * 14 + DISTANCE;
                            }
                        }
                    }
                    offset += calculateElementWidth(element);
                }
                offset += DISTANCE * 6;
            }
        }
    }
    new p5(sketch, 'canvas-wrapper');
}

function decodeRebusText(result) {
    return result.split(generator.WORD_SEPARATOR)
        .map(elementsString => elementsString.split(']').join('')
            .split('[')
            .filter(el => !!el.length)
            .map(element => element.split(/([$!+*\-][AaĄąBbCcĆćDdEeĘęFfGgHhIiJjKkLlŁłMmNnŃńOoÓóPpRrSsŚśTtUuWwYyZzŹźŻż\w]+)/)
                .filter(el => !!el.length)));

}

async function drawImage(p, elementName, offset, fileNames) {
    const fileName = getFileName(elementName, fileNames);
    if (!fileName) {
        return new Promise(resolve => {
            p.fill('gray');
            p.text(`[${elementName}]`, offset, HEIGHT / 2 - 20);
            resolve(true)
        });
    }
    return new Promise(resolve => {
        p.loadImage(fileName, img => {
            p.image(img, offset + DISTANCE, DISTANCE * 2, ELEMENT_SIZE, ELEMENT_SIZE);
            resolve(true)
        });
    });
}

function calculateElementWidth(element) {
    let elementResult = DISTANCE;
    if (element.type === 'LITERAL') {
        elementResult += element.text.length * 12;
    } else {
        elementResult += ELEMENT_SIZE + DISTANCE;
    }
    return elementResult;
}

function getFileName(name, fileNames) {
    const matchingNames = fileNames.filter(el => el.startsWith(`${name}_`));
    if (matchingNames.length === 0) {
        return undefined;
    }
    return `${ASSETS_FOLDER}${randomFromArray(matchingNames)}`;
}

function randomFromArray(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
}
