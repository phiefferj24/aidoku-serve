#! /usr/bin/env node
const fs = require('fs');
const express = require('express');
const child_process = require('child_process');
const os = require('os');

const whitespaceRegex = /\s+(?=((\\[\\"]|[^\\"])*"(\\[\\"]|[^\\"])*")*(\\[\\"]|[^\\"])*$)/;

const main = () => {
	let args = process.argv.slice(process.argv.findIndex(elem => elem.includes("aidoku-serve")) + 1)
	let outputDirectory = "./out/"
	let portString = "3000";
	let files: string[] = [];
	for (let arg of args) {
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

	console.log("Compiling sources...")

	let tempDirectory = outputDirectory + "temp/";
	if (fs.existsSync(tempDirectory)) {
		fs.rmSync(tempDirectory, { recursive: true });
	}
	fs.mkdirSync(tempDirectory, { recursive: true });
	let sourcesDirectory = outputDirectory + "sources/";
	if (fs.existsSync(sourcesDirectory)) {
		fs.rmSync(sourcesDirectory, { recursive: true });
	}
	fs.mkdirSync(sourcesDirectory, { recursive: true });
	let iconsDirectory = outputDirectory + "icons/";
	if (fs.existsSync(iconsDirectory)) {
		fs.rmSync(iconsDirectory, { recursive: true });
	}
	fs.mkdirSync(iconsDirectory, { recursive: true });
	let sources: object[] = [];

	for (let file of files) {
		let fileName = file.split('/').pop();
		if (!fileName) {
			continue;
		}
		let fileFolder = fileName!.substring(0, fileName.length - 4);
		child_process.execSync(`unzip ${file} -d ${tempDirectory}${fileFolder}`);
		let filePayloadFolder = tempDirectory + fileFolder + "/Payload/";
		let jsonString = fs.readFileSync(filePayloadFolder + "source.json", 'utf8');
		let json = JSON.parse(jsonString);
		let source = json.info;
		if (!source.hasOwnProperty("nsfw")) {
			source.nsfw = 1;
		}
		let sourceFileName = `${source.id}-v${source.version ?? 1}.aix`;
		let imageFileName = `${source.id}-v${source.version ?? 1}.png`;
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

	let interfaces = os.networkInterfaces();
	let addresses: string[] = [];
	for (let interfaceName in interfaces) {
		let networkInterface = interfaces[interfaceName];
		if (!networkInterface) {
			continue;
		}
		for (let address of networkInterface) {
			if (address.family === 'IPv4') {
				addresses.push(address.address);
			}
		}
	}
	let port = parseInt(portString);
	let app = express();
	app.use(express.static(outputDirectory));
	app.listen(port, () => {
		console.log(`Broadcasting source list on: \n${addresses.map((val) => `http://${val}:${port}/`).join("\n")}`);
	});
}
main();