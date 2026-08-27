export function criarXmlOriginal({ arquivo_xml, data_download }) {
  return {
    arquivo_xml: arquivo_xml || null,
    data_download: data_download || new Date().toISOString(),
  };
}