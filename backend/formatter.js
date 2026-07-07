const { spawn } = require("child_process");

const formatCode = (language, code) => {
  return new Promise((resolve, reject) => {
    let command;
    let args = [];

    if (language === "py" || language === "python") {
      command = "black";
      args = ["-q", "-"];
    } else if (language === "cpp" || language === "c") {
      command = "clang-format";
      const ext = language === "cpp" ? "cpp" : "c";
      args = [`--assume-filename=main.${ext}`];
    } else if (language === "java") {
      command = "clang-format";
      args = ["--assume-filename=main.java"];
    } else {
      return reject({ error: "Unsupported language for backend formatting" });
    }

    const process = spawn(command, args);
    let output = "";
    let runError = "";

    process.stdout.on("data", (data) => (output += data.toString()));
    process.stderr.on("data", (data) => (runError += data.toString()));

    process.on("close", (exitCode) => {
      if (exitCode !== 0) {
        return reject({ error: runError || "Formatting failed" });
      }
      resolve(output);
    });

    process.stdin.write(code);
    process.stdin.end();
  });
};

module.exports = { formatCode };
