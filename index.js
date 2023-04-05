const puppeteer = require('puppeteer')
const fs = require('fs').promises;
const mysql = require('mysql');
const path = require('path');
const axios = require('axios');

const connection = mysql.createConnection({
  host: 'localhost',
  user: 'username',
  password: 'password',
  database: 'database_name',
});
//To convert from detail Title to DB column
const jobContentAttributes = {
  "Interview process": "interview_process",
  "Report to": "report_to",
  "Preferred skills and experiences": "preferred_skill",
  "Job overview and responsibility": "job_responsibility",              
};

const headerAttributes = {
  gross_month_salary: "Gross Monthly salary",
  total_vacancies: "Total vacancies:",
  level: "Level",
  employment_type: "Employment type",
  address: "Address",
  is_it_job: "Types",
  team_size: "Team size",
};


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

    //test with limited page 
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
            // const jobId = jobLink.match(/jobs(\d+)/)[1];

        
  
            await page.goto("https://app.recruitery.co/jobs/9286");
            await page.waitForNavigation({ waitUntil: 'networkidle2' });
            const jobId = 9286;


            const client = await page.target().createCDPSession(); 
            await client.send('Page.setDownloadBehavior',
             {
              behavior: 'allow', 
              downloadPath: path.resolve('./defaultDownload'),  
            });
    
            //GET JOB HEADER ATTRIBUTES
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

            const jobMemoElement = await page.$('div.ant-alert-message div[class*=job-detail_job-detail__notice]');
            const jobMemo = await page.evaluate(element => element.textContent, jobMemoElement);
            console.log("job memo  " + jobMemo);
            //END JOB HEADER ATTRIBUTES

            //GET JOB BENEFIT ATTRIBUTES
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
            //END JOB BENEFIT ATTRIBUTES

            //GET JOB CONTENT 
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
            //END JOB CONTENT


            //GET COMPANY DETAIL
            const companyNameElement = await page.$('div.ant-col-18 h3[class*=job-description_job-description__headin]:first-child');  
            const companyName = await page.evaluate(element => element.textContent, companyNameElement);
            console.log("company name" + companyName);

            const companyDescriptionElement = await page.$('div.ant-row div.ant-col-24 p:first-child');  
            const companyDescription = await page.evaluate(element => element.textContent, companyDescriptionElement);
            console.log("company desc" + companyDescription);
            //SAVE LOGO
            const companyLogoUrl = await page.$eval('div.ant-row div.ant-col-6 img', img => img.src);
            // Use axios to download the image as a buffer
            if(companyLogoUrl) {
              const imageBuffer = await axios({
                method: 'get',
                url: companyLogoUrl,
                responseType: 'arraybuffer'
              });

              // Write the buffer to a file using Node's fs module
              require('fs').writeFileSync(`img/company_logo/recruitery/${jobId}.jpg`, imageBuffer.data);
            }

            const companyDetailSelector = 'div[class*="job-description_title"]';
            const companyDetailElements = await page.$$eval(`${companyDetailSelector}`, titles => {
              const companyContents = {};

              titles.forEach(title => {
                const titleText = title.textContent.trim();
                const nextSibling = title.nextElementSibling;
                const nextSiblingText = nextSibling ? nextSibling.textContent.trim() : '';
                companyContents[titleText] = nextSiblingText;
              });
              return companyContents;
            });
            //END JOB CONTENT
            console.log(companyDetailElements);



            //LISTEN FILE DOWNLOAD
            page.on('response', async response => {
              //check for "Content-Disposition"
              const disposition = response.headers()['content-disposition'];
            
              if (disposition && disposition.indexOf('attachment') !== -1) {
                var filenameRegex = /filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/;
                var matches = filenameRegex.exec(disposition);
                if (matches != null && matches[1]) { 
                  
                  const filename = `recruitery_${jobId}.pdf`;
                  await response.buffer().then(buffer => {
                    // console.log(buffer.toString());
                    const pdfBuffer = Buffer.from(buffer, 'base64');
                    require('fs').writeFileSync("./jd/recruitery/" + filename, pdfBuffer);
                  });
                  console.log(`Downloaded file: ${filename}`);
                  //CLOSE PAGE AFTER DOWNLOAD
                  await page.close();
                }
              }
            });
            //CLICK DOWNLOAD FILE 
            await page.click('.ant-card-extra .ant-space-item:first-child'); // some button that triggers file selection
            // const downloadBtn = await page.waitForSelector('div:contains("Download JD")');
            // await downloadBtn.click();
          
    // }

    // insert each URL into the database
    //   anchors.forEach(href => {
    //     connection.query(`INSERT INTO example (postname) VALUES ('${href}')`, (error, results, fields) => {
    //       if (error) throw error;
    //     });
    //   });

    // await page.close();
    // await browser.close();
// }
}

run();