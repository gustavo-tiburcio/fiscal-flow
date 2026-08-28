import { xmlParser, converterArquivoXml } from "../utils/xml.js";
import { extrairNfse, validarNfse } from "./validacaoService.js";
import { montarObjetos } from "./montadorService.js";

export async function processarDocumento(doc, nsuLote) {
  const nsuDoc = doc.nsu ?? nsuLote;

  const xml = converterArquivoXml(doc.base64);
  if (!xml) {
    console.log(`Documento (NSU ${nsuDoc}) ignorado: falha ao ler/descompactar o XML.`);
    return;
  }

  let nfseObj = null;

  try {
    nfseObj = xmlParser.parse(xml);
  } catch (erroParse) {
    console.log("Erro ao interpretar XML da NFS-e:", erroParse.message);
    return;
  }

  const nfse = extrairNfse(nfseObj);
  if (!nfse) {
    console.log(
      `Documento (NSU ${nsuDoc}) ignorado: não contém infNFSe. Raiz XML: ${Object.keys(nfseObj).join(", ") || "desconhecida"}.`,
    );
    return null;
  }

  const { valido, motivos } = validarNfse(nfse, xml);

  if (!valido) {
    console.log("NFS-e INVÁLIDA. Motivos:", motivos);
    return;
  }

  if (motivos.length) {
    console.log("Avisos:", motivos);
  }

  const objetos = montarObjetos({ nfseObj: nfse, nsu: nsuDoc, xmlString: xml });
  return objetos;
}
