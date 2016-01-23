//http://stackoverflow.com/questions/13696148/node-js-create-folder-or-use-existing
//http://stackoverflow.com/questions/20822273/best-way-to-get-folder-and-file-list-in-javascript
//https://github.com/lksv/node-resemble.js/issues/11

var fs = require('fs');
var resemble = require('node-resemble-js');
var targetDir = './images/';
var outputDir = './output/';
var outputLogFile = 'output_log.json';
var targetContent = fs.readdirSync(targetDir);
var mismatchData = [];

//get folders and their stats for sorting;
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

//compare all the files to each other in both folders
var twoMostRecentFolders = folderResults.slice(folderResults.length-2, folderResults.length);
var folderPath_1 = twoMostRecentFolders[0];
var folderPath_2 = twoMostRecentFolders[1];
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

