export function criarServico({ codigo_servico, descricao, nbs }) {
  return {
    codigo_servico: codigo_servico || null,
    descricao: descricao || null,
    nbs: nbs || null,
  };
}
