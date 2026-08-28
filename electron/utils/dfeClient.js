import axios from "axios";
import https from "https";
import fs from "fs";
import tls from "tls";

const ADN_BASE_URL = "http://adn.nfse.gov.br";

export async function buscarLoteDFe(nsu, config, agenteHttps) {
  const url = `${ADN_BASE_URL}/contribuintes/DFe/${nsu}`;

  const resposta = await axios.get(url, {
    httpsAgent: agenteHttps,
    validateStatus: (status) => (status >= 200 && status < 300) || status === 404,
    headers: {
      Accept: "application/xml",
      CNPJ: config.cnpj,
    },
  });

  console.log("HTTP Status:", resposta.status);

  if (resposta.status === 204 || resposta.status === 404 || !resposta.data) {
    return null;
  }

  return resposta.data;
}

export function criarAgenteHttps(config) {
  try {
    const pfx = fs.readFileSync(config.certificado);
    // Força a leitura agora para apontar senha/certificado inválido antes da
    // chamada HTTP, em vez de retornar um erro TLS genérico no painel.
    const secureContext = tls.createSecureContext({ pfx, passphrase: config.senhaCertificado });

    // Não repassa pfx/passphrase ao Agent. Sem um contexto explícito, cada
    // conexão tenta descriptografar o PFX novamente — origem do ERR_SSL_BAD_DECRYPT
    // observado no Electron para alguns certificados A1.
    return new https.Agent({ secureContext, rejectUnauthorized: true });
  } catch {
    throw new Error(
      "Não foi possível abrir o certificado. Verifique se o arquivo existe, se é .pfx/.p12 e se a senha está correta.",
    );
  }
}
