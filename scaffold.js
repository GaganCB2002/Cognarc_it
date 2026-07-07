
const fs = require("fs");
const path = require("path");

const routes = [
    "calendar", "tasks", "notes", "knowledge-vault", "ai-assistant", 
    "reports", "analytics", "productivity", "career", "settings", "profile"
];

const basePath = path.join(__dirname, "frontend", "src", "app", "(dashboard)");

routes.forEach(route => {
    const dir = path.join(basePath, route);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    
    const title = route.split("-").map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
    
    const content = `import React from "react";

export default function ${title.replace(" ", "")}Page() {
    return (
        <div className="p-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-6">${title}</h1>
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center text-gray-500">
                <p>This module is currently being built and integrated with AnythingLLM.</p>
            </div>
        </div>
    );
}
`;
    fs.writeFileSync(path.join(dir, "page.tsx"), content);
});
console.log("Scaffolded " + routes.length + " routes.");

