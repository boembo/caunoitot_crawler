//cu phap cha va con
const data = await page.$$eval('.ant-list-item-meta-title', titles => {
  const result = {};

  titles.forEach(title => {
    const parent = title.closest('.ant-list-item-meta');
    const parentParent = parent.closest('.job-description_job-description');

    if (parent && parentParent) {
      const nextDiv = parent.querySelector('.ant-list-item-meta-description');
      if (nextDiv) {
        const key = title.textContent.trim();
        const value = nextDiv.textContent.trim();
        result[key] = value;
      }
    }
  });

  return result;
});
