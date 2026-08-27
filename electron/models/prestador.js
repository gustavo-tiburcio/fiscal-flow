export function criarPrestador({ cnpj, razao_social, inscricao_municipal, endereco }) {
  return {
    cnpj: cnpj || null,
    razao_social: razao_social || null,
    inscricao_municipal: inscricao_municipal || null,
    endereco: endereco || null,
  };
}