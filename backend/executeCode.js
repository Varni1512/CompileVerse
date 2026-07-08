const { spawn } = require("child_process");
const path = require("path");
const os = require("os");
const fs = require("fs").promises;
const { v4: uuid } = require("uuid");

const runExecutable = (executableCommand, args, input, options = {}) => {
  return new Promise((resolve, reject) => {
    const run = spawn(executableCommand, args, options);
    let output = "", runError = "";

    // 5 seconds timeout to kill infinite loops
    const timeout = setTimeout(() => {
      run.kill("SIGKILL");
      reject({ error: "Time Limit Exceeded (Possible Infinite Loop)" });
    }, 5000);

    run.stdout.on("data", (data) => {
      output += data.toString();
      // Limit output to ~1MB to prevent memory crash if while(true) prints continuously
      if (output.length > 1024 * 1024) {
        run.kill("SIGKILL");
        reject({ error: "Output Limit Exceeded (Too much output)" });
      }
    });

    run.stderr.on("data", (data) => (runError += data.toString()));
    
    run.on("close", (code) => {
      clearTimeout(timeout);
      if (code !== 0 && code !== null) return reject({ error: runError || "Execution failed" });
      resolve(output);
    });
    
    run.stdin.write(input);
    run.stdin.end();
  });
};

const executeTests = async (language, code, testCases) => {
  // testCases is an array of strings (inputs)
  // We will return an array of outputs

  if (language === "py" || language === "python") {
    const tempDir = path.join(os.tmpdir(), uuid());
    const filePath = path.join(tempDir, "main.py");
    try {
      await fs.mkdir(tempDir, { recursive: true });
      await fs.writeFile(filePath, code);
      
      const results = [];
      for (const input of testCases) {
        try {
          const output = await runExecutable("python3", [filePath], input);
          results.push({ success: true, output });
        } catch (err) {
          results.push({ success: false, error: err.error });
        }
      }
      return results;
    } finally {
      await fs.rm(tempDir, { recursive: true, force: true }).catch(() => {});
    }
  } else if (language === "cpp" || language === "c") {
    const compiler = language === "cpp" ? "g++" : "gcc";
    const langIdentifier = language === "cpp" ? "c++" : "c";
    const executableName = uuid();
    const executablePath = path.join(os.tmpdir(), executableName);

    return new Promise((resolve, reject) => {
      const compile = spawn(compiler, ["-x", langIdentifier, "-o", executablePath, "-"]);
      let compileError = "";
      compile.stderr.on("data", (data) => (compileError += data.toString()));
      compile.on("close", async (codeStatus) => {
        if (codeStatus !== 0) return reject({ error: compileError || "Compilation failed" });

        const results = [];
        for (const input of testCases) {
          try {
            const output = await runExecutable(executablePath, [], input);
            results.push({ success: true, output });
          } catch (err) {
            results.push({ success: false, error: err.error });
          }
        }
        await fs.unlink(executablePath).catch(() => {});
        resolve(results);
      });
      compile.stdin.write(code);
      compile.stdin.end();
    });
  } else if (language === "java") {
    const className = "Main";
    const tempDir = path.join(os.tmpdir(), uuid());
    const filePath = path.join(tempDir, `${className}.java`);

    try {
      await fs.mkdir(tempDir, { recursive: true });
      await fs.writeFile(filePath, code);

      return new Promise((resolve, reject) => {
        const compile = spawn("javac", [filePath]);
        let compileError = "";
        compile.stderr.on("data", (data) => (compileError += data.toString()));
        compile.on("close", async (codeStatus) => {
          if (codeStatus !== 0) {
            await fs.rm(tempDir, { recursive: true, force: true }).catch(() => {});
            return reject({ error: compileError });
          }

          const results = [];
          for (const input of testCases) {
            try {
              const output = await runExecutable("java", ["-cp", tempDir, className], input);
              results.push({ success: true, output });
            } catch (err) {
              results.push({ success: false, error: err.error });
            }
          }
          await fs.rm(tempDir, { recursive: true, force: true }).catch(() => {});
          resolve(results);
        });
      });
    } catch (e) {
      await fs.rm(tempDir, { recursive: true, force: true }).catch(() => {});
      throw { error: e.message };
    }
  } else {
    throw { error: "Unsupported language" };
  }
};

const executeCode = async (language, code, input) => {
  const results = await executeTests(language, code, [input]);
  if (!results[0].success) {
    throw { error: results[0].error };
  }
  return results[0].output;
};

module.exports = { executeCode, executeTests };