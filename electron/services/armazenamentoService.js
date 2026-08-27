import fs from "fs";
import path from "path";
import { config } from "../utils/config.js";

/**
 * Salva o XML original de um documento em disco.
 */
export function salvarXml(xmlString, chaveAcesso, nsuDoc) {
  if (!fs.existsSync(config.pastaXml)) {
    fs.mkdirSync(config.pastaXml, { recursive: true });
  }
  const nomeArquivo = chaveAcesso ? `${chaveAcesso}.xml` : `nsu-${nsuDoc}-${Date.now()}.xml`;
  const caminho = path.join(config.pastaXml, nomeArquivo);
  fs.writeFileSync(caminho, xmlString, "utf8");
  return caminho;
}
