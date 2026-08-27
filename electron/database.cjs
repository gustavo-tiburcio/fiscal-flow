/**
 * Camada de dados do processo principal: SQLite + Drizzle ORM.
 */
const path = require("node:path");
const { app } = require("electron");
const Database = require("better-sqlite3");
const { drizzle } = require("drizzle-orm/better-sqlite3");
const { eq, desc } = require("drizzle-orm");
const { sqliteTable, integer, real, text } = require("drizzle-orm/sqlite-core");

const accountants = sqliteTable("accountants", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  fullName: text("full_name").notNull(),
  email: text("email").notNull(),
  cpf: text("cpf").notNull(),
  createdAt: text("created_at").notNull(),
});

const companies = sqliteTable("companies", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  cnpj: text("cnpj").notNull().unique(),
  name: text("name").notNull(),
  certificateFileName: text("certificate_file_name").notNull(),
  certificatePassword: text("certificate_password").notNull(),
  createdAt: text("created_at").notNull(),
});

const invoices = sqliteTable("invoices", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  companyId: integer("company_id").notNull(),
  number: text("number").notNull(),
  issuedAt: text("issued_at").notNull(),
  recipient: text("recipient").notNull(),
  amount: real("amount").notNull(),
  status: text("status").notNull(),
});

const sqlite = new Database(path.join(app.getPath("userData"), "fiscal.db"));
sqlite.pragma("journal_mode = WAL");
sqlite.exec(`
  CREATE TABLE IF NOT EXISTS accountants (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    full_name TEXT NOT NULL,
    email TEXT NOT NULL,
    cpf TEXT NOT NULL,
    created_at TEXT NOT NULL
  );
  CREATE TABLE IF NOT EXISTS companies (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    cnpj TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    certificate_file_name TEXT NOT NULL,
    certificate_password TEXT NOT NULL,
    created_at TEXT NOT NULL
  );
  CREATE TABLE IF NOT EXISTS invoices (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    company_id INTEGER NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    number TEXT NOT NULL,
    issued_at TEXT NOT NULL,
    recipient TEXT NOT NULL,
    amount REAL NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending'
  );
`);

const db = drizzle(sqlite);

module.exports = {
  getAccountant() {
    return db.select().from(accountants).limit(1).all()[0] ?? null;
  },
  saveAccountant(data) {
    db.delete(accountants).run();
    return db
      .insert(accountants)
      .values({ ...data, createdAt: new Date().toISOString() })
      .returning()
      .all()[0];
  },
  listCompanies() {
    return db.select().from(companies).orderBy(desc(companies.createdAt)).all();
  },
  createCompany(data) {
    return db
      .insert(companies)
      .values({ ...data, createdAt: new Date().toISOString() })
      .returning()
      .all()[0];
  },
  listInvoices(companyId) {
    const query = db.select().from(invoices);
    return companyId ? query.where(eq(invoices.companyId, companyId)).all() : query.all();
  },
};
