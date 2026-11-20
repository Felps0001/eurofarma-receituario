'use strict';
const {app,BrowserWindow,Menu,session,powerSaveBlocker,ipcMain}=require('electron');
const path=require('node:path');
const {fileURLToPath}=require('node:url');
const testMode=process.argv.includes('--test-mode');
if(testMode)app.setPath('userData',path.join(app.isPackaged?path.dirname(process.execPath):__dirname,'test-profile'));
const root=app.isPackaged?path.join(process.resourcesPath,'game'):path.resolve(__dirname,'../../game-offline');
const pdfs=new Set(['esio','lacbi5','imune','dozi','trev'].map(id=>path.join(root,'minibulas',id+'.pdf').toLowerCase()));
let main;
function isLeaflet(url){try{return pdfs.has(fileURLToPath(url).toLowerCase())}catch{return false}}
function secureWindow(win){
 win.webContents.on('will-attach-webview',e=>e.preventDefault());
 win.webContents.on('will-navigate',e=>e.preventDefault());
 win.webContents.setWindowOpenHandler(()=>({action:'deny'}));
}
function openLeaflet(url){
 if(!isLeaflet(url))return;
 const viewer=new BrowserWindow({parent:main,width:900,height:1100,title:'Minibula — Eurofarma',show:!testMode,autoHideMenuBar:true,backgroundColor:'#ffffff',webPreferences:{nodeIntegration:false,contextIsolation:true,sandbox:true,plugins:true}});
 secureWindow(viewer);
 viewer.webContents.on('before-input-event',(e,input)=>{if(input.key==='Escape'){e.preventDefault();viewer.close()}});
 viewer.loadURL(url);
}
function createWindow(){
 main=new BrowserWindow({width:1080,height:1920,fullscreen:!testMode,show:false,autoHideMenuBar:true,backgroundColor:'#102d58',title:'Eurofarma — Desafio Receituário',icon:path.join(__dirname,'build/icon.ico'),webPreferences:{nodeIntegration:false,contextIsolation:true,sandbox:true,webSecurity:true,preload:path.join(__dirname,'preload.cjs'),devTools:!app.isPackaged||testMode}});
 secureWindow(main);
 main.webContents.setWindowOpenHandler(({url})=>{openLeaflet(url);return {action:'deny'}});
 main.webContents.on('before-input-event',(e,input)=>{
  if(input.type!=='keyDown')return;
  if(input.key==='F11'){e.preventDefault();main.setFullScreen(!main.isFullScreen())}
  if(input.control&&input.shift&&input.key.toLowerCase()==='q'){e.preventDefault();app.quit()}
 });
 main.once('ready-to-show',()=>{if(!testMode)main.show()});
 main.loadFile(path.join(root,'index.html'));
}
if(!app.requestSingleInstanceLock())app.quit();
else{
 app.on('second-instance',()=>{if(main){if(main.isMinimized())main.restore();main.show();main.focus()}});
 app.whenReady().then(()=>{
  ipcMain.on('kiosk:close',event=>{
   if(main&&!main.isDestroyed()&&event.sender===main.webContents&&event.senderFrame===main.webContents.mainFrame)app.quit();
  });
  Menu.setApplicationMenu(null);
  session.defaultSession.setPermissionRequestHandler((_wc,_permission,callback)=>callback(false));
  session.defaultSession.setPermissionCheckHandler(()=>false);
  session.defaultSession.webRequest.onBeforeRequest({urls:['http://*/*','https://*/*','ws://*/*','wss://*/*']},(_details,callback)=>callback({cancel:true}));
  powerSaveBlocker.start('prevent-display-sleep');
  createWindow();
 });
 app.on('window-all-closed',()=>app.quit());
}
