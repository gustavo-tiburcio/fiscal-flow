import { criarConfigConsulta } from "../utils/config.js";
import { buscarLoteDFe, criarAgenteHttps } from "../utils/dfeClient.js";
import { xmlParser, encontrarArquivosXml } from "../utils/xml.js";
import { processarDocumento } from "./processamentoService.js";


export async function consultarNFSes(empresa, { nsuDesejado = 1, onDocument } = {}) {
  const config = criarConfigConsulta(empresa);
  const agenteHttps = criarAgenteHttps(config);
  let nsuAtual = 1
  let totalDocumentos = 0;

  for (let i = 0; i < config.maxIteracoesPaginacao; i++) {
    if (totalDocumentos >= config.limiteDocumentosPorExecucao) break;

    let dadosResposta;
    try {
      dadosResposta = await buscarLoteDFe(nsuAtual, config, agenteHttps);
    } catch (error) {
      if (error.response) {
        console.log("\nErro HTTP:", error.response.status);
        console.log(error.response.data);
        throw new Error(`A consulta de NFS-e falhou (HTTP ${error.response.status}).`);
      }

      console.log("Erro na consulta:", error.message);
      if (error.code === "ERR_SSL_BAD_DECRYPT" || /BAD_DECRYPT/i.test(error.message)) {
        throw new Error(
          "Não foi possível desbloquear o certificado digital. Confirme a senha e selecione novamente o arquivo .pfx ou .p12 original.",
        );
      }
      throw error;
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
      if (totalDocumentos >= config.limiteDocumentosPorExecucao) break;
      const documento = await processarDocumento(doc, nsuAtual);
      if (documento) {
        onDocument?.(documento);
        totalDocumentos++;
      }

      const nsuDoc = Number(doc.nsu);
      if (Number.isFinite(nsuDoc)) {
        nsuAtual = nsuDoc;
      }
    }
  }

  return totalDocumentos;
}
