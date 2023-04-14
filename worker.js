const puppeteer = require('puppeteer')
const fs = require('fs').promises;
const mysql = require('mysql');
const path = require('path');
const axios = require('axios');
const { Worker, workerData, parentPort } = require('worker_threads');

const mySqlConnection = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'caunoitot_job',
  });


const ignoreList = {
    memo: [9323,9136],
  }
  //To convert from detail Title to DB column
  var jobContentAttributes = {
    "Interview process": "interview_process",
    "Report to": "report_to",
    "Preferred skills and experiences": "preferred_skill",
    "Job overview and responsibility": "job_responsibility",  
    "Required skills and experiences": "job_required_skill",
    "Why Candidate should apply this position": "why_should_apply" 
  };
  
  var companyAttributes = {
    'Team size': 'company_team_size',
    'Address': 'company_address',
    'website': 'company_website',
    'Working hours': 'company_working_hour'
  }
  
  var headerAttributes = {
    gross_month_salary: "Gross Monthly salary",
    total_vacancies: "Total vacancies:",
    level: "Level",
    employment_type: "Employment type",
    job_address: "Address",
    is_it_job: "Types",
    job_team_size: "Team size",
    //note may be multiple location : "Ha noi, Da Nang"
    job_location: "Location",
  };


async function run() {
    try {
        console.log("worker joblinks");
        console.log(workerData);
        const jobDataPromises = workerData.jobLinks.map(async (jobLink) => {
            console.log("launch browser");

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
            //Uncomment FOR Production
            // await page.setDefaultNavigationTimeout(300000);
            await page.goto(jobLink);

            try {
                await page.waitForNavigation({ timeout: 5000, waitUntil: 'networkidle2' });
                

            } catch (err) {
                console.log("wait until networkidle2");

            }

            console.log("navigated");

            parentPort.postMessage({ error: "crawling" });
            parentPort.postMessage({ error: jobLink });


            console.log("start try");
            console.log(`start going to ${jobLink}`);
            try {
                                        

                                        

                                        if(jobLink.match(/jobs\/(\d+)/)) {

                                            console.log("joblink matched");

                                            const jobId = jobLink.match(/jobs\/(\d+)/)[1];            
                                            //UNcomment FOR TESTING
                                            // await page.goto("https://app.recruitery.co/jobs/9286");
                                            // await page.waitForNavigation({ waitUntil: 'networkidle2' });
                                            // const jobId = 9286;


                                            console.log("CREATE dcp SESSION");

                                            const client = await page.target().createCDPSession(); 
                                            await client.send('Page.setDownloadBehavior',
                                            {
                                                behavior: 'allow', 
                                                downloadPath: path.resolve('./defaultDownload'),  
                                            });

                                            console.log(" CREATED ");
                                            //Initiate data for each Source
                                            var jobData = {
                                                source_site: "Recruitery",
                                                source_id: jobId,
                                            };
                                            console.log(" extract jobTitle");
                                                try {
                                                    const jobTitle = await page.$eval(
                                                        '[class*="job-detail-header_job-detail-header__job-name"]',
                                                        element => element.textContent.trim()
                                                      );
                                                    
                                                      console.log(jobTitle);
                                                
                                                } catch (err) {
                                                    console.log(err.message);
                                                }

                                                console.log(jobTitle);

                                                console.log("TITLE ");
                                                jobData.title = jobTitle;


                                        } else {
                                            console.log("joblink not matched");

                                        }
            }  catch (err) {
                parentPort.postMessage({ error: err.message });
            } finally {

                console.log("wait page close ");

                await page.close();

                console.log("wait browser close ");
                await browser.close();
                return jobData;
            }
    });

    const jobData = await Promise.all(jobDataPromises);
    parentPort.postMessage(jobData);
} catch (err) {
    console.error(`Error in worker ${workerData.workerId}:`, err);
    parentPort.postMessage({ error: err.message });
  } finally {
    parentPort.close();
    process.exit();
  }
}

run();
