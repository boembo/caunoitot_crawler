            
                        // const jobRewardSelector = 'span[class*="job-detail-header_job-detail-header__reward-number"]';
                        // const jobReward = await page.$eval(`${jobRewardSelector}`, el => el.textContent);
                        // console.log(jobReward);
                        // jobData.reward = jobReward;
            
                        // //GET JOB TAGS
                        // const tagElements = await page.$$eval(`span.ant-tag`, tags => {
                        //   return tags.map(tag => {
                        //     return tag.textContent.trim();
                        //   });
                        // });
                        // console.log("TAG elements");
                        // console.log(tagElements);
            
                        // jobData.tags = JSON.stringify(tagElements);
                
                        // //GET JOB HEADER ATTRIBUTES
                        // for (const [key, headerAttribute] of Object.entries(headerAttributes)) {
                        //     const element = await page.$x(`//div[@class='ant-descriptions-item-container']//div[contains(text(), '${headerAttribute}')]`);
                        //     let headerContent = '';
                        //     if (element.length > 0) {
                        //       const nextElement = await element[0].$x('following-sibling::div[1]');
                        //       if (nextElement.length > 0) {
                        //         headerContent = await page.evaluate(el => el.textContent, nextElement[0]);
                        //         console.log(`Content of the div next to '${headerAttribute}':`, headerContent.trim());
                        //       } else {
                        //         console.log(`Div next to '${headerAttribute}' not found!`);
                        //       }
                        //     } else {
                        //       console.log(`Div containing '${headerAttribute}' not found!`);
                        //     }
            
                        //     jobData[key] = headerContent.trim();
                        // }
                        // console.log("job Data here");
                        // console.log(jobData);
            
                        // const jobMemoElement = await page.$('div.ant-alert-message div[class*=job-detail_job-detail__notice]');
                        // if(jobMemoElement.length > 0) {
                        //   const jobMemo = await page.evaluate(element => element.textContent, jobMemoElement);
                        //   console.log("job memo  " + jobMemo);
                        //   jobData.memo = jobMemo;
                        // };
                        // //END JOB HEADER ATTRIBUTES
            
                        // //GET JOB BENEFIT ATTRIBUTES
                        // // Find the div that contains the text "job-description_job-description" in its class
                        // const benefitDivSelector = 'div[class*="job-description_job-description"]';
                        // // Get all the h4 elements with class ant-list-item-meta-title inside the selected div
                        // // const benefitElements = await page.$$(`${benefitDivSelector} h4.ant-list-item-meta-title`);
                        // const benefitElements = await page.$$eval(`${benefitDivSelector} h4.ant-list-item-meta-title`, titles => {
                        //   const benefitContents = {};
            
                        //   titles.forEach(title => {
                        //     const titleText = title.textContent.trim();
                        //     const nextSibling = title.nextElementSibling;
                        //     const nextSiblingText = nextSibling ? nextSibling.textContent.trim() : '';
                            
                        //     benefitContents[titleText] = nextSiblingText;
                        //   });
                        //   return benefitContents;
                        // });
                        // console.log(benefitElements);
            
                        // jobData.benefits = JSON.stringify(benefitElements);
                        // //END JOB BENEFIT ATTRIBUTES
            
                        // //GET JOB CONTENT 
                        // console.log("GET ALL TITL 1 E");
            
                        //   const jobContentSelector = 'h3[class*="edit-summary-view_edit-summary-view__heading"]';
                        //   const jobContentDatas = await page.$$eval(`${jobContentSelector}`, (titles, jobContentAttributes) => {
                        //     const jobContents = {};
            
                        //     titles.forEach(title => {
                        //       const titleText = title.textContent.trim();
                        //       const nextSibling = title.nextElementSibling;
                        //       const nextSiblingText = nextSibling ? nextSibling.textContent.trim() : '';
                        //       jobContents[jobContentAttributes[titleText]] = nextSiblingText;
                        //     });
            
                        //     return jobContents;
                        //   }, jobContentAttributes);
            
                        //   jobData = Object.assign(jobData, jobContentDatas);
            
            
                        // //GET COMPANY DETAIL
                        // const companyNameElement = await page.$('div.ant-col-18 h3[class*=job-description_job-description__headin]:first-child');  
                        // const companyName = await page.evaluate(element => element.textContent, companyNameElement);
                        // console.log("company name" + companyName);
            
                        // const companyDescriptionElement = await page.$('div.ant-row div.ant-col-24 p:first-child');  
                        // const companyDescription = await page.evaluate(element => element.textContent, companyDescriptionElement);
                        // console.log("company desc" + companyDescription);
                        
                        // //SAVE LOGO
                        // const companyLogoUrl = await page.$eval('div.ant-row div.ant-col-6 img', img => img.src);
                        // // Use axios to download the image as a buffer
                        // if(companyLogoUrl) {
                        //   const imageBuffer = await axios({
                        //     method: 'get',
                        //     url: companyLogoUrl,
                        //     responseType: 'arraybuffer'
                        //   });
            
                        //   // Write the buffer to a file using Node's fs module
                        //   require('fs').writeFileSync(`img/company_logo/recruitery/${jobId}.jpg`, imageBuffer.data);
                        // }
            
                        // jobData.company_name = companyName;
                        // jobData.company_description = companyDescription;
            
                        // const companyDetailSelector = 'div[class*="job-description_title"]';
                        // const companyDetailData = await page.$$eval(`${companyDetailSelector}`, (titles, companyAttributes) => {
                        //   const companyContents = {};
            
                        //   titles.forEach(title => {
                        //     const titleText = title.textContent.trim();
                        //     const nextSibling = title.nextElementSibling;
                        //     const nextSiblingText = nextSibling ? nextSibling.textContent.trim() : '';
            
                        //     companyContents[companyAttributes[titleText]] = nextSiblingText;
                        //   });
            
                        //   return companyContents;
                        // }, companyAttributes);
            
                        // console.log(companyDetailData);
            
                        // jobData = Object.assign(jobData, companyDetailData);
                        // //END JOB CONTENT
            
            
            
                        // //LISTEN FILE DOWNLOAD
                        // page.on('response', async response => {
                        //   //check for "Content-Disposition"
                        //   const disposition = response.headers()['content-disposition'];
                        
                        //   if (disposition && disposition.indexOf('attachment') !== -1) {
                        //     var filenameRegex = /filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/;
                        //     var matches = filenameRegex.exec(disposition);
                        //     if (matches != null && matches[1]) { 
                            
                        //       const filename = `recruitery_${jobId}.pdf`;
                        //       await response.buffer().then(buffer => {
                        //         // console.log(buffer.toString());
                        //         const pdfBuffer = Buffer.from(buffer, 'base64');
                        //         require('fs').writeFileSync("./jd/recruitery/" + filename, pdfBuffer);
                        //       });
                        //       console.log(`Downloaded file: ${filename}`);
                        //       //CLOSE PAGE AFTER DOWNLOAD
                        //       await page.close();
                        //     }
                        //   }
                        // });
            
            
                    //     console.log(jobData);
                    //     //CLICK DOWNLOAD FILE 
                    //     await page.click('.ant-card-extra .ant-space-item:first-child'); // some button that triggers file selection
                    //     // const downloadBtn = await page.waitForSelector('div:contains("Download JD")');
                    //     // await downloadBtn.click();
            
                    //     mySqlConnection.connect(function(err) {
                    //       if (err) throw err;
            
                    //       var query = 'INSERT INTO job SET ' + mySqlConnection.escape(jobData, true);
                    //       mySqlConnection.query(query, function (err, result) {
                    //         if (err) throw err;
                    //         console.log("1 record inserted, ID: " + result.insertId);
                    //       });
                    //   });