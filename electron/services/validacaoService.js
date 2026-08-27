import { pegar } from "../utils/objeto.js";

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
  if (!pegar(nfseObj, ["NFSe.infNFSe.DPS.infDPS.prest.CNPJ", "NFSe.infNFSe.DPS.infDPS.prest.CPF"])) {
    motivos.push("Dados do prestador não encontrados");
  }
  if (!pegar(nfseObj, ["NFSe.Signature"])) {
    motivos.push("Aviso: bloco Signature (assinatura digital) não encontrado");
  }

  const motivosCriticos = motivos.filter((m) => !m.startsWith("Aviso"));

  return { valido: motivosCriticos.length === 0, motivos };
}