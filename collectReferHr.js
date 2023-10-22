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
  
  // var headerAttributes = {
  //   gross_month_salary: "Gross Monthly salary",
  //   total_vacancies: "Total vacancies:",
  //   level: "Level",
  //   employment_type: "Employment type",
  //   job_address: "Address",
  //   is_it_job: "Types",
  //   job_team_size: "Team size",
  //   //note may be multiple location : "Ha noi, Da Nang"
  //   job_location: "Location",
  // };


  
  function writeLog(jobLink, message) {
    const logDirectory = path.join(__dirname, 'logs');
    const today = new Date();
    const date = today.toISOString().split('T')[0]; // Use ISO date format
  
    // Create the log directory if it doesn't exist
      fs.mkdir(logDirectory, { recursive: true });
      // jobLink.match(/id=(\d+)/)[1];
      if(jobLink.match(/id=(\d+)/)) {

          const jobId = jobLink.match(/id=(\d+)/)[1]; 
        
          // Define the log file name based on the sanitized jobId and the current date
          const logFileName = `log_${jobId}_${date}.txt`;
          
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
    // const pdfStream = await fs.readFile(scriptDirectory + '/jd/referhr/referhr_' + jobId + '.pdf', { encoding: 'base64' });
    // form.append('pdfBase64', pdfStream);
    
    const companyLogo = await fs.readFile(scriptDirectory + '/img/company_logo/referhr/' + jobId + '.jpg', { encoding: 'base64' });
    form.append('companyLogoBase64', companyLogo);

    // Send the form data to the API
    // const response = await axios.post('https://viecthom.com/api/saveCrawlData/referhr', form, {
    //   headers: {
    //     ...form.getHeaders(),
    //   },
    // });

    const response = await axios.post('http://localhost:3000/api/saveCrawlData/referhr', form, {
      headers: {
        ...form.getHeaders(),
      },
    });


    console.log('Crawled data and PDF sent to the API.');

    // Introduce a 2-second delay before returning
    await new Promise(resolve => setTimeout(resolve, 2000));

    return response;

  } catch (error) {
    console.error('Error sending data and PDF:', error);
  }
}

async function collectJobDetails(page, jobLink) {
   
  // var jobId = jobLink.match(/id=\/(\d+)/)[1];  
  
  var jobId = jobLink.match(/id=(\d+)/)[1];
  
   console.log("jobId" + jobId);
   

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
                  if(jobLink.match(/id=(\d+)/)) {

                      writeLog(jobLink, "joblink matched");

                      const jobId = jobLink.match(/id=(\d+)/)[1];         
                      //UNcomment FOR TESTING
                      // await page.goto("https://app.referhr.co/jobs/9286");
                      // await page.waitForNavigation({ waitUntil: 'networkidle2' });
                      // const jobId = 9286;
                      // const client = await page.target().createCDPSession(); 
                      // await client.send('Page.setDownloadBehavior',
                      // {
                      //     behavior: 'allow', 
                      //     downloadPath: path.resolve('./defaultDownload'),  
                      // });

                      //Initiate data for each Source
                      var jobData = {
                          source_site: "referhr",
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
                          '.job-details .row .col .mb-3',
                              element => element.textContent
                          );                        

                          console.log('Job title:', jobTitle);
                          writeLog(jobLink,jobTitle);

                          writeLog(jobLink, "TITLE ");
                          jobData.title = jobTitle;

                            const jobLocation = await page.evaluate(() => {
                              const salaryElement = document.querySelector('.job-location');
                              return salaryElement ? salaryElement.textContent.trim() : null;
                            });

                            // console.log('Job title:', jobLocation);
                            // writeLog(jobLink,jobLocation);
  
                            writeLog(jobLink, "jobLocation ");
                            jobData.job_location = jobLocation ? jobLocation + " (Canada)" : "";




                            const jobType = await page.$eval(
                              '.company-details strong',
                                  element => element.textContent
                              );                        
    
                              console.log('Job type:', jobType);
                              writeLog(jobLink,jobType);
    
                              writeLog(jobLink, "jobType ");
                              jobData.job_work_type = jobType;


                            // let grossSalary = '';

                            const grossSalary = await page.evaluate(() => {
                              const salaryElement = document.querySelector('.job-details p.font-weight-bold');
                              return salaryElement ? salaryElement.textContent.trim() : null;
                            });

                          // const grossSalaryElement = await page.$eval('.job-details .col .font-weight-bold'); 
                          // if(grossSalaryElement) {
                          //   grossSalary = await page.evaluate(element => element.textContent, grossSalaryElement);
                          // }
                          writeLog(jobLink, "grossSalary name " + grossSalary);
                          jobData.gross_month_salary = grossSalary + " (CAD)";




                          let jobReward = '';
                          // const jobRewardSelector = 'span[class*="job-detail-header_job-detail-header__reward-number"]';
                          // if(jobRewardSelector) {
                          //   jobReward = await page.$eval(`${jobRewardSelector}`, el => el.textContent);
                          // }
                          // writeLog(jobLink,jobReward);

                          jobReward = await page.evaluate(() => {
                            const elements = document.querySelectorAll('.company-details .col-12.text-center p');
                            for (let i = 0; i < elements.length; i++) {
                              if (elements[i].textContent.includes('Referral Reward')) {
                                const rewardText = elements[i].textContent;
                                const rewardValue = rewardText.match(/~\s\$([\d,]+ CAD)/);
                                if (rewardValue) {
                                  return rewardValue[1];
                                }
                              }
                            }
                            return null; // Element not found or reward value not found
                          });
                        
                          // if (referralRewardValue) {
                          //   console.log('Referral Reward Value:', referralRewardValue);
                          // } else {
                          //   console.log('Element with text "Referral Reward" or its value not found.');
                          // }

                          jobData.original_reward = jobReward;

                          console.log("job Reward" + jobReward);
              
                          // //GET JOB TAGS
                          // const tagElements = await page.$$eval(`div[class*="edit-information-view_edit-information-view__info-skills"] span.ant-tag`, tags => {
                          // return tags.map(tag => {
                          //     return tag.textContent.trim();
                          // });
                          // });
                          // writeLog(jobLink, "TAG elements");
                          // writeLog(jobLink,tagElements);
              
                          jobData.tags = "";
                  
                         
                          //END JOB HEADER ATTRIBUTES

                          let fullDescription = '';
                          const fullJobElement = await page.$('#home'); 
                          if(fullJobElement) {
                            fullDescription = await page.evaluate(element => element.innerHTML, fullJobElement);
                          }
                          jobData.job_full_description = fullDescription;

                          writeLog(jobLink, "full job desc " + fullDescription);



                          // Find the second div with the class "job-details"

                          let overview_html = "";

                           overview_html = await page.evaluate(() => {
                            const jobDetailsDivs = document.querySelector('.job-details div:nth-child(2) div:nth-child(2)');
                            if (jobDetailsDivs) {
                              return jobDetailsDivs.innerHTML;
                            } else {
                              return "";
                            }
                          });
                         
                          jobData.overview_html = overview_html;
                          



                          // const jobLocation = await page.evaluate(() => {
                          //   const salaryElement = document.querySelector('.job-location');
                          //   return salaryElement ? salaryElement.textContent.trim() : null;
                          // });



                          //GET COMPANY DETAIL
                          let companyName = '';
                          const companyNameElement = await page.$('.company-details div:first-child p.font-weight-bold');
                          if(companyNameElement) {
                            companyName = await page.evaluate(element => element.textContent, companyNameElement);
                          }
                          writeLog(jobLink, "company name " + companyName);
              
                          let companyDescription = '';
                          const companyDescriptionElement = await page.$('#profile'); 
                          if(companyDescriptionElement) {
                            companyDescription = await page.evaluate(element => element.innerHTML, companyDescriptionElement);
                          }
                         
                          writeLog(jobLink, "company desc " + companyDescription);

                          //SAVE LOGO
                          const companyLogoUrl = await page.$eval('.comp-icon img', img => img.src);
                          // Use axios to download the image as a buffer
                          if(companyLogoUrl) {
                          const imageBuffer = await axios({
                              method: 'get',
                              url: companyLogoUrl,
                              responseType: 'arraybuffer'
                          });
              
                          // Write the buffer to a file using Node's fs module
                          require('fs').writeFileSync(`img/company_logo/referhr/${jobId}.jpg`, imageBuffer.data);
                          }
              
                          jobData.company_name = companyName;
                          jobData.company_description = companyDescription;
              
                          //test
                          jobData.updated_at = moment().format('YYYY-MM-DD hh:mm:ss');

                            // Then you can use it with async/await like this:
                            await new Promise((resolve, reject) => {

                              // const response = await axios.post('http://localhost:3000/api/saveCrawlData/referhr', jobData);

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