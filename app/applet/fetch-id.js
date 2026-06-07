fetch("https://data.gov.tw/api/v2/dataset?q=停班停課").then(r=>r.text()).then(t => console.log(t)).catch(console.error);
