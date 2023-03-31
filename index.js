const puppeteer = require('puppeteer')
const fs = require('fs').promises;

async function run(){
    // First, we must launch a browser instance
    const browser = await puppeteer.launch({
        headless: true,
        ignoreHTTPSErrors: true,
        //executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe',
       // args: ["--lang=en-US,en", '--no-sandbox', '--disable-setuid-sandbox', '--disable-extensions']
        // userDataDir:"C:\\Users\\rin rin\\AppData\\Local\\Chromium\\User Data"
    })

    let page = await browser.newPage();
    const cookiesString = await fs.readFile('./cookie.json');
    const cookies = JSON.parse(cookiesString);

    const localStorages = await fs.readFile('./localstorage.txt');
    const lStorage = JSON.parse(localStorages);
    
    await page.evaluateOnNewDocument((data) => {
        for (const [key, value] of Object.entries(data)) {
            localStorage.setItem(key, value);
        }
      }, lStorage);
      
    await page.setCookie(...cookies.cookies);
    // and tell it to go to some URL
    await page.goto('https://app.recruitery.co/jobs', {
        waitUntil: 'networkidle0',
    });

    // print html content of the website
    await page.screenshot({path: 'example.png'});
    
    await page.close();
    await browser.close();
}

run();