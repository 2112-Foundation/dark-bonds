const path = require("path");
const programDir = path.join(__dirname, "programs/dark-bonds");
const idlDir = path.join(__dirname, "target/idl");
const sdkDir = path.join(__dirname, "js", "darkbonds/dark-bonds");
const binaryInstallDir = path.join(__dirname, ".crates");

module.exports = {
  idlGenerator: "anchor",
  programName: "dark_bonds",
  programId: "8ZP1cSpVPVPp5aeake5f1BtgW1xv1e39zkoG8bWobbwV",
  idlDir,
  sdkDir,
  binaryInstallDir,
  programDir,
};