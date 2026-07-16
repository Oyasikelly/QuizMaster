const fs = require('fs');
const file = 'src/components/SelectTime.jsx';
let content = fs.readFileSync(file, 'utf8');

// Remove the orphaned fragment (lines 500-517 in the original numbering)
// They are identifiable because they contain the specific stray text
const strayStart = content.indexOf('\t\t\t\t\t\t\tclassName={`w-2/3 md:w-1/3 ${');
if (strayStart === -1) {
  console.log('Stray code not found — file may already be clean.');
  process.exit(0);
}

// Find the end of the stray block (the second closing </div></div> after it)
const strayEnd = content.indexOf('\t\t\t\t</div>\n', strayStart);
if (strayEnd === -1) {
  console.log('Could not find end of stray block.');
  process.exit(1);
}

const endPos = strayEnd + '\t\t\t\t</div>\n'.length;
const cleaned = content.slice(0, strayStart) + content.slice(endPos);
fs.writeFileSync(file, cleaned, 'utf8');
console.log('Stray code removed successfully.');
