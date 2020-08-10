const fs = require('fs');
const path = require('path');

const assets = {};

let isDirectory = (baseFolder, file) => {
    return fs.statSync(path.join(baseFolder, file)).isDirectory();
}

assets.getAllSubFolders = (baseFolder) => {
    let records = fs.readdirSync(baseFolder)
    let files = records.filter(rec => !isDirectory(baseFolder, rec))
        .map(file => path.join(baseFolder, file));
    let folders = records.filter(rec => isDirectory(baseFolder, rec));
    folders.forEach(folder => {
        files = files.concat(assets.getAllSubFolders(path.join(baseFolder, folder)));
    });
    return files;
}

module.exports = assets;
