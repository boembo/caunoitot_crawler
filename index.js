const puppeteer = require('puppeteer');
const chrome = require('chrome-cookies-secure');

const url = 'https://recruitery.co';

const getCookies = (callback) => {
    chrome.getCookies(url, 'puppeteer', function(err, cookies) {
        if (err) {
            console.log(err, 'error');
            return
        }
        console.log(cookies, 'cookies');
        callback(cookies);
    }, 'Default') // e.g. 'Profile 2'
}

// find profiles at ~/Library/Application Support/Google/Chrome

getCookies(async (cookies) => {
    const browser = await puppeteer.launch({
        headless: false
    });
    const page = await browser.newPage();

    await page.setCookie(...cookies);
    await page.goto(url);
    await page.screenshot("examples.png");
    browser.close()
});