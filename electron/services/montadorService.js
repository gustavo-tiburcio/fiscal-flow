import { pegar } from "../utils/objeto.js";
import { formatarEndereco } from "../utils/endereco.js";
import {
  criarPrestador,
  criarTomador,
  criarServico,
  criarValoresNfse,
  criarNfse,
  criarXmlOriginal,
} from "../models/index.js";

/**
 * Monta os objetos de domínio (NFS-e, valores, prestador, tomador,
 * serviço, XML original) a partir do objeto já parseado do XML.
 */
export function montarObjetos({ nfseObj, nsu, xmlString }) {
  const raizNFSe = "NFSe.infNFSe";
  const raizDPS = "NFSe.infNFSe.DPS.infDPS";

  const chaveNfse = pegar(nfseObj, [`${raizNFSe}.Id`, `${raizNFSe}.chNFSe`]);
  const prestadorRaw = pegar(nfseObj, [`${raizDPS}.prest`]) || {};
  const tomadorRaw = pegar(nfseObj, [`${raizDPS}.toma`]) || {};
  const servicoRaw = pegar(nfseObj, [`${raizDPS}.serv`]) || {};
  const valoresDpsRaw = pegar(nfseObj, [`${raizDPS}.valores`]) || {};
  const valoresNfseRaw = pegar(nfseObj, [`${raizNFSe}.valores`]) || {};

  const prestador = criarPrestador({
    cnpj: pegar(prestadorRaw, ["CNPJ", "CPF"]),
    razao_social: pegar(prestadorRaw, ["xNome", "xRazao", "xFant"]),
    inscricao_municipal: pegar(prestadorRaw, ["IM"]),
    endereco: formatarEndereco(prestadorRaw.end),
  });

  const tomador = criarTomador({
    cpf_cnpj: pegar(tomadorRaw, ["CNPJ", "CPF", "NIF"]),
    nome: pegar(tomadorRaw, ["xNome"]),
    endereco: formatarEndereco(tomadorRaw.end),
  });

  const servico = criarServico({
    codigo_servico: pegar(servicoRaw, ["cServ.cTribNac", "cTribNac", "cServ.cTribMun"]),
    descricao: pegar(servicoRaw, ["cServ.xDescServ", "xDescServ"]),
    nbs: pegar(servicoRaw, ["cServ.cNBS", "cNBS"]),
  });

  const valores = criarValoresNfse({
    valor_servico:
      pegar(valoresDpsRaw, ["vServPrest.vServ"]) ?? pegar(valoresNfseRaw, ["vServPrest.vServ"]),
    base_iss: pegar(valoresDpsRaw, ["tribMun.vBC", "vBC"]) ?? pegar(valoresNfseRaw, ["vBC"]),
    valor_iss:
      pegar(valoresNfseRaw, ["vISSQN", "tribMun.vISSQN"]) ??
      pegar(valoresDpsRaw, ["tribMun.vISSQN"]),
    valor_liquido: pegar(valoresNfseRaw, ["vLiq"]),
    aliquota_iss: pegar(valoresDpsRaw, ["tribMun.pAliq"]),
    iss_retido: pegar(valoresDpsRaw, ["tribMun.tpRetISSQN"]) === "2",
  });

  const ambienteGeracao = pegar(nfseObj, [`${raizNFSe}.ambGer`, `${raizDPS}.tpAmb`]);

  const nfse = criarNfse({
    nsu,
    chave_nfse: chaveNfse,
    numero_nfse: pegar(nfseObj, [`${raizNFSe}.nNFSe`]),
    data_emissao: pegar(nfseObj, [`${raizNFSe}.dhProc`, `${raizDPS}.dhEmi`]),
    competencia: pegar(nfseObj, [`${raizDPS}.dCompet`]),
    ambiente: String(ambienteGeracao) === "1" ? "producao" : "homologacao",
    status: pegar(nfseObj, [`${raizNFSe}.cStat`]),
    prestador_id: null,
    tomador_id: null,
    municipio_emissao: pegar(nfseObj, [
      `${raizDPS}.cLocEmi`,
      `${raizNFSe}.cLocEmi`,
      `${raizNFSe}.xLocEmi`,
    ]),
    municipio_prestacao: pegar(nfseObj, [`${raizDPS}.serv.cLocPrestacao`]),
    municipio_iss: pegar(nfseObj, [`${raizNFSe}.cLocIncid`]),
  });

  const xmlOriginal = criarXmlOriginal({
    arquivo_xml: xmlString,
    data_download: new Date().toISOString(),
  });

  return { nfse, valores, prestador, tomador, servico, xmlOriginal };
}
