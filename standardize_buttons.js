const fs = require('fs');
const path = require('path');

function updateButtons() {
  // Get HTML files from current directory
  const htmlFiles = fs.readdirSync('.').filter(file => path.extname(file) === '.html');
  
  htmlFiles.forEach(file => {
    console.log(`Processing ${file}...`);
    let content = fs.readFileSync(file, 'utf8');
    
    // Replace button elements with standardized anchor tags
    content = content.replace(
      /<button[^>]*>(.*?)<\/button>/gs, 
      '<a href="contato.html" class="btn" aria-label="Solicite um diagnóstico gratuito com o Método ASA">$1</a>'
    );
    
    // Also standardize existing buttons that might already be anchor tags but inconsistent
    content = content.replace(
      /<a[^>]*class="btn"[^>]*>([^<]*(?:<[^>]*>[^<]*)*)<\/a>/gs,
      '<a href="contato.html" class="btn" aria-label="Solicite um diagnóstico gratuito com o Método ASA">$1</a>'
    );
    
    fs.writeFileSync(file, content);
    console.log(`Updated ${file}`);
  });
}

// Enhanced card interactions for consistent animations
function enhanceCardInteractions() {
  console.log('Card interaction enhancements will be applied through main.js updates');
}

updateButtons();
enhanceCardInteractions();
console.log('Button standardization complete!');
