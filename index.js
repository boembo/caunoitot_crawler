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
  database: 'caunoitot_job',
});

const NUM_THREADS = 4;



async function run(){
    // First, we must launch a browser instance
    const browser = await puppeteer.launch({
        headless: false,
        ignoreHTTPSErrors: true,
        //executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe',
       // args: ["--lang=en-US,en", '--no-sandbox', '--disable-setuid-sandbox', '--disable-extensions']
        // userDataDir:"C:\\Users\\rin rin\\AppData\\Local\\Chromium\\User Data"
        defaultViewport: null,
        // downloadsPath: './downloads',
    })

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
    const recruiteryURL = "https://app.recruitery.co/jobs?location=1%2C1019%2C2%2C1006%2C3&&advance=30%2C40%2C10&status=5&page=";
    await page.goto('https://app.recruitery.co/jobs?page=1&location=1%2C1019%2C2%2C1006%2C3&advance=30%2C40%2C10&status=5', {
        waitUntil: 'networkidle0',
    });


    //Pagination UL
    //real code
    const maxPage = await page.evaluate(() => {
        const ul = document.querySelector('ul.ant-pagination'); // select the UL element with class name 'ant-pagination'
        const li = ul.children[ul.children.length - 3]; // select the 2nd last LI child
        const a = li.querySelector('a'); // select the anchor element inside the LI
        return a.textContent.trim();
      });

    //test with limited page 
    // const maxPage = 1;
        // Get the job links from all pages and split them into chunks for parallel processing
      const allJobLinks = [];
      //REAL CODE
      for (let i = startPage; i <= 3; i++) {
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

      const pageQueue = [];

  for (const jobUrl of allJobLinks) {
    const pagePromise = (async () => {
      const page = await browser.newPage();
      try {
        await collectJobDetails(page, jobUrl);
        // Collect job details here
        console.log(await page.title());
      } catch (err) {
        console.error(err);
      } finally {
        await page.close();
      }
    })();
    pageQueue.push(pagePromise);
    if (pageQueue.length >= 10) {
      await Promise.all(pageQueue);
      pageQueue.length = 0;
    }
  }

  // Process any remaining jobs in the queue
  await Promise.all(pageQueue);

  await browser.close();
}

run();