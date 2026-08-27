import { xmlParser, converterArquivoXml } from "../utils/xml.js";
import { validarNfse } from "./validacaoService.js";
import { salvarXml } from "./armazenamentoService.js";
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

  const { valido, motivos } = validarNfse(nfseObj, xml);
  const caminhoSalvo = salvarXml(xml, doc.chaveAcesso, nsuDoc);
  console.log(`\nXML salvo em: ${caminhoSalvo}`);

  if (!valido) {
    console.log("NFS-e INVÁLIDA. Motivos:", motivos);
    return;
  }

  if (motivos.length) {
    console.log("Avisos:", motivos);
  }

  const objetos = montarObjetos({ nfseObj, nsu: nsuDoc, xmlString: xml });
  console.log("\n===== Objetos extraídos =====");
  console.log(JSON.stringify(objetos, null, 2));
}