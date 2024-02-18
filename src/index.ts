import { app } from 'electron';
import Main from './Main';

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (require('electron-squirrel-startup')) {
  app.quit();
}

const main = new Main();

main.onEvent.on("window-created", ()=> {
});

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and import them here.
