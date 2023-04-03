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
    //real code
    // const maxPage = await page.evaluate(() => {
    //     const ul = document.querySelector('ul.ant-pagination'); // select the UL element with class name 'ant-pagination'
    //     const li = ul.children[ul.children.length - 3]; // select the 2nd last LI child
    //     const a = li.querySelector('a'); // select the anchor element inside the LI
    //     return a.textContent.trim();
    //   });

    // const maxPage = 1;
      
    //   for (let i = startPage; i <= maxPage; i++) {
    //     const url = recruiteryURL + i;
    //     await page.goto(`${url}`);
    //     await page.waitForNavigation({ waitUntil: 'networkidle2' });



        // const jobLinks = await page.$$eval('.ant-row div a', (anchors, searchText) => {
        //     const filteredAnchors = [];
        //     for (let i = 0; i < anchors.length; i++) {
        //       const anchor = anchors[i];
        //       if (anchor.textContent.trim() === searchText) {
        //         filteredAnchors.push(anchor.href);
        //       }
        //     }
        //     return filteredAnchors;
        //   }, 'Refer and earn');


        // for (const jobLink of jobLinks) {

        // await page.goto(jobLink);
        // await page.waitForNavigation({ waitUntil: 'networkidle2' });

            await page.goto("https://app.recruitery.co/jobs/9286");
            await page.waitForNavigation({ waitUntil: 'networkidle2' });
    
       
            const headerAttributes = {
              gross_month_salary: "Gross Monthly salary",
              total_vacancies: "Total vacancies:",
              level: "Level",
              employment_type: "Employment type",
              address: "Address",
              is_it_job: "Types",
            };

            for (const [key, headerAttribute] of Object.entries(headerAttributes)) {
                const element = await page.$x(`//div[@class='ant-descriptions-item-container']//div[contains(text(), '${headerAttribute}')]`);
                if (element.length > 0) {
                  const nextElement = await element[0].$x('following-sibling::div[1]');
                  if (nextElement.length > 0) {
                    const content = await page.evaluate(el => el.textContent, nextElement[0]);
                    console.log(`Content of the div next to '${headerAttribute}':`, content.trim());
                  } else {
                    console.log(`Div next to '${headerAttribute}' not found!`);
                  }
                } else {
                  console.log(`Div containing '${headerAttribute}' not found!`);
                }
            }

            
            // Find the div that contains the text "job-description_job-description" in its class
            const benefitDivSelector = 'div[class*="job-description_job-description"]';
            // Get all the h4 elements with class ant-list-item-meta-title inside the selected div
            // const benefitElements = await page.$$(`${benefitDivSelector} h4.ant-list-item-meta-title`);
            const benefitElements = await page.$$eval(`${benefitDivSelector} h4.ant-list-item-meta-title`, titles => {
              return titles.map(title => {
                const titleText = title.textContent.trim();
                const nextSibling = title.nextElementSibling;
                const nextSiblingText = nextSibling ? nextSibling.textContent.trim() : '';
                return [titleText, nextSiblingText];
              });
            });
            console.log(benefitElements);


            
            const jobContentSelector = 'h3[class*="edit-summary-view_edit-summary-view__heading"]';
            const jobContentElements = await page.$$eval(`${jobContentSelector}`, titles => {
              const jobContents = {};

              titles.forEach(title => {
                const titleText = title.textContent.trim();
                const nextSibling = title.nextElementSibling;
                const nextSiblingText = nextSibling ? nextSibling.textContent.trim() : '';
                jobContents[titleText] = nextSiblingText;
              });
              return jobContents;
            });
            console.log(jobContentElements);
            
          }

    // }

    // insert each URL into the database
    //   anchors.forEach(href => {
    //     connection.query(`INSERT INTO example (postname) VALUES ('${href}')`, (error, results, fields) => {
    //       if (error) throw error;
    //     });
    //   });
  


    // print html content of the website
    // await page.screenshot({path: 'example.png'});

    // await page.close();
    // await browser.close();
// }

run();