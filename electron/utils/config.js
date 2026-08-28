/**
 * Dados de autenticação pertencem à empresa cadastrada, nunca ao .env.
 * A URL da ADN é fixa e fica no cliente HTTP.
 */
export function criarConfigConsulta(empresa) {
  if (!empresa?.certificatePath) {
    throw new Error("Selecione novamente o certificado digital desta empresa.");
  }
  if (!empresa.certificatePassword) {
    throw new Error("A senha do certificado desta empresa não está disponível.");
  }
  const cnpj = String(empresa.cnpj ?? "").replace(/\D/g, "");
  if (cnpj.length !== 14) {
    throw new Error("O CNPJ cadastrado para esta empresa é inválido.");
  }

  return {
    certificado: empresa.certificatePath,
    senhaCertificado: empresa.certificatePassword,
    cnpj,
    maxIteracoesPaginacao: 100,
    limiteDocumentosPorExecucao: 1000,
  };
}
