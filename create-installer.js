const createWindowsInstaller = require('electron-winstaller').createWindowsInstaller
const path = require('path')

const packages = [
  'lecture-model-1.0.0-win32-arm64',
  'lecture-model-1.0.0-win32-x64',
  'lecture-model-1.0.0-win32-ia32',
]

packages.forEach((package) =>
  getInstallerConfig(package)
    .then(createWindowsInstaller)
    .catch((error) => {
      console.error(error.message || error)
      process.exit(1)
    })
);

function getInstallerConfig (packageName) {
  console.log(`creating windows installer for ${packageName}`);
  const rootPath = path.join('./');
  const packagePath = path.join(rootPath, 'packages');
  const outPath = path.join(rootPath, 'installer-scripts', 'Output');

  return Promise.resolve({
    appDirectory: path.join(packagePath, packageName),
    authors: 'Kelley Bellard',
    noMsi: true,
    outputDirectory: path.join(outPath, packageName),
    exe: 'lecture-model-1.0.0.exe',
    setupExe: `${packageName}-setup.exe`,
    setupIcon: path.join(rootPath, 'public', 'favicon.ico')
  })
}
