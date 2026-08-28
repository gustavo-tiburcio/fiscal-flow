export type Accountant = {
  id?: number;
  fullName: string;
  email: string;
  cpf: string;
  createdAt?: string;
};

export type Company = {
  id: number;
  cnpj: string;
  name: string;
  certificateFileName: string;
  certificatePath: string;
  certificatePassword: string;
  createdAt: string;
};

export type NewCompany = Omit<Company, "id" | "createdAt">;

export type InvoiceStatus = "authorized" | "pending" | "cancelled";

export type Invoice = {
  id: number;
  companyId: number;
  number: string;
  issuedAt: string;
  recipient: string;
  amount: number;
  status: InvoiceStatus;
  nfseId?: string | null;
  nsu?: string | null;
  accessKey?: string | null;
  chaveNfse?: string | null;
  numeroNfse?: string | null;
  dataEmissao?: string | null;
  competencia?: string | null;
  ambiente?: string | null;
  nfseStatus?: string | null;
  prestadorId?: string | null;
  tomadorId?: string | null;
  municipioEmissao?: string | null;
  municipioPrestacao?: string | null;
  municipioIss?: string | null;
};

export type CertificateSelection = Pick<Company, "certificateFileName" | "certificatePath">;
export type CertificateCredentials = Pick<
  Company,
  "certificateFileName" | "certificatePath" | "certificatePassword"
>;
export type InvoiceSyncResult = { fetched: number; imported: number };

export const statusLabel: Record<InvoiceStatus, string> = {
  authorized: "Autorizada",
  pending: "Pendente",
  cancelled: "Cancelada",
};

export const onlyDigits = (value: string) => value.replace(/\D+/g, "");

export function maskCpf(value: string) {
  const d = onlyDigits(value).slice(0, 11);
  return d
    .replace(/^(\d{3})(\d)/, "$1.$2")
    .replace(/^(\d{3})\.(\d{3})(\d)/, "$1.$2.$3")
    .replace(/\.(\d{3})(\d{1,2})$/, ".$1-$2");
}

export function maskCnpj(value: string) {
  const d = onlyDigits(value).slice(0, 14);
  return d
    .replace(/^(\d{2})(\d)/, "$1.$2")
    .replace(/^(\d{2})\.(\d{3})(\d)/, "$1.$2.$3")
    .replace(/\.(\d{3})(\d)/, ".$1/$2")
    .replace(/(\d{4})(\d{1,2})$/, "$1-$2");
}

export const isValidCpf = (value: string) => onlyDigits(value).length === 11;
export const isValidCnpj = (value: string) => onlyDigits(value).length === 14;

export const brl = (value: number) =>
  value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

export const shortDate = (iso: string) =>
  new Date(iso).toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric" });
