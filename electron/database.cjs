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
  certificatePath: text("certificate_path").notNull(),
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
    certificate_path TEXT NOT NULL DEFAULT '',
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
    status TEXT NOT NULL DEFAULT 'pending',
    nsu TEXT,
    access_key TEXT,
    nfse_id TEXT,
    chave_nfse TEXT,
    numero_nfse TEXT,
    data_emissao TEXT,
    competencia TEXT,
    ambiente TEXT,
    nfse_status TEXT,
    prestador_id TEXT,
    tomador_id TEXT,
    municipio_emissao TEXT,
    municipio_prestacao TEXT,
    municipio_iss TEXT
  );
`);

function addColumnIfMissing(table, column, definition) {
  const columns = sqlite.pragma(`table_info(${table})`);
  if (!columns.some((item) => item.name === column)) {
    sqlite.exec(`ALTER TABLE ${table} ADD COLUMN ${column} ${definition}`);
  }
}

// Migra bancos locais criados antes da integração de importação de NFS-e.
addColumnIfMissing("companies", "certificate_path", "TEXT NOT NULL DEFAULT ''");
addColumnIfMissing("invoices", "nsu", "TEXT");
addColumnIfMissing("invoices", "access_key", "TEXT");
addColumnIfMissing("invoices", "nfse_id", "TEXT");
addColumnIfMissing("invoices", "chave_nfse", "TEXT");
addColumnIfMissing("invoices", "numero_nfse", "TEXT");
addColumnIfMissing("invoices", "data_emissao", "TEXT");
addColumnIfMissing("invoices", "competencia", "TEXT");
addColumnIfMissing("invoices", "ambiente", "TEXT");
addColumnIfMissing("invoices", "nfse_status", "TEXT");
addColumnIfMissing("invoices", "prestador_id", "TEXT");
addColumnIfMissing("invoices", "tomador_id", "TEXT");
addColumnIfMissing("invoices", "municipio_emissao", "TEXT");
addColumnIfMissing("invoices", "municipio_prestacao", "TEXT");
addColumnIfMissing("invoices", "municipio_iss", "TEXT");
sqlite.exec(`
  UPDATE invoices
  SET
    nfse_id = COALESCE(nfse_id, access_key),
    chave_nfse = COALESCE(chave_nfse, access_key),
    numero_nfse = COALESCE(numero_nfse, number),
    data_emissao = COALESCE(data_emissao, issued_at);
`);
sqlite.exec(`
  CREATE UNIQUE INDEX IF NOT EXISTS invoices_company_nsu_unique
  ON invoices(company_id, nsu)
  WHERE nsu IS NOT NULL;
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
  getCompany(id) {
    return db.select().from(companies).where(eq(companies.id, id)).limit(1).all()[0] ?? null;
  },
  createCompany(data) {
    return db
      .insert(companies)
      .values({ ...data, createdAt: new Date().toISOString() })
      .returning()
      .all()[0];
  },
  updateCompanyCertificate(companyId, data) {
    return (
      db
        .update(companies)
        .set({
          certificateFileName: data.certificateFileName,
          certificatePath: data.certificatePath,
          certificatePassword: data.certificatePassword,
        })
        .where(eq(companies.id, companyId))
        .returning()
        .all()[0] ?? null
    );
  },
  listInvoices(companyId) {
    const query = db.select().from(invoices);
    return companyId ? query.where(eq(invoices.companyId, companyId)).all() : query.all();
  },
  upsertInvoices(companyId, documents) {
    const insert = sqlite.prepare(`
      INSERT INTO invoices (
        company_id, number, issued_at, recipient, amount, status, nsu, access_key,
        nfse_id, chave_nfse, numero_nfse, data_emissao, competencia, ambiente,
        nfse_status, prestador_id, tomador_id, municipio_emissao, municipio_prestacao, municipio_iss
      ) VALUES (
        @companyId, @number, @issuedAt, @recipient, @amount, @status, @nsu, @accessKey,
        @nfseId, @chaveNfse, @numeroNfse, @dataEmissao, @competencia, @ambiente,
        @nfseStatus, @prestadorId, @tomadorId, @municipioEmissao, @municipioPrestacao, @municipioIss
      )
      ON CONFLICT(company_id, nsu) WHERE nsu IS NOT NULL DO UPDATE SET
        number = excluded.number,
        issued_at = excluded.issued_at,
        recipient = excluded.recipient,
        amount = excluded.amount,
        status = excluded.status,
        access_key = excluded.access_key,
        nfse_id = excluded.nfse_id,
        chave_nfse = excluded.chave_nfse,
        numero_nfse = excluded.numero_nfse,
        data_emissao = excluded.data_emissao,
        competencia = excluded.competencia,
        ambiente = excluded.ambiente,
        nfse_status = excluded.nfse_status,
        prestador_id = excluded.prestador_id,
        tomador_id = excluded.tomador_id,
        municipio_emissao = excluded.municipio_emissao,
        municipio_prestacao = excluded.municipio_prestacao,
        municipio_iss = excluded.municipio_iss
    `);
    const saveAll = sqlite.transaction((rows) => {
      for (const document of rows) {
        const { nfse, valores, tomador } = document;
        const nsu = nfse.nsu == null ? null : String(nfse.nsu);
        insert.run({
          companyId,
          number: String(nfse.numero_nfse ?? nfse.chave_nfse ?? nsu ?? "Sem número"),
          issuedAt: normalizarData(nfse.data_emissao),
          recipient: String(tomador.nome ?? "Não informado"),
          amount: Number.isFinite(valores.valor_liquido)
            ? valores.valor_liquido
            : Number.isFinite(valores.valor_servico)
              ? valores.valor_servico
              : 0,
          status: statusDaNfse(nfse.status),
          nsu,
          accessKey: texto(nfse.chave_nfse),
          nfseId: texto(nfse.id),
          chaveNfse: texto(nfse.chave_nfse),
          numeroNfse: texto(nfse.numero_nfse),
          dataEmissao: texto(nfse.data_emissao),
          competencia: texto(nfse.competencia),
          ambiente: texto(nfse.ambiente),
          nfseStatus: texto(nfse.status),
          prestadorId: texto(nfse.prestador_id),
          tomadorId: texto(nfse.tomador_id),
          municipioEmissao: texto(nfse.municipio_emissao),
          municipioPrestacao: texto(nfse.municipio_prestacao),
          municipioIss: texto(nfse.municipio_iss),
        });
      }
    });
    saveAll(documents);
    return documents.length;
  },
};

function normalizarData(value) {
  const parsed = value ? new Date(value) : null;
  return parsed && !Number.isNaN(parsed.getTime())
    ? parsed.toISOString()
    : new Date().toISOString();
}

function statusDaNfse(status) {
  return /cancel/i.test(String(status ?? "")) ? "cancelled" : "authorized";
}

function texto(value) {
  return value == null ? null : String(value);
}
