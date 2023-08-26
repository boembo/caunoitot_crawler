const puppeteer = require('puppeteer')
const fs = require('fs').promises;
const mysql = require('mysql');
const path = require('path');
const axios = require('axios');
const { Worker } = require('worker_threads');

const { collectJobDetails } = require('./collectJobDetails.js');

const mySqlConnection = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'caunoitot',
});

const MAX_CONCURRENCY = 10;
const MAX_BROWSERS = 4;

async function run(){

    const browserPool = await Promise.all(
      Array.from({ length: MAX_BROWSERS }).map(() => puppeteer.launch(
        {
          headless: false,
          ignoreHTTPSErrors: true,
          //executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe',
         // args: ["--lang=en-US,en", '--no-sandbox', '--disable-setuid-sandbox', '--disable-extensions']
          // userDataDir:"C:\\Users\\rin rin\\AppData\\Local\\Chromium\\User Data"
          defaultViewport: null,
          // downloadsPath: './downloads',
        }))
    );

    const pageQueues = Array.from({ length: MAX_BROWSERS }).map(() => []);

    let currentBrowserIndex = 0;
    const browser = browserPool[currentBrowserIndex];

    const page = await browser.newPage();
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
    //selected Ha noi, HCM, Japan, Danang
    //Just Select Headhunting
    const startPage = 1;
    const recruiteryURL = "https://app.recruitery.co/jobs?advance=30%2C40%2C10&status=5&page=";
    await page.goto('https://app.recruitery.co/vi/jobs?page=1&advance=10%2C30%2C40', {
        waitUntil: 'networkidle0',
    });

    //test with limited page 
    const maxPage = 1;

    
    //Pagination UL
    //real code
    // const maxPage = await page.evaluate(() => {
    //     const ul = document.querySelector('ul.ant-pagination'); // select the UL element with class name 'ant-pagination'
    //     const li = ul.children[ul.children.length - 3]; // select the 2nd last LI child
    //     const a = li.querySelector('a'); // select the anchor element inside the LI
    //     return a.textContent.trim();
    //   });

    
        // Get the job links from all pages and split them into chunks for parallel processing
      const allJobLinks = [];
      //REAL CODE
      for (let i = startPage; i <= maxPage; i++) {
        //uncomment for Production
        const pageUrl = recruiteryURL + i;
        await page.goto(`${pageUrl}`);
        await page.waitForNavigation({ waitUntil: 'networkidle2' });

        console.log(`go to page ${i}`);

        const jobLinks = await page.$$eval('.ant-row div a[class*=jobs-hunter-item_jobs-hunter-item]', (anchors, searchText) => {
            const filteredAnchors = [];
            for (let i = 0; i < anchors.length; i++) {
              const anchor = anchors[i];
              filteredAnchors.push(anchor.href);
            }
            return filteredAnchors;
          }, 'Refer and earn');

          allJobLinks.push(...jobLinks);
      }

      for (const jobUrl of allJobLinks) {
        const pagePromise = (async () => {
          const browser = browserPool[currentBrowserIndex];
          const pageQueue = pageQueues[currentBrowserIndex];
    
          const page = await browser.newPage();
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
    
          try {
            // Collect job details here
            const jobDetails = await collectJobDetails(page, jobUrl);
            console.log(jobDetails);
          } catch (err) {
            console.error(err);
          } finally {
            await page.close();
            const index = pageQueue.indexOf(pagePromise);
            if (index >= 0) {
              pageQueue.splice(index, 1);
            }
          }
        })();
        pageQueues[currentBrowserIndex].push(pagePromise);
        currentBrowserIndex = (currentBrowserIndex + 1) % MAX_BROWSERS;
        const pageQueue = pageQueues[currentBrowserIndex];
        if (pageQueue.length >= MAX_CONCURRENCY) {
          await Promise.all(pageQueue);
          pageQueue.length = 0;
        }
      }
    
      // Process any remaining pages in the queues
      for (const pageQueue of pageQueues) {
        await Promise.all(pageQueue);
      }
    
      await Promise.all(browserPool.map(browser => browser.close()));
}

run();