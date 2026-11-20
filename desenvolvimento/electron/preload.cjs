'use strict';
const {contextBridge,ipcRenderer}=require('electron');
contextBridge.exposeInMainWorld('kiosk',Object.freeze({close:()=>ipcRenderer.send('kiosk:close')}));
