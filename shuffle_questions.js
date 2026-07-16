const fs = require('fs');
const files = [
  'src/app/questions/real/adults/adultsQuestions.json',
  'src/app/questions/real/yaya/yayaQuestions.json'
];

files.forEach(file => {
  try {
    const data = JSON.parse(fs.readFileSync(file, 'utf8'));
    // Fisher-Yates shuffle algorithm
    for (let i = data.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [data[i], data[j]] = [data[j], data[i]];
    }
    fs.writeFileSync(file, JSON.stringify(data, null, '\t') + '\n');
    console.log('Successfully shuffled ' + data.length + ' questions in ' + file);
  } catch (err) {
    console.error('Error processing ' + file + ':', err.message);
  }
});
