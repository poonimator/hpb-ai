import { writeFileSync, readFileSync } from 'fs';
const fs = require('fs');
const file = './src/lib/ai/prompts/archetype_generation.ts';
let code = fs.readFileSync(file, 'utf8');

code = code.replace(/\{ \.\.\.archetype 1\.\.\. \}/, `{\n      "identity": {\n        "name": "...",\n        "kicker": "...",\n        ... \n      },\n      "influences": [...],\n      "livedExperience": "...",\n      "behaviours": [...],\n      "barriers": [...],\n      "motivations": [...],\n      "goals": [...],\n      "habits": [...],\n      "spiral": { ... }\n    }`);

fs.writeFileSync(file, code);
