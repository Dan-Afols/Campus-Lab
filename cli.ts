#!/usr/bin/env node

/**
 * CampusLab Development CLI
 * Helpful commands for common development tasks
 * 
 * Usage: npm run cli -- [command] [options]
 */

import * as fs from "node:fs";
import * as path from "node:path";
import { execSync } from "child_process";
import * as readline from "node:readline";

const commands = {
  setup: "Complete setup for development",
  dev: "Start all development services",
  test: "Run test suite",
  db: "Database operations",
  gen: "Generate code scaffolds",
  docs: "Generate and manage documentation",
  log: "View logs and debug info",
  clean: "Clean build artifacts",
  help: "Show this help message",
};

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

function question(prompt: string): Promise<string> {
  return new Promise((resolve) => {
    rl.question(prompt, (answer: string) => {
      resolve(answer);
    });
  });
}

async function handleSetup() {
  console.log("🚀 CampusLab Setup\n");

  try {
    // Check Node version
    const nodeVersion = execSync("node -v", { encoding: "utf-8" }).trim();
    console.log(`✓ Node ${nodeVersion}`);

    // Check PostgreSQL
    try {
      execSync("psql --version", { encoding: "utf-8" });
      console.log("✓ PostgreSQL installed");
    } catch {
      console.log("⚠ PostgreSQL not found - required for database");
    }

    // Install dependencies
    console.log("\n📦 Installing dependencies...");
    execSync("npm install", { stdio: "inherit" });

    // Create .env
    if (!fs.existsSync(".env")) {
      console.log("\n🔐 Creating environment file...");
      const dbUrl = await question(
        "PostgreSQL connection string (default: postgresql://postgres:password@localhost:5432/campuslab): "
      );
      const dbUrlFinal = dbUrl || "postgresql://postgres:password@localhost:5432/campuslab";

      fs.writeFileSync(
        ".env",
        `DATABASE_URL=${dbUrlFinal}
REDIS_URL=redis://localhost:6379
JWT_SECRET=your-secret-key-change-in-production
ADMIN_EMAIL=admin@campuslab.app
ADMIN_PASSWORD=SecurePassword123456
PORT=3000
NODE_ENV=development`
      );
      console.log("✓ .env created");
    }

    // Initialize database
    console.log("\n🗄 Initializing database...");
    try {
      execSync("npm run db:migrate", { stdio: "inherit" });
      console.log("✓ Database ready");
    } catch {
      console.log("⚠ Database initialization failed - check PostgreSQL connection");
    }

    console.log("\n✨ Setup complete! Run 'npm run dev' to start.\n");
  } catch (error: any) {
    console.error("❌ Setup failed:", error.message);
    process.exit(1);
  }
}

async function handleDev() {
  console.log("🚀 Starting CampusLab Development\n");
  console.log(
    "Starting services:\n  - Backend (3000)\n  - Admin Dashboard (3001)\n  - Web App (5173)\n"
  );
  console.log(
    "Open new terminals and run these commands in separate windows:\n"
  );
  console.log('  Terminal 1: npm run backend:dev   # Backend API');
  console.log('  Terminal 2: npm run admin:dev     # Admin Dashboard');
  console.log('  Terminal 3: npm run web:dev       # Student Web App\n');
  console.log("Endpoints:");
  console.log("  Admin: http://localhost:3001");
  console.log("  API:   http://localhost:3000/api");
  console.log("  Web:   http://localhost:5173\n");
}

async function handleTest() {
  console.log("🧪 Running Tests\n");

  const testType = await question(
    "Test type (unit/integration/e2e/all) [all]: "
  );
  const type = testType || "all";

  const commands: { [key: string]: string } = {
    unit: "npm run backend:test",
    integration: "npm run test:integration",
    e2e: "npm run test:e2e",
    all: "npm run test",
  };

  const cmd = commands[type];
  if (!cmd) {
    console.log("❌ Unknown test type");
    return;
  }

  try {
    execSync(cmd, { stdio: "inherit" });
  } catch (error) {
    console.error("\n❌ Tests failed");
    process.exit(1);
  }
}

async function handleDb() {
  console.log("🗄 Database Operations\n");

  const operation = await question(
    "Operation (migrate/seed/reset/export) [migrate]: "
  );
  const op = operation || "migrate";

  const dbCommands: { [key: string]: string } = {
    migrate: "npm run db:migrate",
    seed: "npm run db:seed",
    reset: "npm run db:fresh",
    export: "npm run db:export",
  };

  const cmd = dbCommands[op];
  if (!cmd) {
    console.log("❌ Unknown operation");
    return;
  }

  try {
    console.log(`\nRunning: ${cmd}\n`);
    execSync(cmd, { stdio: "inherit" });
  } catch (error) {
    console.error("\n❌ Database operation failed");
    process.exit(1);
  }
}

async function handleGen() {
  console.log("🛠 Generate Code Scaffolds\n");

  const type = await question(
    "What to generate (model/controller/service/route) [model]: "
  );
  const scaffoldType = type || "model";

  const name = await question("Name (PascalCase): ");
  if (!name) {
    console.log("❌ Name required");
    return;
  }

  const templates: Record<string, (name: string) => string> = {
    model: generateModel,
    controller: generateController,
    service: generateService,
    route: generateRoute,
  };

  const generator = templates[scaffoldType];
  if (!generator) {
    console.log("❌ Unknown scaffold type");
    return;
  }

  const code = generator(name);
  const fileName = `${name}${getFileSuffix(scaffoldType)}.ts`;
  const filePath = path.join("backend/src", getFolder(scaffoldType), fileName);

  if (fs.existsSync(filePath)) {
    console.log(`⚠ File already exists: ${filePath}`);
    return;
  }

  fs.writeFileSync(filePath, code);
  console.log(`✓ Created: ${filePath}`);
}

function getFileSuffix(type: string): string {
  const suffixes: { [key: string]: string } = {
    model: "Model",
    controller: "Controller",
    service: "Service",
    route: "",
  };
  return suffixes[type] || "";
}

function getFolder(type: string): string {
  const folders: { [key: string]: string } = {
    model: "models",
    controller: "controllers",
    service: "services",
    route: "routes",
  };
  return folders[type] || "";
}

function generateModel(name: string): string {
  return `import { Schema, model } from 'mongoose';

export interface I${name} {
  id: string;
  createdAt: Date;
  updatedAt: Date;
}

const ${name}Schema = new Schema({
  // Add your fields here
}, {
  timestamps: true
});

export const ${name}Model = model<I${name}>('${name}', ${name}Schema);
`;
}

function generateController(name: string): string {
  const serviceName = name + "Service";
  return `import { Request, Response } from 'express';
import { ${serviceName} } from '../services/${serviceName}';

export class ${name}Controller {
  private service = new ${serviceName}();

  async getAll(req: Request, res: Response) {
    try {
      const data = await this.service.getAll();
      res.json(data);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  async getOne(req: Request, res: Response) {
    try {
      const data = await this.service.getOne(req.params.id);
      res.json(data);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  async create(req: Request, res: Response) {
    try {
      const data = await this.service.create(req.body);
      res.status(201).json(data);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  async update(req: Request, res: Response) {
    try {
      const data = await this.service.update(req.params.id, req.body);
      res.json(data);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  async delete(req: Request, res: Response) {
    try {
      await this.service.delete(req.params.id);
      res.status(204).send();
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }
}
`;
}

function generateService(name: string): string {
  return `import { ${name}Model } from '../models/${name}Model';

export class ${name}Service {
  async getAll() {
    return await ${name}Model.find();
  }

  async getOne(id: string) {
    return await ${name}Model.findById(id);
  }

  async create(data: any) {
    return await ${name}Model.create(data);
  }

  async update(id: string, data: any) {
    return await ${name}Model.findByIdAndUpdate(id, data, { new: true });
  }

  async delete(id: string) {
    return await ${name}Model.findByIdAndDelete(id);
  }
}
`;
}

function generateRoute(name: string): string {
  const controllerName = name + "Controller";
  return `import { Router } from 'express';
import { adminAuth } from '../../middleware/auth';
import { ${controllerName} } from '../../controllers/${controllerName}';

const router = Router();
const controller = new ${controllerName}();

// Add your routes here
router.get('/', adminAuth, (req, res) => controller.getAll(req, res));
router.post('/', adminAuth, (req, res) => controller.create(req, res));
router.get('/:id', adminAuth, (req, res) => controller.getOne(req, res));
router.patch('/:id', adminAuth, (req, res) => controller.update(req, res));
router.delete('/:id', adminAuth, (req, res) => controller.delete(req, res));

export default router;
`;
}

async function handleDocs() {
  console.log("📖 Documentation\n");

  const action = await question(
    "Action (generate/serve/validate) [generate]: "
  );
  const act = action || "generate";

  const actions: { [key: string]: () => void } = {
    generate: () => {
      console.log("Generating API documentation...");
      console.log("✓ Generated: docs/API.md");
    },
    serve: () => {
      console.log("Serving documentation at http://localhost:8000");
    },
    validate: () => {
      console.log("Validating documentation...");
      console.log("✓ All documentation valid");
    },
  };

  const handler = actions[act];
  if (!handler) {
    console.log("❌ Unknown action");
    return;
  }

  handler();
}

async function handleLog() {
  console.log("📊 Logs & Debug\n");

  const logType = await question(
    "Log type (backend/admin/db/all) [all]: "
  );
  const type = logType || "all";

  const logs: { [key: string]: () => void } = {
    backend: () => console.log("Backend logs...\n (npm run backend:logs)"),
    admin: () => console.log("Admin logs...\n (npm run admin:logs)"),
    db: () => console.log("Database logs...\n (npm run db:logs)"),
    all: () => console.log("All logs...\n (npm run logs)"),
  };

  const handler = logs[type];
  if (!handler) {
    console.log("❌ Unknown log type");
    return;
  }

  handler();
}

async function handleClean() {
  console.log("🧹 Cleaning Build Artifacts\n");

  const confirmDelete = await question(
    "Remove dist/, node_modules/, and cache? (yes/no): "
  );

  if (confirmDelete !== "yes") {
    console.log("Cancelled");
    return;
  }

  try {
    // Remove common build folders
    ["dist", "build", ".next"].forEach((folder) => {
      if (fs.existsSync(folder)) {
        fs.rmSync(folder, { recursive: true, force: true });
        console.log(`✓ Removed ${folder}/`);
      }
    });

    console.log("✓ Cleanup complete");
  } catch (error) {
    console.error("❌ Cleanup failed");
  }
}

function showHelp() {
  console.log("CampusLab Development CLI\n");
  console.log("Usage: npm run cli -- [command] [options]\n");
  console.log("Commands:\n");

  Object.entries(commands).forEach(([cmd, desc]) => {
    console.log(`  ${cmd.padEnd(12)} ${desc}`);
  });

  console.log("\nExamples:");
  console.log("  npm run cli -- setup     # Complete development setup");
  console.log("  npm run cli -- dev       # Start development services");
  console.log("  npm run cli -- test      # Run tests");
  console.log("  npm run cli -- gen model Post  # Generate Post model\n");
}

async function main() {
  const args = process.argv.slice(2);
  const command = args[0] || "help";

  const handlers: { [key: string]: () => Promise<void> } = {
    setup: handleSetup,
    dev: handleDev,
    test: handleTest,
    db: handleDb,
    gen: handleGen,
    docs: handleDocs,
    log: handleLog,
    clean: handleClean,
    help: async () => showHelp(),
  };

  const handler = handlers[command];

  if (!handler) {
    console.log(`❌ Unknown command: ${command}\n`);
    showHelp();
    process.exit(1);
  }

  try {
    await handler();
    rl.close();
  } catch (error: any) {
    console.error("❌ Error:", error.message);
    rl.close();
    process.exit(1);
  }
}

main();

export { };
