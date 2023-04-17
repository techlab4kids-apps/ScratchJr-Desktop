
const path = require('path');

const os = require('os');
let iconFile;
let platform = os.platform();

const iconFileWindows = path.resolve(__dirname,  "src/icons/win/icon.ico");
const installerGifWindows = path.resolve(__dirname,  "src/icons/win/installerGif.gif");


const iconFileMac = path.resolve(__dirname,  "src/icons/mac/icon.icns");
if (platform === 'darwin') {
    iconFile = iconFileMac;
}
else if (platform === 'win32') {
     iconFile =   iconFileWindows;
}
else {
	iconFile =    path.resolve(__dirname, "src/icons/png/512x512.png");
}

module.exports = {

	make_targets: {
		win32: [
		  "squirrel"
		],
		darwin: [
		  "zip", "dmg"
		],
		linux: [
		  "deb",
		  "rpm",
			"appImage"
		]
	},
	publishTargets: {	
      "win32": [
        "github"
      ],
      "darwin": [
        "github"
      ],
      "linux": [
        "github"
      ]
	},
	electronPackagerConfig: {
		packageManager: "npm",
		appCopyright: "Copyright (c) 2016, MIT",
		icon: iconFile
	},
	electronWinstallerConfig: {
		"name": "ScratchJr",
		loadingGif: installerGifWindows,
	    iconUrl: iconFileWindows,
	    exe: 'ScratchJr.exe',
	    setupIcon: iconFileWindows
	},
	electronInstallerDebian: {},
	electronInstallerRedhat: {},
	github_repository: {
		"owner": "techlab4kids",
		"name": "ScratchJr-Desktop"
	},
	windowsStoreConfig: {
		"packageName": "",
		"name": "ScratchJr"
	}

}
