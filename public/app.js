const fs = require('fs')
const generator = require('./src/generator.js')

async function generate() {
    const text = document.getElementById("text").value;
    const dictionary = readJson('public/dictionary.json').dictionary;
    const result = generator.generate(text, dictionary);
    await drawRebus(result);
}

function exportRebus() {
    new p5(function (p) {
        p.setup = () => {
            p.save(CANVAS, getExportFileName());
        }
    }, 'canvas-wrapper');
}

function getExportFileName() {
    return `${new Date().getYear()+1900}-${new Date().getMonth()+1 >= 10 ? new Date().getMonth()+1 : '0'+(new Date().getMonth()+1)}-${new Date().getDate() >= 10 ? new Date().getDate() : '0'+(new Date().getDate())}-generated.jpg`;
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
            for (const wordElements of result) {
                offset += DISTANCE;
                for (const element of wordElements) {
                    if (element.type === 'LITERAL') {
                        p.fill('red');
                        p.stroke('red');
                        p.strokeWeight(1);
                        p.text(element.text, offset, HEIGHT / 2 - 20);
                    } else {
                        await drawImage(p, element, offset, fileNames);
                        let offset2 = offset;
                        element.diff.forEach(diffRecord => {
                            if (diffRecord.removed) {
                                p.fill('black');
                                p.stroke('black');
                                p.strokeWeight(1);
                                p.text(diffRecord.value, offset2, DISTANCE * 6 + ELEMENT_SIZE);
                                p.fill('red');
                                p.stroke('red');
                                p.strokeWeight(2);
                                p.line(offset2, DISTANCE * 6 + ELEMENT_SIZE,
                                    offset2 + diffRecord.count * 12 + DISTANCE, DISTANCE * 4 + ELEMENT_SIZE);
                            } else if (diffRecord.added) {
                                p.fill('green');
                                p.stroke('green');
                                p.strokeWeight(1);
                                p.text(diffRecord.value, offset2, DISTANCE * 6 + ELEMENT_SIZE);
                            }
                            offset2 += diffRecord.count * 14 + DISTANCE;
                        })
                    }
                    offset += calculateElementWidth(element);
                }
                offset += DISTANCE * 6;
            }
        }
    };
    new p5(sketch, 'canvas-wrapper');
}

async function drawImage(p, element, offset, fileNames) {
    const fileName = getFileName(element.name, fileNames);
    if (!fileName) {
        return new Promise(resolve => {
            p.fill('gray');
            p.text(`[${element.name}]`, offset, HEIGHT / 2 - 20);
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
