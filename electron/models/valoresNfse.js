export function criarValoresNfse({
  valor_servico,
  base_iss,
  valor_iss,
  valor_liquido,
  aliquota_iss,
  iss_retido,
}) {
  return {
    valor_servico: valor_servico != null ? Number(valor_servico) : null,
    base_iss: base_iss != null ? Number(base_iss) : null,
    valor_iss: valor_iss != null ? Number(valor_iss) : null,
    valor_liquido: valor_liquido != null ? Number(valor_liquido) : null,
    aliquota_iss: aliquota_iss != null ? Number(aliquota_iss) : null,
    iss_retido: !!iss_retido,
  };
}
