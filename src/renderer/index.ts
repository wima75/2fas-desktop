/**
 * This file will automatically be loaded by webpack and run in the "renderer" context.
 * To learn more about the differences between the "main" and the "renderer" context in
 * Electron, visit:
 *
 * https://electronjs.org/docs/latest/tutorial/process-model
 *
 * By default, Node.js integration in this file is disabled. When enabling Node.js integration
 * in a renderer process, please be aware of potential security implications. You can read
 * more about security risks here:
 *
 * https://electronjs.org/docs/tutorial/security
 *
 * To enable Node.js integration in this file, open up `main.js` and enable the `nodeIntegration`
 * flag:
 *
 * ```
 *  // Create the browser window.
 *  mainWindow = new BrowserWindow({
 *    width: 800,
 *    height: 600,
 *    webPreferences: {
 *      nodeIntegration: true
 *    }
 *  });
 * ```
 */

import './default.scss';
import 'bootstrap';
import * as OTPAuth from 'otpauth';

function stripSpaces(str: string) {
    return str.replace(/\s/g, '');
}

function truncateTo(str: string, digits: number) {
    if (str.length <= digits) {
      return str;
    }
  
    return str.slice(-digits);
  }

function getCurrentSeconds(): number {
return Math.round(new Date().getTime() / 1000.0);
}

function getAvatarText(service: any) {
    if (service?.icon?.label) {
        return service.icon.label.text;
    }

    return '';
}

function getAvatar(service: any) {
    let html = '<div class="avatar"';
    if (service?.icon?.label?.backgroundColor) {
        html += ` style="background-color: ${service.icon.label.backgroundColor}"`;
    }
    html += `>${getAvatarText(service)}</div>`;
    return html;
}

function getUpdateIn(period: number, currentSeconds: number) {
    return period - (currentSeconds % period);
}

function percentageToDegrees(percentage: number) {
    return percentage / 100 * 360
}

function getInnerCountdown(period: number, currentSeconds: number): string {
  const updateIn = getUpdateIn(period, currentSeconds);
  const progress = 100 / period * (period - updateIn);
  let right = '';
  let left = '';
  if (progress <= 50) {
      right = ` style="transform: rotate(${percentageToDegrees(progress)}deg)"`;
  } else {
      right = ` style="transform: rotate(180deg)"`;
      left = ` style="transform: rotate(${percentageToDegrees(progress - 50)}deg)"`;
  }
  return `
      <span class="progress-left">
      <span class="progress-bar border-primary"${left}></span>
      </span>
      <span class="progress-right">
      <span class="progress-bar border-primary"${right}></span>
      </span>
      <div class="progress-value w-100 h-100 rounded-circle d-flex align-items-center justify-content-center">
      <div>${updateIn}</div>
      </div>`;
}

function getCountdown(period: number, currentSeconds: number, index: number) {
    return `
    <div class="progress mx-auto" id="countdown-${index}">
        ${getInnerCountdown(period, currentSeconds)}
    </div>`;
}

function getPeriod(service: any): number {
  let period = 30;
  if (service?.otp?.period) {
    period = service.otp.period;
  }

  return period;
}

function getDigits(service: any) {
  let digits = 6;

  if (service?.otp?.digits) {
    digits = service.otp.digits;
  }

  return digits;
}

function getToken(service: any, period: number) {
  let algorithm = 'SHA1';
  
  if (service?.otp?.algorithm) {
    algorithm = service.otp.algorithm;
  }

  const digits = getDigits(service);

  let token = '';
  if (service?.secret) {
    const totp = new OTPAuth.TOTP({
        algorithm,
        digits,
        period,
        secret: OTPAuth.Secret.fromBase32(stripSpaces(service.secret)),
      });
    token = truncateTo(totp.generate() , digits);
  }

  return token;
}

function getCard(service: any, currentSeconds: number, index: number): string {
    const period = getPeriod(service);
    const token = formatToken(getToken(service, period), getDigits(service));

    return `<div class="card mb-2">
    <div class="row g-0">
      <div class="col-3 d-flex align-items-center">
        ${getAvatar(service)}
      </div>
      <div class="col">
        <div class="card-body">
          <h1 class="fs-6">${service.name}</h1>
          <p class="fs-2 d-inline" id="token-${index}">${token}</p>
          <button class="btn copy-token d-inline m-2" id="copy-${index}">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-clipboard" viewBox="0 0 16 16">
              <path d="M4 1.5H3a2 2 0 0 0-2 2V14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V3.5a2 2 0 0 0-2-2h-1v1h1a1 1 0 0 1 1 1V14a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1V3.5a1 1 0 0 1 1-1h1z"/>
              <path d="M9.5 1a.5.5 0 0 1 .5.5v1a.5.5 0 0 1-.5.5h-3a.5.5 0 0 1-.5-.5v-1a.5.5 0 0 1 .5-.5zm-3-1A1.5 1.5 0 0 0 5 1.5v1A1.5 1.5 0 0 0 6.5 4h3A1.5 1.5 0 0 0 11 2.5v-1A1.5 1.5 0 0 0 9.5 0z"/>
            </svg>
          </button>
        </div>
      </div>
      <div class="col-3 d-flex align-items-center">
        ${getCountdown(period, currentSeconds, index)}
      </div>
    </div>
  </div>`;
}

function formatToken(token: string, digits: number): string {
  if (digits === 6) {
    token = token.replace(/.{3}/g, '$& ');
  } else if (digits === 8) {
    token = token.replace(/.{4}/g, '$& ');
  }
  return token.trimEnd();
}

let g_data : any;

function refresh() {
  const currentSeconds = getCurrentSeconds();

  g_data.services.forEach((service: any, index: number) => {
    const countdown = document.querySelector<HTMLDivElement>(`#countdown-${index}`);
    countdown.innerHTML = getInnerCountdown(getPeriod(service), currentSeconds);
    const tokenElement = document.querySelector(`#token-${index}`);
    const token1 = tokenElement.innerHTML;
    const token2 = formatToken(getToken(service, getPeriod(service)), getDigits(service));
    if (token1 != token2) {
      tokenElement.innerHTML = token2;
    }
});
}

function render() {
  const currentSeconds = getCurrentSeconds();
  app.innerHTML = '';
  g_data.services.forEach((service: any, index: number) => {
    const card = document.createElement('div');
    card.innerHTML = getCard(service, currentSeconds, index);
    app.append(card);
    const copyElement = document.querySelector<HTMLButtonElement>(`#copy-${index}`);
    copyElement.addEventListener('click', () => {
      const token = getToken(service, getPeriod(service));
      window.electronAPI.copyToken(token);
    });
  });
}

window.electronAPI.onLoadData((data: any) => {
  document.querySelector<HTMLDivElement>('#firstTime').outerHTML = '';
  g_data = data;
  setInterval(refresh, 1000);
  render();        
})

const app = document.querySelector<HTMLDivElement>('#app');
document.querySelector('#importButton').addEventListener('click', () => {
  window.electronAPI.requestImport();
});
window.electronAPI.requestData();
