const { spawn } = require("child_process");
const path = require("path");
const os = require("os");
const fs = require("fs").promises;
const { v4: uuid } = require("uuid");

const executeCode = (language, code, input) => {
  return new Promise((resolve, reject) => {
    
    // Handler for Python
    if (language === "py") {
      const childProcess = spawn("python3", ["-c", code]);
      let output = "", error = "";
      childProcess.stdout.on("data", (data) => (output += data.toString()));
      childProcess.stderr.on("data", (data) => (error += data.toString()));
      childProcess.on("close", (code) => code !== 0 ? reject({ error }) : resolve(output));
      childProcess.stdin.write(input);
      childProcess.stdin.end();

    // Handler for C++ and C
    } else if (language === "cpp" || language === "c") {
      const compiler = language === "cpp" ? "g++" : "gcc";
      const langIdentifier = language === "cpp" ? "c++" : "c";
      const executableName = uuid();
      const executablePath = path.join(os.tmpdir(), executableName);

      const compile = spawn(compiler, ["-x", langIdentifier, "-o", executablePath, "-"]);
      let compileError = "";
      compile.stderr.on("data", (data) => (compileError += data.toString()));
      compile.on("close", (code) => {
        if (code !== 0) return reject({ error: compileError || "Compilation failed" });
        
        const run = spawn(executablePath);
        let output = "", runError = "";
        run.stdout.on("data", (data) => (output += data.toString()));
        run.stderr.on("data", (data) => (runError += data.toString()));
        run.on("close", async (code) => {
          await fs.unlink(executablePath).catch(e => console.error("Cleanup failed:", e));
          if (code !== 0) return reject({ error: runError });
          resolve(output);
        });
        run.stdin.write(input);
        run.stdin.end();
      });
      compile.stdin.write(code);
      compile.stdin.end();

    // Handler for Java
    } else if (language === "java") {
        const className = "Main";
        const tempDir = path.join(os.tmpdir(), uuid());
        const filePath = path.join(tempDir, `${className}.java`);

        (async () => {
            try {
                await fs.mkdir(tempDir, { recursive: true });
                await fs.writeFile(filePath, code);

                const compile = spawn("javac", [filePath]);
                let compileError = "";
                compile.stderr.on("data", (data) => (compileError += data.toString()));
                compile.on("close", (code) => {
                    if (code !== 0) {
                        fs.rm(tempDir, { recursive: true, force: true });
                        return reject({ error: compileError });
                    }

                    const run = spawn("java", ["-cp", tempDir, className]);
                    let output = "", runError = "";
                    run.stdout.on("data", (data) => (output += data.toString()));
                    run.stderr.on("data", (data) => (runError += data.toString()));
                    run.on("close", async (code) => {
                        await fs.rm(tempDir, { recursive: true, force: true });
                        if (code !== 0) return reject({ error: runError });
                        resolve(output);
                    });
                    run.stdin.write(input);
                    run.stdin.end();
                });
            } catch (e) {
                if (tempDir) await fs.rm(tempDir, { recursive: true, force: true }).catch(err => console.error("Cleanup failed:", err));
                reject({ error: e.message });
            }
        })();
    } else {
        reject({ error: "Unsupported language" });
    }
  });
};

module.exports = { executeCode };