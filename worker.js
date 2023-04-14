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
    database: 'caunoitot',
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




  const logDirectory = path.join(__dirname, 'logs');
  const now = new Date();

  var today = new Date();
var date = today.getFullYear()+'-'+(today.getMonth()+1)+'-'+today.getDate();
 // Define the log file name based on the current date and time
 const logFileName = `log_${date}.txt`;
  // Define the log file path
const logFilePath = path.join(logDirectory, logFileName);

function writeLog(message) {
    if(typeof message!=='string') {
        message = JSON.stringify(message);
    }
    require('fs').appendFileSync(logFilePath, message + '\n');
}
// Write the log message to the file

async function run() {
   
   

    try {
        writeLog("worker joblinks");
        writeLog(workerData);
        const jobDataPromises = workerData.jobLinks.map(async (jobLink) => {
            writeLog("launch browser");

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
                writeLog("wait until networkidle2");

            }

            writeLog("navigated");

            writeLog("start try");
            writeLog(`start going to ${jobLink}`);
            try {
                                        if(jobLink.match(/jobs\/(\d+)/)) {

                                            writeLog("joblink matched");

                                            const jobId = jobLink.match(/jobs\/(\d+)/)[1];            
                                            //UNcomment FOR TESTING
                                            // await page.goto("https://app.recruitery.co/jobs/9286");
                                            // await page.waitForNavigation({ waitUntil: 'networkidle2' });
                                            // const jobId = 9286;
                                            const client = await page.target().createCDPSession(); 
                                            await client.send('Page.setDownloadBehavior',
                                            {
                                                behavior: 'allow', 
                                                downloadPath: path.resolve('./defaultDownload'),  
                                            });

                                            //Initiate data for each Source
                                            var jobData = {
                                                source_site: "Recruitery",
                                                source_id: jobId,
                                            };
                                            writeLog(" extract jobTitle");
                                            const jobTitle = await page.$eval(
                                                '[class*="job-detail-header_job-detail-header__job-name"]',
                                                element => element.textContent.trim()
                                                );
                                            
                                            writeLog(jobTitle);
                                             

                                                writeLog(jobTitle);

                                                writeLog("TITLE ");
                                                jobData.title = jobTitle;


                                                const jobRewardSelector = 'span[class*="job-detail-header_job-detail-header__reward-number"]';
                                                const jobReward = await page.$eval(`${jobRewardSelector}`, el => el.textContent);
                                                writeLog(jobReward);
                                                jobData.reward = jobReward;
                                    
                                                //GET JOB TAGS
                                                const tagElements = await page.$$eval(`span.ant-tag`, tags => {
                                                return tags.map(tag => {
                                                    return tag.textContent.trim();
                                                });
                                                });
                                                writeLog("TAG elements");
                                                writeLog(tagElements);
                                    
                                                jobData.tags = JSON.stringify(tagElements);
                                        
                                                //GET JOB HEADER ATTRIBUTES
                                                for (const [key, headerAttribute] of Object.entries(headerAttributes)) {
                                                    const element = await page.$x(`//div[@class='ant-descriptions-item-container']//div[contains(text(), '${headerAttribute}')]`);
                                                    let headerContent = '';
                                                    if (element.length > 0) {
                                                    const nextElement = await element[0].$x('following-sibling::div[1]');
                                                    if (nextElement.length > 0) {
                                                        headerContent = await page.evaluate(el => el.textContent, nextElement[0]);
                                                        writeLog(`Content of the div next to '${headerAttribute}':`, headerContent.trim());
                                                    } else {
                                                        writeLog(`Div next to '${headerAttribute}' not found!`);
                                                    }
                                                    } else {
                                                    writeLog(`Div containing '${headerAttribute}' not found!`);
                                                    }
                                    
                                                    jobData[key] = headerContent.trim();
                                                }
                                                
                                                const jobMemoElement = await page.$('div.ant-alert-message div[class*=job-detail_job-detail__notice]');
                                                if(jobMemoElement.length > 0) {
                                                const jobMemo = await page.evaluate(element => element.textContent, jobMemoElement);
                                                writeLog("job memo  " + jobMemo);
                                                jobData.memo = jobMemo;
                                                };
                                                //END JOB HEADER ATTRIBUTES
                                    
                                                //GET JOB BENEFIT ATTRIBUTES
                                                // Find the div that contains the text "job-description_job-description" in its class
                                                const benefitDivSelector = 'div[class*="job-description_job-description"]';
                                                // Get all the h4 elements with class ant-list-item-meta-title inside the selected div
                                                // const benefitElements = await page.$$(`${benefitDivSelector} h4.ant-list-item-meta-title`);
                                                const benefitElements = await page.$$eval(`${benefitDivSelector} h4.ant-list-item-meta-title`, titles => {
                                                const benefitContents = {};
                                    
                                                titles.forEach(title => {
                                                    const titleText = title.textContent.trim();
                                                    const nextSibling = title.nextElementSibling;
                                                    const nextSiblingText = nextSibling ? nextSibling.textContent.trim() : '';
                                                    
                                                    benefitContents[titleText] = nextSiblingText;
                                                });
                                                return benefitContents;
                                                });
                                                writeLog(benefitElements);
                                    
                                                jobData.benefits = JSON.stringify(benefitElements);
                                                //END JOB BENEFIT ATTRIBUTES
                                    
                                                //GET JOB CONTENT 
                                                writeLog("GET ALL TITL 1 E");
                                    
                                                const jobContentSelector = 'h3[class*="edit-summary-view_edit-summary-view__heading"]';
                                                const jobContentDatas = await page.$$eval(`${jobContentSelector}`, (titles, jobContentAttributes) => {
                                                    const jobContents = {};
                                    
                                                    titles.forEach(title => {
                                                    const titleText = title.textContent.trim();
                                                    const nextSibling = title.nextElementSibling;
                                                    const nextSiblingText = nextSibling ? nextSibling.textContent.trim() : '';
                                                    jobContents[jobContentAttributes[titleText]] = nextSiblingText;
                                                    });
                                    
                                                    return jobContents;
                                                }, jobContentAttributes);
                                    
                                                jobData = Object.assign(jobData, jobContentDatas);
                                    
                                    
                                                //GET COMPANY DETAIL
                                                const companyNameElement = await page.$('div.ant-col-18 h3[class*=job-description_job-description__headin]:first-child');  
                                                const companyName = await page.evaluate(element => element.textContent, companyNameElement);
                                                writeLog("company name" + companyName);
                                    
                                                const companyDescriptionElement = await page.$('div.ant-row div.ant-col-24 p:first-child');  
                                                const companyDescription = await page.evaluate(element => element.textContent, companyDescriptionElement);
                                                writeLog("company desc" + companyDescription);
                                                
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
                                    
                                                jobData.company_name = companyName;
                                                jobData.company_description = companyDescription;
                                    
                                                const companyDetailSelector = 'div[class*="job-description_title"]';
                                                const companyDetailData = await page.$$eval(`${companyDetailSelector}`, (titles, companyAttributes) => {
                                                const companyContents = {};
                                    
                                                titles.forEach(title => {
                                                    const titleText = title.textContent.trim();
                                                    const nextSibling = title.nextElementSibling;
                                                    const nextSiblingText = nextSibling ? nextSibling.textContent.trim() : '';
                                    
                                                    companyContents[companyAttributes[titleText]] = nextSiblingText;
                                                });
                                    
                                                return companyContents;
                                                }, companyAttributes);
                                    
                                                writeLog(companyDetailData);
                                    
                                                jobData = Object.assign(jobData, companyDetailData);
                                                //END JOB CONTENT
                                    
                                    
                                                writeLog(`start download JD`);
                                                //LISTEN FILE DOWNLOAD
                                                const downloadFile = async (page, jobId) => {
                                                    // Wrap the download function inside a Promise
                                                    return new Promise(async (resolve) => {
                                                      // Listen for download response
                                                      page.on('response', async (response) => {
                                                        const contentType = response.headers()['content-type'];
                                                        const disposition = response.headers()['content-disposition'];
                                                        if (contentType === 'application/pdf' && disposition && disposition.indexOf('attachment') !== -1) {
                                                          const filenameRegex = /filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/;
                                                          const matches = filenameRegex.exec(disposition);
                                                          if (matches != null && matches[1]) {
                                                            const filename = `recruitery_${jobId}.pdf`;
                                                            await response.buffer().then(buffer => {
                                                              const pdfBuffer = Buffer.from(buffer, 'base64');
                                                              require('fs').writeFileSync(`./jd/recruitery/${filename}`, pdfBuffer);
                                                            });
                                                  
                                                            writeLog(`Downloaded file: ${filename}`);
                                                            // Resolve the promise to indicate that the download is complete
                                                            resolve(filename);
                                                          }
                                                        }
                                                      });
                                                    });
                                                  };
                                    
                                    
                                                writeLog("start Click download");
                                                //CLICK DOWNLOAD FILE 
                                                await page.click('.ant-card-extra .ant-space-item:first-child'); // some button that triggers file selection
                                                // const downloadBtn = await page.waitForSelector('div:contains("Download JD")');
                                                // await downloadBtn.click();
                                                await downloadFile(page, jobId);

                                            
                                                var today = new Date();
                                                var date = today.getFullYear()+'-'+(today.getMonth()+1)+'-'+today.getDate();
                                                var time = today.getHours() + ":" + today.getMinutes() + ":" + today.getSeconds();
                                                var dateTime = date+' '+time;

                                                jobData.updated_at = dateTime;
                                                  // Then you can use it with async/await like this:
                                                  
                                                  await new Promise((resolve, reject) => {
                                                    mySqlConnection.query(
                                                      'INSERT INTO job SET ? ON DUPLICATE KEY UPDATE ?', 
                                                      [jobData, jobData], 
                                                      function (err, result) {
                                                        if (err) reject(err);
                                                        writeLog("1 record inserted or updated, ID: " + result.insertId);
                                                        resolve(result);
                                                      }
                                                    );
                                                  });
                                    
                                                writeLog("INSERTED ");

                                                

                                        } else {
                                            writeLog("joblink not matched");

                                        }
            }  catch (err) {
                writeLog(err.message);
            } finally {

                console.log(`Done for ${jobLink}`);

                writeLog(" page closed ");

                writeLog(`Done for ${jobLink}`);

                await page.close();

                writeLog("wait browser close ");
                await browser.disconnect();
                if(jobData) {
                    return jobData;
                } else {
                    return  '';
                }
            
            }
    });

    const allJobData = await Promise.all(jobDataPromises);
    parentPort.postMessage(allJobData);
} catch (err) {
    console.error(`Error in worker ${workerData.workerId}:`, err);
    parentPort.postMessage({ error: err.message });
  } finally {
    parentPort.close();
    process.exit();
  }
}

run();
