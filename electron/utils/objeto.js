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
        (acc, chave) => {
          if (acc === undefined || acc === null || typeof acc !== "object") return undefined;
          if (chave in acc) return acc[chave];

          const chaveNormalizada = normalizarChave(chave);
          const chaveEquivalente = Object.keys(acc).find(
            (chaveAtual) => normalizarChave(chaveAtual) === chaveNormalizada,
          );
          return chaveEquivalente ? acc[chaveEquivalente] : undefined;
        },
        obj
      );
    if (valor !== undefined && valor !== null && valor !== "") return valor;
  }
  return null;
}

function normalizarChave(chave) {
  return String(chave).replace(/[^a-z0-9]/gi, "").toLowerCase();
}
