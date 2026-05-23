const https = require('https');

const API_KEYS = [
  'AIzaSyCR6yley0CoJc6NxPNpJO0jGeeLvGEp3YQ',
  'AIzaSyB0eDQ2dUzJNvB7B5rYuDajgpmnL6NE6O4',
  'AIzaSyBOX9Fzw-gxkK4wpMuBFcQ6rt22tDQdiks',
  'AIzaSyDrNo9bkAJBrN4THs7KQ5j9qsUqsDNrsLE',
  'AIzaSyCF8quj7EJpzx5B-XsN45mhWD0FRV880hg',
  'AIzaSyAi-gQJOlziM1_M21ppWbM9ihXRCMG1ay8',
  'AIzaSyCgzlD0IJXcajw02xu_3kveeJKgd-93o6k',
  'AIzaSyA05B4sENrId661KtEz204hkgfARUo4G1k',
  'AIzaSyBzpegdtVELq1XYOKczGvFvX5g4ixrWvLo',
  'AIzaSyCcBJOlPZlVPk56PK5zvFUcwoxjThJ3ZUY',
  'AIzaSyDittE-2fRTLHIAeEs9UwvQO0QjrIVQiN4',
  'AIzaSyCSJHDGjs5Bx-rhGHGQsq8qAiKfFD87f_8',
  'AIzaSyDQ7CwSNJ6VxirBP05r23Lm0NpCjQJrbQE',
  'AIzaSyBAKXQ1R53WgaZS2wYBiqAgKhb39tgJ5PU',
  'AIzaSyCtghegjgELTpJNW-Z46aRgaMOCcsxh74A'
];

let currentKeyIndex = 0;

function getNextKey() {
  const key = API_KEYS[currentKeyIndex];
  currentKeyIndex = (currentKeyIndex + 1) % API_KEYS.length;
  return key;
}

async function callGemini(prompt) {
  const key = getNextKey();
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${key}`;

  const body = JSON.stringify({
    contents: [{
      parts: [{ text: prompt }]
    }]
  });

  return new Promise((resolve, reject) => {
    const req = https.request(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(body)
      }
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          if (json.candidates && json.candidates[0]) {
            resolve(json.candidates[0].content.parts[0].text);
          } else {
            reject(new Error('No response from Gemini'));
          }
        } catch (e) {
          reject(e);
        }
      });
    });

    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

// Research tasks
const tasks = {
  'fp&a-market': 'Research the FP&A software market in 2026. What are the top 10 features that CFOs want? What are the biggest pain points with current tools like Anaplan, Workday Adaptive, and Planful? Provide specific data points and statistics.',

  'competitive-features': 'Create a comprehensive feature comparison matrix for FP&A tools. Compare FinPlan Pro (offline-first, git-versioned, AI on-device, free) against Anaplan, Workday Adaptive, OneStream, Planful, Pigment, and Prophix. Focus on: budgeting, forecasting, consolidation, reporting, collaboration, and pricing.',

  'tauri-best-practices': 'Research Tauri 2.0 best practices for desktop FP&A applications. Focus on: SQLite integration, file system security, auto-updates, bundle optimization, native menus, and system tray. Provide specific code examples.',

  'financial-formulas': 'Research the top 50 financial formulas that an FP&A tool must support. Categorize them into: NPV/IRR, depreciation, currency, allocation, variance analysis, ratio analysis, and statistical. Provide the formula and use case for each.',

  'accessibility-standards': 'Research WCAG 2.1 AA requirements for financial data grids and charts. What are the specific requirements for: data tables, charts, forms, keyboard navigation, and screen reader support? Provide implementation examples.',

  'performance-optimization': 'Research performance optimization techniques for React financial applications. Focus on: AG Grid optimization, Web Workers for calculations, bundle size reduction, lazy loading, and caching strategies. Provide specific metrics and benchmarks.'
};

async function runResearch(taskName) {
  const prompt = tasks[taskName];
  if (!prompt) {
    console.error(`Unknown task: ${taskName}`);
    console.log('Available tasks:', Object.keys(tasks).join(', '));
    return;
  }

  console.log(`\n=== Researching: ${taskName} ===\n`);
  try {
    const result = await callGemini(prompt);
    console.log(result);
  } catch (error) {
    console.error(`Error: ${error.message}`);
  }
}

// Run from command line
const taskName = process.argv[2];
if (taskName) {
  runResearch(taskName);
} else {
  console.log('Usage: node gemini-research.cjs <task-name>');
  console.log('Available tasks:', Object.keys(tasks).join(', '));
}
