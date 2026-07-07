const fs = require("fs");
const path = require("path");
const { v4: uuid } = require("uuid");

const dirCodes = path.join(__dirname, "codes");
if (!fs.existsSync(dirCodes)) {
  fs.mkdirSync(dirCodes, { recursive: true });
}

const generateFile = (language, code) => {
  const ext = language === 'py' ? 'py' : language === 'java' ? 'java' : language;
  const jobId = uuid();
  const filename = `${language === 'java' ? 'Main' : jobId}.${ext}`;
  const filepath = path.join(dirCodes, filename);
  fs.writeFileSync(filepath, code);
  return filepath;
};

module.exports = {
  generateFile
};
