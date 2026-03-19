import fs from 'fs';
const file = './src/lib/ai/prompts/archetype_generation.ts';
let code = fs.readFileSync(file, 'utf8');

code = code.replace(/\{[\s\S]*"avoidance": "\.\.\." \}\n    \},[\s\S]*\]/, `{
      "identity": {
        "name": "The Title",
        "kicker": "The core logic",
        "description": "Short bio",
        "demographic": { "ageRange": "15-25", "occupation": "Student", "livingSetup": "With Parents" }
      },
      "influences": ["Influence 1"],
      "livedExperience": "Rich description",
      "behaviours": ["Behaviour 1"],
      "barriers": ["Barrier 1"],
      "motivations": ["Motivation 1"],
      "goals": ["Goal 1"],
      "habits": ["Habit 1"],
      "spiral": { "pattern": "a -> b -> c", "avoidance": "How to help" }
    }
  ]`);

fs.writeFileSync(file, code);
