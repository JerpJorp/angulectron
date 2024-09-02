# lecture-model
This is my base application template for Angular 18, Electron 32, and Angular/material

## Development
```bash
npm start
```

## Code scaffolding
Run `ng g c components/omponent-name` to generate a new component. You can also use `ng generate directive|pipe|service|class|guard|interface|enum|module`.

## Adding npm dependencies

For Angular dependencies, using the regular npm command line is fine.  For node (backend electron dependencies), using regular npm command line to install will 
work fine for development, but will fail when packaged.  This is because electron packager expects the electron node dependencies to be in a node_modules
directory where the package is built from, which is the ./dist\lecture-model\browser directory created by the Angular build process.  

In order to get these dependencies included,
* Add them to src\package.json as they are in package.json
* src\package.json is copied to dist\lecture-model\browser\package.json as part of the Angular build process (Angular.json assets)
* npm run build includes `cd dist/lecture-model/browser && npm install`, installing those dependencies listed in src/package.json in the right place

## Build
Run any of the following to create electron apps packaged for the target platform
```bash
npm run package:win
npm run package:linux
npm run package:osx
npm run package:all
```
The build artifacts will be stored in the `packages/` directory.

### how this app was created
What I had installed on my machine
```bash
$ npm -v
10.8.1
$ node --version
v22.4.1
$ npm -g ls
C:\Users\user\AppData\Roaming\npm
├── @angular/cli@18.2.2
├── electron@32.0.1
└── yarn@1.22.22
```
#### Setup steps
https://pkief.medium.com/angular-desktop-apps-a9ce9e3574e8 as loose reference
Create initial angular app and set up @angular/material
```bash
ng new lecture-model
cd lecture-model
ng add @angular/material
: ' chosen options:
   ❯ Cyan/Orange        [Preview: https://material.angular.io?theme=cyan-orange]
   ? Set up global Angular Material typography styles? (y/N) y
   ❯ Include and enable animations
'
npm install electron --save-dev
```
create ./src/electron.dev.js
create ./src/electron.prod.js
```bash
npm install concurrently --save-dev
```
add to package.json -> scripts:
```json
"electron": "electron ./src/electron.dev",
```
and change package.json -> scripts -> start from "ng serve" to 
```json
"start": "concurrently \"ng serve\" \"npm run electron\"",
```
At this point the application will run via "npm run start, and hot reload, but will not be packagable/deployable.  
The following steps allow the app to be packaged
In the default ./src/index.html file generated by the angular cli:
```html
<!-- original line -->
<base href="/">
<!-- new line -->
<base href="./">
```
Create  ./src/package.json file
Modify angular.json to include the electron related files when it builds
```json
"assets": [
  ...
  "src/package.json",
  "src/electron.prod.js"
],
```
install packages for application packaging
```bash
npm install electron-packager cross-var --save-dev

add to package.json -> scripts:
```json
"package:win": "npm run build && cross-var electron-packager dist/lecture-model $npm_package_name-$npm_package_version --out=packages --platform=win32 --arch=all --overwrite ",
"package:linux": "npm run build && cross-var electron-packager dist/lecture-model $npm_package_name-$npm_package_version --out=packages --platform=linux --arch=all --overwrite ",
"package:osx": "npm run build && cross-var electron-packager dist/lecture-model $npm_package_name-$npm_package_version --out=packages --platform=darwin --arch=all --overwrite ",
"package:all": "npm run build && cross-var electron-packager dist/lecture-model $npm_package_name-$npm_package_version --out=packages --all --arch=all --overwrite ",
```
