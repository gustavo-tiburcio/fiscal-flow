import { config } from "../utils/Config.js";
import { buscarLoteDFe } from "../utils/Dfeclient.js";
import { xmlParser, encontrarArquivosXml } from "../utils/xml.js";
import { processarDocumento } from "./processamentoService.js";

function obterNsuInicial(nsuDesejado = 200) {
  return nsuDesejado - 1;
}

export async function consultarNFSes(nsuDesejado) {
  let nsuAtual = obterNsuInicial(nsuDesejado);
  let totalDocumentos = 0;

  for (let i = 0; i < 100; i++) {
    if (totalDocumentos >= limite) break;

    let dadosResposta;
    try {
      dadosResposta = await buscarLoteDFe(nsuAtual);
    } catch (error) {
      if (error.response) {
        console.log("\nErro HTTP:", error.response.status);
        console.log(error.response.data);
      } else {
        console.log("Erro na consulta:", error.message);
      }
      break;
    }

    if (!dadosResposta) {
      console.log("\nNenhum conteúdo retornado (sem novos documentos). Consulta finalizada.");
      break;
    }

    const respostaObj = xmlParser.parse(dadosResposta);
    const documentos = encontrarArquivosXml(respostaObj);

    if (documentos.length === 0) {
      console.log("\nNenhum ArquivoXml encontrado na resposta. Consulta finalizada.");
      console.log(dadosResposta);
      break;
    }

    for (const doc of documentos) {
      await processarDocumento(doc, nsuAtual);
      totalDocumentos++;

      const nsuDoc = Number(doc.nsu);
      if (Number.isFinite(nsuDoc)) {
        nsuAtual = nsuDoc;
      }
    }
  }

  return totalDocumentos;
}