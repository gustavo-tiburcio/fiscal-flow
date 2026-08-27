import zlib from "zlib";
import { XMLParser } from "fast-xml-parser";
import { pegar } from "./objeto.js";

export const xmlParser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: "",
  removeNSPrefix: true,
});

export function converterArquivoXml(base64) {
  if (!base64) return null;

  const arquivo = Buffer.from(base64, "base64");

  try {
    return zlib.gunzipSync(arquivo).toString("utf8");
  } catch (erroGunzip) {
    const textoPlano = arquivo.toString("utf8").trim();
    if (textoPlano.startsWith("<")) {
      console.log("Aviso: ArquivoXml não estava comprimido em gzip; usando texto puro.");
      return textoPlano;
    }
    console.log("Erro ao descompactar XML:", erroGunzip.message);
    return null;
  }
}

/**
 * Percorre recursivamente a resposta da API procurando por nós "ArquivoXml",
 * retornando também o NSU e a chave de acesso associados a cada um.
 */
export function encontrarArquivosXml(no, encontrados = []) {
  if (!no || typeof no !== "object") return encontrados;

  if (no.ArquivoXml !== undefined) {
    const arquivoXmlVal = no.ArquivoXml;
    const base64 =
      typeof arquivoXmlVal === "string"
        ? arquivoXmlVal
        : arquivoXmlVal["#text"] || arquivoXmlVal._ || String(arquivoXmlVal);

    encontrados.push({
      base64,
      nsu: pegar(no, ["Nsu", "NSU"]),
      chaveAcesso: pegar(no, ["ChaveAcesso", "chaveAcesso"]),
    });
  }

  for (const chave of Object.keys(no)) {
    const valor = no[chave];
    if (Array.isArray(valor)) {
      valor.forEach((item) => encontrarArquivosXml(item, encontrados));
    } else if (typeof valor === "object") {
      encontrarArquivosXml(valor, encontrados);
    }
  }

  return encontrados;
}