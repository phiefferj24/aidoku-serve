#! /usr/bin/env node
var fs = require('fs');
var express = require('express');
var child_process = require('child_process');
var os = require('os');
var whitespaceRegex = /\s+(?=((\\[\\"]|[^\\"])*"(\\[\\"]|[^\\"])*")*(\\[\\"]|[^\\"])*$)/;
var main = function () {
    var _a, _b;
    var args = process.argv.slice(process.argv.findIndex(function (elem) { return elem.includes("aidoku-serve"); }) + 1);
    var outputDirectory = "./out/";
    var portString = "3000";
    var files = [];
    for (var _i = 0, args_1 = args; _i < args_1.length; _i++) {
        var arg = args_1[_i];
        if (arg === outputDirectory || (arg + "/") === outputDirectory || arg === portString) {
            continue;
        }
        else if (arg === '-o' || arg === '--output') {
            outputDirectory = args[args.indexOf(arg) + 1];
            if (!outputDirectory.endsWith('/')) {
                outputDirectory += '/';
            }
            continue;
        }
        else if (arg === '-p' || arg === '--port') {
            portString = args[args.indexOf(arg) + 1];
            continue;
        }
        else {
            files.push(arg);
        }
    }
    if (files.length === 0) {
        console.log("You need to specify at least one file.");
        return;
    }
    console.log("Compiling sources...");
    var tempDirectory = outputDirectory + "temp/";
    if (fs.existsSync(tempDirectory)) {
        fs.rmSync(tempDirectory, { recursive: true });
    }
    fs.mkdirSync(tempDirectory, { recursive: true });
    var sourcesDirectory = outputDirectory + "sources/";
    if (fs.existsSync(sourcesDirectory)) {
        fs.rmSync(sourcesDirectory, { recursive: true });
    }
    fs.mkdirSync(sourcesDirectory, { recursive: true });
    var iconsDirectory = outputDirectory + "icons/";
    if (fs.existsSync(iconsDirectory)) {
        fs.rmSync(iconsDirectory, { recursive: true });
    }
    fs.mkdirSync(iconsDirectory, { recursive: true });
    var sources = [];
    for (var _c = 0, files_1 = files; _c < files_1.length; _c++) {
        var file = files_1[_c];
        var fileName = file.split('/').pop();
        if (!fileName) {
            continue;
        }
        var fileFolder = fileName.substring(0, fileName.length - 4);
        child_process.execSync("unzip ".concat(file, " -d ").concat(tempDirectory).concat(fileFolder));
        var filePayloadFolder = tempDirectory + fileFolder + "/Payload/";
        var jsonString = fs.readFileSync(filePayloadFolder + "source.json", 'utf8');
        var json = JSON.parse(jsonString);
        var source = json.info;
        if (!source.hasOwnProperty("nsfw")) {
            source.nsfw = 1;
        }
        var sourceFileName = "".concat(source.id, "-v").concat((_a = source.version) !== null && _a !== void 0 ? _a : 1, ".aix");
        var imageFileName = "".concat(source.id, "-v").concat((_b = source.version) !== null && _b !== void 0 ? _b : 1, ".png");
        source.file = sourceFileName;
        source.icon = imageFileName;
        fs.copyFileSync(file, sourcesDirectory + sourceFileName);
        fs.copyFileSync(filePayloadFolder + "Icon.png", outputDirectory + "icons/" + imageFileName);
        sources.push(source);
        fs.rmSync(tempDirectory + fileFolder, { recursive: true });
    }
    fs.writeFileSync(outputDirectory + "index.json", JSON.stringify(sources));
    fs.writeFileSync(outputDirectory + "index.min.json", JSON.stringify(sources).replace(whitespaceRegex, ""));
    fs.rmSync(tempDirectory, { recursive: true });
    console.log("Sources compiled.");
    var interfaces = os.networkInterfaces();
    var addresses = [];
    for (var interfaceName in interfaces) {
        var networkInterface = interfaces[interfaceName];
        if (!networkInterface) {
            continue;
        }
        for (var _d = 0, networkInterface_1 = networkInterface; _d < networkInterface_1.length; _d++) {
            var address = networkInterface_1[_d];
            if (address.family === 'IPv4') {
                addresses.push(address.address);
            }
        }
    }
    var port = parseInt(portString);
    var app = express();
    app.use(express.static(outputDirectory));
    app.listen(port, function () {
        console.log("Broadcasting source list on: \n".concat(addresses.map(function (val) { return "http://".concat(val, ":").concat(port, "/"); }).join("\n")));
    });
};
main();
