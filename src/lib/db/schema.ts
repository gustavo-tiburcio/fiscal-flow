/**
 * Drizzle ORM schema (SQLite) — consumido pelo processo principal do Electron.
 * O renderer nunca abre o banco: ele fala com o main via IPC (window.fiscal).
 */
import { sql } from "drizzle-orm";
import { integer, real, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const accountants = sqliteTable("accountants", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  fullName: text("full_name").notNull(),
  email: text("email").notNull(),
  cpf: text("cpf").notNull(),
  createdAt: text("created_at")
    .notNull()
    .default(sql`CURRENT_TIMESTAMP`),
});

export const companies = sqliteTable("companies", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  cnpj: text("cnpj").notNull().unique(),
  name: text("name").notNull(),
  certificateFileName: text("certificate_file_name").notNull(),
  certificatePath: text("certificate_path").notNull(),
  certificatePassword: text("certificate_password").notNull(),
  createdAt: text("created_at")
    .notNull()
    .default(sql`CURRENT_TIMESTAMP`),
});

export const invoices = sqliteTable("invoices", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  companyId: integer("company_id")
    .notNull()
    .references(() => companies.id, { onDelete: "cascade" }),
  number: text("number").notNull(),
  issuedAt: text("issued_at").notNull(),
  recipient: text("recipient").notNull(),
  amount: real("amount").notNull(),
  status: text("status").notNull().default("pending"),
  nfseId: text("nfse_id"),
  nsu: text("nsu"),
  accessKey: text("access_key"),
  chaveNfse: text("chave_nfse"),
  numeroNfse: text("numero_nfse"),
  dataEmissao: text("data_emissao"),
  competencia: text("competencia"),
  ambiente: text("ambiente"),
  nfseStatus: text("nfse_status"),
  prestadorId: text("prestador_id"),
  tomadorId: text("tomador_id"),
  municipioEmissao: text("municipio_emissao"),
  municipioPrestacao: text("municipio_prestacao"),
  municipioIss: text("municipio_iss"),
});
