import { pegar } from "../utils/objeto.js";

/**
 * O ADN entrega diversos DF-e (NFS-e, eventos, créditos e débitos). Quando a
 * NFS-e vem encapsulada, devolve uma estrutura canônica para o montador;
 * quando o documento não é uma NFS-e, devolve null.
 */
export function extrairNfse(documento) {
  if (!documento || typeof documento !== "object") return null;
  if (pegar(documento, ["NFSe.infNFSe"])) return documento;

  const nfse = encontrarNoComInfNfse(documento);
  return nfse ? { NFSe: nfse } : null;
}

function encontrarNoComInfNfse(no) {
  if (!no || typeof no !== "object") return null;
  if (pegar(no, ["infNFSe"]) && typeof pegar(no, ["infNFSe"]) === "object") return no;

  for (const valor of Object.values(no)) {
    if (Array.isArray(valor)) {
      for (const item of valor) {
        const encontrado = encontrarNoComInfNfse(item);
        if (encontrado) return encontrado;
      }
    } else {
      const encontrado = encontrarNoComInfNfse(valor);
      if (encontrado) return encontrado;
    }
  }
  return null;
}

/**
 * Valida se o objeto de NFS-e (já parseado) tem a estrutura mínima
 * esperada. Retorna motivos críticos (que invalidam o documento) e
 * avisos (não críticos, ex: assinatura ausente).
 */
export function validarNfse(nfseObj, xmlString) {
  const motivos = [];

  if (!xmlString || !xmlString.trim()) {
    return { valido: false, motivos: ["XML vazio"] };
  }

  if (!nfseObj) {
    return { valido: false, motivos: ["Falha ao converter XML em objeto (XML mal formado)"] };
  }

  if (!pegar(nfseObj, ["NFSe.infNFSe"])) motivos.push("Tag infNFSe não encontrada");
  if (!pegar(nfseObj, ["NFSe.infNFSe.Id", "NFSe.infNFSe.chNFSe"])) {
    motivos.push("Chave de acesso não encontrada");
  }
  if (
    !pegar(nfseObj, ["NFSe.infNFSe.DPS.infDPS.prest.CNPJ", "NFSe.infNFSe.DPS.infDPS.prest.CPF"])
  ) {
    motivos.push("Dados do prestador não encontrados");
  }
  if (!pegar(nfseObj, ["NFSe.Signature"])) {
    motivos.push("Aviso: bloco Signature (assinatura digital) não encontrado");
  }

  const motivosCriticos = motivos.filter((m) => !m.startsWith("Aviso"));

  return { valido: motivosCriticos.length === 0, motivos };
}
