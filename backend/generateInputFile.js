const fs = require("fs");
const path = require("path");
const { v4: uuid } = require("uuid");

const dirInput = path.join(__dirname, "inputs");
if (!fs.existsSync(dirInput)) {
  fs.mkdirSync(dirInput, { recursive: true });
}

const generateInputFile = (input) => {
  const jobId = uuid();
  const inputFileName = `${jobId}.txt`;
  const inputFilePath = path.join(dirInput, inputFileName);
  fs.writeFileSync(inputFilePath, input);
  return inputFilePath;
};

module.exports = {
  generateInputFile
};
