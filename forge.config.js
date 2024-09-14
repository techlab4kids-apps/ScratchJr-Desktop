const path = require('path');
const os = require('os');

let iconFile;
const platform = os.platform();

const iconFileWindows = path.resolve(__dirname, 'src/icons/win/icon.ico');
const installerGifWindows = path.resolve(__dirname, 'src/icons/win/installerGif.gif');
const iconFileMac = path.resolve(__dirname, 'src/icons/mac/icon.icns');

if (platform === 'darwin') {
  iconFile = iconFileMac;
} else if (platform === 'win32') {
  iconFile = iconFileWindows;
} else {
  iconFile = path.resolve(__dirname, 'src/icons/png/512x512.png');
}

module.exports = {
  packagerConfig: {
    icon: iconFile,
    out: './build',
    ignore: [
      'out($|/)',
      'build($|/)',
      'node_modules/dev($|/)',
      'node_modules/.bin($|/)',
      'Dockerfile',
      'docker-compose.yml',
      '.dockerignore',
      '.git($|/)',
      '.gitignore',
      'README.md',
      // Aggiungi altri file o directory da ignorare
    ],
  },
  rebuildConfig: {},
  makers: [
    {
      name: '@electron-forge/maker-appimage',
      config: {
        options: {
          icon: iconFile,
        },
      },
    },
    // Aggiungi altri makers se necessario
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
