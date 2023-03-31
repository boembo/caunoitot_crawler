const puppeteer = require('puppeteer')
const fs = require('fs').promises;
const mysql = require('mysql');

const connection = mysql.createConnection({
  host: 'localhost',
  user: 'username',
  password: 'password',
  database: 'database_name',
});

async function run(){
    // First, we must launch a browser instance
    const browser = await puppeteer.launch({
        headless: false,
        ignoreHTTPSErrors: true,
        //executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe',
       // args: ["--lang=en-US,en", '--no-sandbox', '--disable-setuid-sandbox', '--disable-extensions']
        // userDataDir:"C:\\Users\\rin rin\\AppData\\Local\\Chromium\\User Data"
        defaultViewport: null,
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
    //selected Ha noi, HCM, Japan, Danang
    //Just Select Headhunting
    const startPage = 1;
    const recruiteryURL = "https://app.recruitery.co/jobs?location=1%2C1019%2C2%2C1006%2C3&page=";
    await page.goto('https://app.recruitery.co/jobs?page=1&location=1%2C1019%2C2%2C1006%2C3', {
        waitUntil: 'networkidle0',
    });
    //Pagination UL
    const maxPage = await page.evaluate(() => {
        const ul = document.querySelector('ul.ant-pagination'); // select the UL element with class name 'ant-pagination'
        const li = ul.children[ul.children.length - 3]; // select the 2nd last LI child
        const a = li.querySelector('a'); // select the anchor element inside the LI
        return a.textContent.trim();
      });
      
      for (let i = startPage; i <= maxPage; i++) {
        const url = recruiteryURL + i;
        await page.goto(`${url}`);
        await page.waitForNavigation({ waitUntil: 'networkidle2' });

        const sel = ".flex--item.mb12.fs-headline2.lh-xs";
        const el = await page.waitForSelector(sel);
        // usernames.push(await el.evaluate(el => el.textContent.trim()));

        // chatGPT example
        // const anchors = await page.evaluate(() => {
        //     const anchorNodes = document.querySelectorAll('ul a'); // select all the anchor tags inside UL elements
        //     const anchorArray = Array.from(anchorNodes); // convert the NodeList to an Array
        //     const hrefs = anchorArray.map(anchor => anchor.href); // extract the href attribute from each anchor
        //     return hrefs; // return the array of hrefs
        //   });
    }

      // insert each URL into the database
    //   anchors.forEach(href => {
    //     connection.query(`INSERT INTO example (postname) VALUES ('${href}')`, (error, results, fields) => {
    //       if (error) throw error;
    //     });
    //   });
  
      console.log(`Page ${i} anchors inserted into database`); 

      console.log(maxPage); // output the value

    // print html content of the website
    // await page.screenshot({path: 'example.png'});

    // await page.close();
    // await browser.close();
}

run();