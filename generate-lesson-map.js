const fs = require('fs');
const path = require('path');

const baseDir = path.join(process.cwd(), 'src', 'app', 'questions', 'practice');
const outputMapFile = path.join(process.cwd(), 'src', 'app', 'actions', 'lessonMap.json');

const lessonMap = {
  academicYears: {},
  lessons: {}
};

function generateMap() {
  if (!fs.existsSync(baseDir)) return;

  const categories = fs.readdirSync(baseDir, { withFileTypes: true })
    .filter(d => d.isDirectory())
    .map(d => d.name);

  categories.forEach(category => {
    const categoryDir = path.join(baseDir, category);
    const years = fs.readdirSync(categoryDir, { withFileTypes: true })
      .filter(d => d.isDirectory())
      .map(d => d.name)
      .sort((a, b) => b.localeCompare(a));
    
    lessonMap.academicYears[category.toLowerCase()] = years;

    years.forEach(year => {
      const yearDir = path.join(categoryDir, year);
      const difficulties = fs.readdirSync(yearDir, { withFileTypes: true })
        .filter(d => d.isDirectory())
        .map(d => d.name);

      difficulties.forEach(difficulty => {
        const difficultyDir = path.join(yearDir, difficulty);
        const files = fs.readdirSync(difficultyDir).filter(f => f.endsWith('.json'));

        const lessons = files.map(file => {
          const id = file.replace('.json', '');
          const withoutQuiz = id.replace(/_Quiz$/, '').replace(/_quiz$/, '');
          const parts = withoutQuiz.split('_');
          let title = id;
          if (parts.length >= 3) {
            const lessonNum = `${parts[0]} ${parts[1]}`;
            const topic = parts.slice(2).map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ');
            title = `${lessonNum}: ${topic}`;
          }
          return { id, title };
        });

        lessons.sort((a, b) => {
          const numA = parseInt(a.id.match(/\d+/) || '0', 10);
          const numB = parseInt(b.id.match(/\d+/) || '0', 10);
          if (numA !== numB) return numA - numB;
          return a.id.localeCompare(b.id);
        });

        const key = `${category.toLowerCase()}_${year}_${difficulty.toLowerCase()}`;
        lessonMap.lessons[key] = lessons;
      });
    });
  });

  fs.writeFileSync(outputMapFile, JSON.stringify(lessonMap, null, 2));
  console.log(`Generated lessonMap.json with ${Object.keys(lessonMap.academicYears).length} categories.`);
}

generateMap();
