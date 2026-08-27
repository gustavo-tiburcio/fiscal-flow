import dotenv from "dotenv";

dotenv.config();

/**
 * Lê uma variável de ambiente obrigatória e lança um erro claro
 * caso ela não esteja definida — no código original, a ausência de
 * uma variável (ex: CERTIFICADO) só se manifestava como um erro
 * críptico de "ENOENT: undefined" no meio da execução.
 */
function exigirVariavel(nome) {
  const valor = process.env[nome];
  if (!valor) {
    throw new Error(
      `Variável de ambiente obrigatória não definida: ${nome}. Verifique seu arquivo .env.`
    );
  }
  return valor;
}

export const config = {
  certificado: exigirVariavel("CERTIFICADO"),
  senhaCertificado: exigirVariavel("SENHA_CERTIFICADO"),
  cnpj: exigirVariavel("CNPJ"),
  baseUrl: exigirVariavel("BASE_URL"),
  pastaXml: process.env.PASTA_XML || "./xml",
  maxIteracoesPaginacao: Number(process.env.MAX_ITERACOES_PAGINACAO || 1),
  limiteDocumentosPorExecucao: Number(process.env.LIMITE_DOCUMENTOS_POR_EXECUCAO || 1),
};