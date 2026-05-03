const fs = require('fs');
const path = require('path');

const apiDir = '/Applications/XAMPP/xamppfiles/htdocs/Nepal_Royal/backend/api';
const files = fs.readdirSync(apiDir).filter(f => f.endsWith('.php'));

const mappings = {
    'User': 'RoyalNepal\\classes\\User',
    'Bus': 'RoyalNepal\\classes\\Bus',
    'Flight': 'RoyalNepal\\classes\\Flight',
    'Hotel': 'RoyalNepal\\classes\\Hotel',
    'Location': 'RoyalNepal\\classes\\Location',
    'Package': 'RoyalNepal\\classes\\Package',
    'Place': 'RoyalNepal\\classes\\Place',
    'Database': 'RoyalNepal\\config\\Database',
    'CSRFToken': 'RoyalNepal\\middleware\\CSRFToken'
};

files.forEach(file => {
    const filePath = path.join(apiDir, file);
    let content = fs.readFileSync(filePath, 'utf8');

    // Find used classes
    const usedClasses = [];
    Object.keys(mappings).forEach(cls => {
        if (content.includes(`new ${cls}`) || content.includes(`${cls}::`)) {
            usedClasses.push(cls);
        }
    });

    if (usedClasses.length === 0) return;

    // Add use statements
    const useStatements = usedClasses.map(cls => `use ${mappings[cls]};`).join('\n');
    
    // Insert use statements after <?php (or after the first comment block)
    if (content.includes('namespace')) return; // Already processed or has namespace

    const phpTag = '<?php';
    const tagIndex = content.indexOf(phpTag);
    if (tagIndex === -1) return;

    // Find where to insert (after <?php and possible comments)
    let insertIndex = tagIndex + phpTag.length;
    
    // Skip initial comment block if present
    const commentMatch = content.slice(insertIndex).match(/^\s*\/\*\*[\s\S]*?\*\//);
    if (commentMatch) {
        insertIndex += commentMatch.index + commentMatch[0].length;
    }

    content = content.slice(0, insertIndex) + '\n' + useStatements + '\n' + content.slice(insertIndex);

    // Remove old include_once/require_once calls for these classes
    Object.keys(mappings).forEach(cls => {
        const regex = new RegExp(`(include_once|require_once|include|require)\\s+['"].*?${cls}\\.php['"];?\\s*`, 'g');
        content = content.replace(regex, '');
    });

    fs.writeFileSync(filePath, content);
    console.log(`Updated ${file}`);
});
