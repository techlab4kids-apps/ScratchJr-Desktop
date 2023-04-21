
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
    packagerConfig: {icon: iconFile},
    rebuildConfig: {},
    makers: [
        {
            name: 'electron-forge-maker-appimage',
            config: {
                options: {
                    icon: iconFile
                }
            }
        },
        {
            name: '@electron-forge/maker-squirrel',
            config: {},
        },
        {
            name: '@electron-forge/maker-zip',
            platforms: ['darwin'],
        },
        {
            name: '@electron-forge/maker-deb',
            config: {},
        },
        {
            name: '@electron-forge/maker-rpm',
            config: {},
        },
    ],
    plugins: [
        {
            name: '@electron-forge/plugin-webpack',
            config: {
                mainConfig: './webpack.main.config.js',
                renderer: {
                    config: './webpack.renderer.config.js',
                    entryPoints: [
                        {
                            html: './src/index.html',
                            js: './src/renderer.js',
                            name: 'main_window',
                            preload: {
                                js: './src/preload.js',
                            },
                        },
                    ],
                },
            },
        },
    ],
};
