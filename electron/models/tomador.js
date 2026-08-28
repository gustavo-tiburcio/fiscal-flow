export function criarTomador({ cpf_cnpj, nome, endereco }) {
  return {
    cpf_cnpj: cpf_cnpj || null,
    nome: nome || null,
    endereco: endereco || null,
  };
}
