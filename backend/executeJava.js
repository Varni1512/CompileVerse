const path = require("path");
const fs = require("fs");
const { exec } = require("child_process");

const outputPath = path.join(__dirname, "outputs");
if (!fs.existsSync(outputPath)) {
    fs.mkdirSync(outputPath, { recursive: true });
}

const executeJava = (filePath, inputFilePath) => {
    const jobId = path.basename(filePath).split(".")[0];
    const className = jobId;
    const dirPath = path.dirname(filePath);

    return new Promise((resolve, reject) => {
        exec(
            `javac ${filePath} && java -cp ${dirPath} ${className} < ${inputFilePath}`,
            (error, stdout, stderr) => {
                if (error) {
                    reject({ error, stderr });
                } else if (stderr) {
                    reject({ stderr });
                } else {
                    resolve(stdout);
                }
            }
        );
    });
};

module.exports = {
    executeJava,
};
