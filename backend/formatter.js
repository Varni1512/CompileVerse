const { spawn } = require("child_process");

const formatCode = (language, code) => {
  return new Promise((resolve, reject) => {
    let command;
    let args = [];

    if (language === "py" || language === "python") {
      command = "npx";
      args = ["black", "-q", "-"];
    } else if (language === "cpp" || language === "c") {
      command = "npx";
      const ext = language === "cpp" ? "cpp" : "c";
      args = ["clang-format", `--assume-filename=main.${ext}`];
    } else if (language === "java") {
      command = "npx";
      args = ["clang-format", "--assume-filename=main.java"];
    } else {
      return reject({ error: "Unsupported language for backend formatting" });
    }

    const process = spawn(command, args);
    let output = "";
    let runError = "";

    process.stdout.on("data", (data) => (output += data.toString()));
    process.stderr.on("data", (data) => (runError += data.toString()));

    process.on("error", (err) => {
      reject({ error: `Formatter executable not found or failed to start: ${err.message}` });
    });

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
