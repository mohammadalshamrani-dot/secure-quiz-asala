
const fs = require('fs');
const path = require('path');
const DB_PATH = path.join(__dirname, 'data', 'db.json');
function readDB(){
  if(!fs.existsSync(DB_PATH)) {
    fs.writeFileSync(DB_PATH, JSON.stringify({quizzes:{}, attempts:{}}, null, 2));
  }
  const raw = fs.readFileSync(DB_PATH, 'utf8');
  return JSON.parse(raw || '{"quizzes":{},"attempts":{}}');
}
function writeDB(db){
  fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2));
}
module.exports = { readDB, writeDB };
