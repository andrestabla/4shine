import fs from 'fs';
import path from 'path';

function checkFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const lines = content.split('\n');
  let inObject = false;
  let hasName = false;
  let hasAnswers = false;
  let hasStatus = false;
  let hasProfile = false;
  let hasCompletionPercent = false;
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (line.includes('status: "results"') || line.includes('status: "intro"') || line.includes('status: "quiz"')) {
      // Find start of object
      let j = i;
      while (j > 0 && !lines[j].includes('{')) j--;
      let k = i;
      while (k < lines.length && !lines[k].includes('}')) k++;
      
      const objectBlock = lines.slice(j, k + 1).join('\n');
      if (objectBlock.includes('profileCompleted:') && !objectBlock.includes('completionPercent:')) {
        console.log(`Missing completionPercent in ${filePath} near line ${i+1}`);
        console.log(objectBlock);
        console.log('---');
      }
    }
  }
}

function walk(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      walk(fullPath);
    } else if (file.endsWith('.ts') || file.endsWith('.tsx')) {
      checkFile(fullPath);
    }
  }
}

walk('src/features/descubrimiento');
