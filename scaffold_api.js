
const fs = require("fs");
const path = require("path");

const routesPath = path.join(__dirname, "backend", "src", "routes");

const createStub = (name) => {
    return `import { Router } from "express";\n\nconst router = Router();\n\nrouter.get("/", (req, res) => {\n  res.json({ message: "${name} API stub" });\n});\n\nexport default router;\n`;
}

fs.writeFileSync(path.join(routesPath, "analytics.routes.ts"), createStub("Analytics"));
fs.writeFileSync(path.join(routesPath, "calendar.routes.ts"), createStub("Calendar"));
fs.writeFileSync(path.join(routesPath, "projects.routes.ts"), createStub("Projects"));
fs.writeFileSync(path.join(routesPath, "reports.routes.ts"), createStub("Reports"));
console.log("Scaffolded backend API routes.");

