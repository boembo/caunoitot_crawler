const puppeteer = require('puppeteer')
const fs = require('fs').promises;
const mysql = require('mysql');
const path = require('path');
const axios = require('axios');
const { Worker } = require('worker_threads');
const FormData = require('form-data');

const { collectJobDetails } = require('./collectJobDetails.js');

const mySqlConnection = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'caunoitot',
});

const MAX_CONCURRENCY = 4;
const MAX_BROWSERS = 8;

async function run(){

    const browserPool = await Promise.all(
      Array.from({ length: MAX_BROWSERS }).map(() => puppeteer.launch(
        {
          headless: true,
          ignoreHTTPSErrors: true,
          //executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe',
         args: ["--disable-notifications", "--no-sandbox"],
        //  args: ["--disable-notifications", "--lang=en-US,en", '--no-sandbox', '--disable-setuid-sandbox', '--disable-extensions'],

          // userDataDir:"C:\\Users\\rin rin\\AppData\\Local\\Chromium\\User Data"
          defaultViewport: null,
          // downloadsPath: './downloads',
        }))
    );

    const pageQueues = Array.from({ length: MAX_BROWSERS }).map(() => []);

    let currentBrowserIndex = 0;
    const browser = browserPool[currentBrowserIndex];

    var crawledJobId = [];

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
    await page.goto('https://app.recruitery.co/jobs?page=1&advance=10%2C30%2C40&status=5', {
        waitUntil: 'domcontentloaded',
        timeout: 90000
    });

    // await page.waitFor(3000);
    //test with limited page 
    // const maxPage = 9;

    // Wait for ul.ant-pagination to become visible
    await page.waitForSelector('ul.ant-pagination', { visible: true });
    //Pagination UL
    //real code
    const maxPage = await page.evaluate(() => {
        const ul = document.querySelector('ul.ant-pagination'); // select the UL element with class name 'ant-pagination'
        const li = ul.children[ul.children.length - 3]; // select the 2nd last LI child
        const a = li.querySelector('a'); // select the anchor element inside the LI
        return a.textContent.trim();
      });

    //  const maxPage = 1;
      console.log('maxpage');
      console.log(maxPage);

        // Get the job links from all pages and split them into chunks for parallel processing
      const allJobLinks = [];
      //REAL CODE
      for (let i = startPage; i <= maxPage; i++) {
        //uncomment for Production
        const pageUrl = recruiteryURL + i;

        console.log('visiting page ' + pageUrl);
      // console.log(maxPage);


        await page.goto(`${pageUrl}`, {waitUntil: 'domcontentloaded', timeout: 180000 });
        // await page.waitForNavigation({timeout: 180000 });


        console.log('loaded');
        // await page.waitForSelector('body', { visible: true });

        // await page.waitForSelector('body', {visible: true})


        const screenshotBuffer = await page.screenshot();

        // Get the directory path of the current script
        const scriptDirectory = __dirname;
    

        console.log('taked Screenshot ' + pageUrl);

        // Define the folder name where you want to save the file
        const folderName = 'screenshots';
    
        // Create the full path for the folder
        const folderPath = path.join(scriptDirectory, folderName);
    
        // Create the folder if it doesn't exist
        await fs.mkdir(folderPath, { recursive: true });
    
        // Define the file path within the folder
        const filePath = path.join(folderPath,'page_' + i + '.png');
    
        // Save the screenshot to the specified file path
        await fs.writeFile(filePath, screenshotBuffer);
    
        console.log('Screenshot saved to:', filePath);

        await new Promise(resolve => setTimeout(resolve, 1000));


        console.log(`go to page ${i}`);

        // const maxPage = await page.evaluate(() => {
        //   const ul = document.querySelector('ul.ant-pagination'); // select the UL element with class name 'ant-pagination'
        //   const li = ul.children[ul.children.length - 3]; // select the 2nd last LI child
        //   const a = li.querySelector('a'); // select the anchor element inside the LI
        //   return a.textContent.trim();
        // });

        await page.waitForSelector('ul.ant-pagination', {visible: true})

        console.log('found pagination selector');


        await new Promise(resolve => setTimeout(resolve, 2000));
 


         const jobLinks = await page.$$eval('.ant-row div a[class*=jobs-hunter-item_jobs-hunter-item]', (anchors, searchText) => {
            const filteredAnchors = [];
            for (let i = 0; i < anchors.length; i++) {
              const anchor = anchors[i];

              //in case wanna select all uncomment this
              const premiumDiv = anchor.querySelector('div[class*=jobs-hunter-item_jobs-hunter-item__container--premium]');
              if(!premiumDiv) {
                filteredAnchors.push(anchor.href);

              }
              //End filter premium job

              // filteredAnchors.push(anchor.href);
            }
            return filteredAnchors;
          }, 'Refer and earn');

  
          allJobLinks.push(...jobLinks);
          //Wait 2 second before go next page
          await new Promise(resolve => setTimeout(resolve, 5000)); 

      }

      console.log('all jobs found');
      console.log(allJobLinks.length);


      
      // return;

      //Must reverse the array because the newest job will must be insert later on DB 
      for (const jobUrl of allJobLinks.reverse()) {
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

          console.log('start crawling' + jobUrl);

          await new Promise(resolve => setTimeout(resolve, 2000));
    
          try {
            // Collect job details here
            const jobId = await collectJobDetails(page, jobUrl);

            console.log("kekka" + jobId);


            crawledJobId.push(jobId);
            console.log("Done" + jobId);
          } catch (err) {
            console.error(err);
          } finally {
            await page.close();

            await new Promise(resolve => setTimeout(resolve, 2000));

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
    

  
    const form = new FormData();
    form.append('crawledJobId', JSON.stringify(crawledJobId));
    // const response = await axios.post('http://localhost:3000/api/saveCrawlData/recruitery_completed', form, {
    //   headers: {
    //     ...form.getHeaders(),
    //   },
    // });

        // Send the form data to the API
        const response = await axios.post('https://viecthom.com/api/saveCrawlData/recruitery_completed', form, {
          headers: {
            ...form.getHeaders(),
          },
        });

    console.log("Sent COMPLETED API");

    await Promise.all(browserPool.map(browser => browser.close()));

}

run();