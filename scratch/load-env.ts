import * as fs from "fs";
import * as path from "path";

console.log("process.cwd():", process.cwd());
const envPath = path.resolve(process.cwd(), ".env");
console.log("envPath:", envPath);
console.log("Exists:", fs.existsSync(envPath));

if (fs.existsSync(envPath)) {
  const content = fs.readFileSync(envPath, "utf-8");
  console.log("Content length:", content.length);
  const lines = content.split(/\r?\n/);
  for (const line of lines) {
    const match = line.match(/^\s*([\w.\-]+)\s*=\s*(.*)?\s*$/);
    if (match) {
      const key = match[1];
      let value = match[2] || "";
      if (value.startsWith('"') && value.endsWith('"')) {
        value = value.substring(1, value.length - 1);
      } else if (value.startsWith("'") && value.endsWith("'")) {
        value = value.substring(1, value.length - 1);
      }
      process.env[key] = value.trim();
    }
  }
}
console.log("Loaded DATABASE_URL:", process.env.DATABASE_URL);
