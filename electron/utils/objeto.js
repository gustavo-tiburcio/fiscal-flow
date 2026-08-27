/**
 * Percorre uma lista de "caminhos" (ex: "NFSe.infNFSe.Id") em um objeto e
 * retorna o primeiro valor não vazio encontrado. Útil para lidar com XMLs
 * que variam de formato entre municípios/versões de layout.
 */
export function pegar(obj, caminhos) {
  for (const caminho of caminhos) {
    const valor = caminho
      .split(".")
      .reduce(
        (acc, chave) => (acc !== undefined && acc !== null ? acc[chave] : undefined),
        obj
      );
    if (valor !== undefined && valor !== null && valor !== "") return valor;
  }
  return null;
}