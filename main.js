//http://stackoverflow.com/questions/13696148/node-js-create-folder-or-use-existing
//http://stackoverflow.com/questions/20822273/best-way-to-get-folder-and-file-list-in-javascript
//https://github.com/lksv/node-resemble.js/issues/11

function main(configFile) {
	var fs = require('fs');
	var resemble = require('node-resemble-js');
	var configFileData = require(configFile);
	var folderPath_1;
	var folderPath_2;
	var mismatchData = [];

	if (!configFileData.baselineFolder || !configFileData.targetFolder) {
		if (!configFileData.rootFolder) {
			console.log('You need to provide at the baselineFolder and targetFolder or a rootFolder');
			return;
		}
		var targetDir = configFileData.rootFolder;
		var folders = getLastTwoSubFolders(targetDir);
		if (!folders) {
			console.log('There needs to be two folders inside a given rootFolder for comparison');
			return false;
		}
		folderPath_1 = folders[0];
		folderPath_2 = folders[1];

	} else {
		folderPath_1 = configFileData.baselineFolder;
		folderPath_2 = configFileData.targetFolder;
	}

	var outputDir = configFileData.outputFolder || './output/';

	var folderName_1 = folderPath_1.split('/').slice(-1);
	var folderName_2 = folderPath_2.split('/').slice(-1);
	var diffFolderName = folderName_1 + '-' + folderName_2;
	var diffFolderPath = outputDir + diffFolderName;
	try {
		fs.mkdirSync(diffFolderPath);
	} catch(e) {
		if (e.code == 'EEXIST');
	}
	var content_1 = fs.readdirSync(folderPath_1);
	var content_2 = fs.readdirSync(folderPath_2);

	content_1.forEach(function(item) {
		var mismatch;
		var itemPath = folderPath_1 + '/' + item;
		content_2.forEach(function(item_2) {
			var itemPath_2 = folderPath_2 + '/' + item_2;

			if (item === item_2 && (item_2.substring(0,1) !== '.')) {
				var diffFilePath = diffFolderPath + '/' + item;
				try {
					mismatch = compare(itemPath, itemPath_2, diffFilePath);
				} catch(e) {
					if (e.code == 'EEXIST') console.log(e);
				}
			}
		})
	});

	function getLastTwoSubFolders(targetDir) {
		// get the most recent two folders from a given target directory;
		
		var targetContent = fs.readdirSync(targetDir);
		if (targetContent.length === 0) {
			//empty folder
			return false;
		}
		
		//get folders inside targetDir and their stats for sorting;
		var results = [];
		targetContent.forEach(function(item) {
			
			var itemPath = targetDir + item;
			var stat = fs.statSync(itemPath);

			if (stat && stat.isDirectory()) {
				results.push({"path":itemPath, "stats":stat});
			}
		});

		//do the sorting
		results = results.sort(function(a,b) {
			return a["stats"]["ctime"] - b["stats"]["ctime"];
		});

		//isolate to only folder paths
		var folderResults = results.map(function(folderData) {
			return folderData["path"];
		});

		//need at least two folders inside target Dir for comparison to work
		if (folderResults.length < 2) {
			return false;
		}

		var twoMostRecentFolders = folderResults.slice(folderResults.length-2, folderResults.length);
		folderPath_1 = twoMostRecentFolders[0];
		folderPath_2 = twoMostRecentFolders[1];

		return [folderPath_1, folderPath_2];
	}

	function compare(file_01, file_02, diffFilePath) {
		console.log('comparing: \n' + file_01 + '\n' + file_02 + '\n');
		var diff = resemble(file_01).compareTo(file_02).ignoreColors().onComplete(function(data) {
		    var imageData = data["getDiffImage"]()["data"];
		    var mismatch = data["misMatchPercentage"];
		    var mismatchNum = Number(mismatch);
		    if (mismatch > 0.01) {
				console.log('mismatch found!');
				console.log('mismatch amount: ' + mismatch);
				data.getDiffImage().pack().pipe(fs.createWriteStream(diffFilePath));
		    }
		    //{
		    //  misMatchPercentage : 100, // %
		    //  isSameDimensions: true, // or false
		    //  dimensionDifference: { width: 0, height: -1 }, // defined if dimensions are not the same
		    //  getDiffImage: function(){},
		    //  analysisTime: 182
		    //}
		});
	}
}

module.exports = main;
