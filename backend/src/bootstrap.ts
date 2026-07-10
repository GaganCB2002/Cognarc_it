import dotenv from "dotenv";
import path from "path";

// Load env BEFORE any other module imports, so env vars are available
// to modules like @clerk/clerk-sdk-node that read from process.env on load
dotenv.config({ path: path.resolve(__dirname, "..", ".env"), override: false });
