const { executeCode } = require("./executeCode");
executeCode("c", "#include <stdio.h>\nint main() { printf(\"hello\"); return 0; }", "")
  .then(console.log)
  .catch(console.error);
