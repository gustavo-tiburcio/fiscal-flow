import axios from "axios";
import https from "https";
import fs from "fs";
import { config } from "./config.js";

// O agente HTTPS (com o certificado carregado) é criado apenas uma vez
// e reaproveitado entre chamadas.
//
// Correção: o código original recriava o https.Agent — e relia o
// arquivo do certificado do disco — a cada chamada de
// consultarNFSes(). Isso não chegava a ser um problema com uma única
// chamada, mas passa a custar caro (I/O + parsing do PFX) assim que
// passamos a paginar em loop.
let agenteHttps = null;

function obterAgenteHttps() {
  if (!agenteHttps) {
    agenteHttps = new https.Agent({
      pfx: fs.readFileSync(config.certificado),
      passphrase: config.senhaCertificado,
      rejectUnauthorized: true,
    });
  }
  return agenteHttps;
}

/**
 * Busca um lote de documentos a partir de um NSU.
 * Retorna o corpo (XML) da resposta, ou `null` quando não há
 * conteúdo novo (HTTP 204).
 */
export async function buscarLoteDFe(nsu) {
  const url = `${config.baseUrl}/contribuintes/DFe/${nsu}`;
  console.log("\nConsultando:", url);

  const resposta = await axios.get(url, {
    httpsAgent: obterAgenteHttps(),
    headers: {
      Accept: "application/xml",
      CNPJ: config.cnpj,
    },
  });
  
  console.log("HTTP Status:", resposta.status);

  if (resposta.status === 204 || !resposta.data) {
    return null;
  }

  return resposta.data;
}