const https = require('https');
https.get('https://data.gov.tw/api/front/dataset/search?p=1&s=50&q=%E5%81%9C%E7%8F%AD', res => {
  let body = '';
  res.on('data', d => body += d);
  res.on('end', () => console.log(body));
});
