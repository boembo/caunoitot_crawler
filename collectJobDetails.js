const puppeteer = require('puppeteer')
const fs = require('fs').promises;
const mysql = require('mysql');
const path = require('path');
const axios = require('axios');
const { Worker, workerData, parentPort } = require('worker_threads');
const FormData = require('form-data');
const moment = require('moment');


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


  
  function writeLog(jobLink, message) {
    const logDirectory = path.join(__dirname, 'logs');
    const today = new Date();
    const date = today.toISOString().split('T')[0]; // Use ISO date format
  
    // Create the log directory if it doesn't exist
      fs.mkdir(logDirectory, { recursive: true });
  
      if(jobLink.match(/jobs\/(\d+)/)) {

          const jobId = jobLink.match(/jobs\/(\d+)/)[1]; 

          // Sanitize the jobId if needed
          const sanitizedJobId = jobId.replace(/[^\w\-]/g, '_'); // Replace non-word characters with underscores
        
          // Define the log file name based on the sanitized jobId and the current date
          const logFileName = `log_${sanitizedJobId}_${date}.txt`;
          
          // Define the log file path
          const logFilePath = path.join(logDirectory, logFileName);
        
          try {
            if (typeof message !== 'string') {
              message = JSON.stringify(message);
            }
            fs.appendFile(logFilePath, message + '\n');
          } catch (error) {
            console.error('Error writing to log:', error);
          }

      } else {
        console.error('LOG INVALID JOB LINK:', jobLink);
      }
  }
  
// Write the log message to the file

async function sendCrawledDataAndPDF(jobData, jobId) {
  try {

    const form = new FormData();
    
    // Append JSON data as fields
    form.append('jobData', JSON.stringify(jobData));
    
    form.append('jobId', jobId);

    // Get the directory path of the current script
    const scriptDirectory = __dirname;

    // Append the PDF file
    const pdfStream = await fs.readFile(scriptDirectory + '/jd/recruitery/recruitery_' + jobId + '.pdf', { encoding: 'base64' });
    form.append('pdfBase64', pdfStream);
    
    const companyLogo = await fs.readFile(scriptDirectory + '/img/company_logo/recruitery/' + jobId + '.jpg', { encoding: 'base64' });
    form.append('companyLogoBase64', companyLogo);

    // Send the form data to the API
    const response = await axios.post('https://viecthom.com/api/saveCrawlData/recruitery', form, {
      headers: {
        ...form.getHeaders(),
      },
    });

    // const response = await axios.post('http://localhost:3000/api/saveCrawlData/recruitery', form, {
    //   headers: {
    //     ...form.getHeaders(),
    //   },
    // });


    console.log('Crawled data and PDF sent to the API.');

    // Introduce a 2-second delay before returning
    await new Promise(resolve => setTimeout(resolve, 2000));

    return response;

  } catch (error) {
    console.error('Error sending data and PDF:', error);
  }
}

async function collectJobDetails(page, jobLink) {
   
  var jobId = jobLink.match(/jobs\/(\d+)/)[1];            
   

    try {
            //Uncomment FOR Production
            await page.setDefaultNavigationTimeout(300000);
            await page.goto(jobLink);

            try {
                await page.waitForNavigation({ timeout: 50000, waitUntil: 'networkidle2' });
                

            } catch (err) {
                writeLog(jobLink, "wait until networkidle2");

            }

            writeLog(jobLink, "start try");
            writeLog(jobLink, `start going to ${jobLink}`);
            try {
                  if(jobLink.match(/jobs\/(\d+)/)) {

                      writeLog(jobLink, "joblink matched");

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
                          source_site: "recruitery",
                          source_id: jobId,
                      };

                      // Take a screenshot
                        // const screenshotBuffer = await page.screenshot();
                        
                        // Save the screenshot to disk
                        // await fs.writeFile('screenshot' + jobId + '.png', screenshotBuffer);
                        
                        // console.log('Screenshot saved to disk.');

                        await new Promise(resolve => setTimeout(resolve, 2000));

                        const screenshotBuffer = await page.screenshot();

                        // Get the directory path of the current script
                        const scriptDirectory = __dirname;
                    
                        // Define the folder name where you want to save the file
                        const folderName = 'screenshots';
                    
                        // Create the full path for the folder
                        const folderPath = path.join(scriptDirectory, folderName);
                    
                        // Create the folder if it doesn't exist
                        await fs.mkdir(folderPath, { recursive: true });
                    
                        // Define the file path within the folder
                        const filePath = path.join(folderPath,'screenshot' + jobId + '.png');
                    
                        // Save the screenshot to the specified file path
                        await fs.writeFile(filePath, screenshotBuffer);
                    
                        console.log('Screenshot saved to:', filePath);

                          writeLog(jobLink, " extract jobTitle");
                          const jobTitle = await page.$eval(
                          '[class*="job-detail-header_job-detail-header__job-name"]',
                              element => element.textContent
                          );                        

                          writeLog(jobLink,jobTitle);

                          writeLog(jobLink, "TITLE ");
                          jobData.title = jobTitle;


                          let jobReward = '';
                          const jobRewardSelector = 'span[class*="job-detail-header_job-detail-header__reward-number"]';
                          if(jobRewardSelector) {
                            jobReward = await page.$eval(`${jobRewardSelector}`, el => el.textContent);
                          }
                          writeLog(jobLink,jobReward);
                          jobData.original_reward = jobReward;
              
                          //GET JOB TAGS
                          const tagElements = await page.$$eval(`div[class*="edit-information-view_edit-information-view__info-skills"] span.ant-tag`, tags => {
                          return tags.map(tag => {
                              return tag.textContent.trim();
                          });
                          });
                          writeLog(jobLink, "TAG elements");
                          writeLog(jobLink,tagElements);
              
                          jobData.tags = JSON.stringify(tagElements);
                  
                          //GET JOB HEADER ATTRIBUTES
                          for (const [key, headerAttribute] of Object.entries(headerAttributes)) {
                              const element = await page.$x(`//div[@class='ant-descriptions-item-container']//div[contains(text(), '${headerAttribute}')]`);
                              let headerContent = '';
                              if (element.length > 0) {
                              const nextElement = await element[0].$x('following-sibling::div[1]');
                              if (nextElement.length > 0) {
                                  headerContent = await page.evaluate(el => el.textContent, nextElement[0]);
                                  writeLog(jobLink, `Content of the div next to '${headerAttribute}':`, headerContent);
                              } else {
                                  writeLog(jobLink, `Div next to '${headerAttribute}' not found!`);
                              }
                              } else {
                              writeLog(jobLink, `Div containing '${headerAttribute}' not found!`);
                              }
              
                              jobData[key] = headerContent.trim();
                          }
                          
                          const jobMemoElement = await page.$('.ant-alert-message div[class*="job-detail_job-detail__notice-text"]');
                          if(jobMemoElement) {
                            const jobMemo = await page.evaluate(element => element.innerHTML, jobMemoElement);
                            writeLog(jobLink, "job memo  " + jobMemo);
                            jobData.memo = jobMemo.replace('Recruitery', 'Viecthom').replace('recruitery', 'Viecthom');
                          } else {
                            jobData.memo = "";
                          }
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
                          writeLog(jobLink,benefitElements);
              
                          jobData.benefits = JSON.stringify(benefitElements);
                          //END JOB BENEFIT ATTRIBUTES
              
                          //GET JOB CONTENT 
                          // writeLog(jobLink, "GET ALL TITL 1 E");
              
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
                          let companyName = '';
                          const companyNameElement = await page.$('div.ant-col-18 h3[class*="company-profile-view_company-profile-view__heading"]:first-child');
                          if(companyNameElement) {
                            companyName = await page.evaluate(element => element.textContent, companyNameElement);
                          }
                          writeLog(jobLink, "company name " + companyName);
              
                          let companyDescription = '';
                          const companyDescriptionElement = await page.$('div.ant-card-body div.ant-row div.ant-col-24 div:first-child'); 
                          if(companyDescriptionElement) {
                            companyDescription = await page.evaluate(element => element.innerHTML, companyDescriptionElement);
                          }
                         
                          writeLog(jobLink, "company desc " + companyDescription);

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
              
                          writeLog(jobLink,companyDetailData);
              
                          jobData = Object.assign(jobData, companyDetailData);
                          //END JOB CONTENT
              
              
                          writeLog(jobLink, `start download JD`);
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
                            
                                      writeLog(jobLink, `Downloaded file: ${filename}`);
                                      // Resolve the promise to indicate that the download is complete
                                      resolve(filename);
                                    }
                                  }
                                });
                              });
                            };
              
              
                          writeLog(jobLink, "start Click download");
                          //CLICK DOWNLOAD FILE 
                          // await page.click('.ant-card-extra .ant-space-item:first-child'); // some button that triggers file selection

                          const downloadBtn = await page.waitForXPath('//div[contains(text(), "Download JD")]', { timeout: 20000 }); // Waits for 10 seconds
                          await downloadBtn.click();
                          await downloadFile(page, jobId);

                      
                          //test
                          jobData.updated_at = moment().format('YYYY-MM-DD hh:mm:ss');

                            // Then you can use it with async/await like this:
                            await new Promise((resolve, reject) => {

                              // const response = await axios.post('http://localhost:3000/api/saveCrawlData/recruitery', jobData);

                              sendCrawledDataAndPDF(jobData, jobId);

                              writeLog(jobLink, "SEND API ");

                              resolve(1);
                              // mySqlConnection.query(
                              //   'INSERT INTO job SET ? ON DUPLICATE KEY UPDATE ?', 
                              //   [jobData, jobData], 
                              //   function (err, result) {
                              //     if (err) reject(err);
                              //     writeLog(jobLink, "1 record inserted or updated, ID: " + result.insertId);
                              //     resolve(result);
                              //   }
                              // );
                            });
              
                          writeLog(jobLink, "INSERTED ");
                  } else {
                      writeLog(jobLink, "joblink not matched");

                  }
            }  catch (err) {
                writeLog(jobLink, err.message);
            } finally {
                writeLog(jobLink, " page closed ");
                writeLog(jobLink, `Done for ${jobLink}`);
                writeLog(jobLink, "wait browser close ");
                if(jobData) {
                  console.log(jobId);
                    // return jobData;
                    return jobId;
                } else {
                  console.log("Failted");
                    return  '';
                }
            }

    return jobData;
} catch (err) {
    console.error(`Error in worker :`, err);
  } finally {
    console.error("FINISHED JOB");
  }
}

module.exports = {
  collectJobDetails,
};