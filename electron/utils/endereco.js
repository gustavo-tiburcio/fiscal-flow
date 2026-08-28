/**
 * Monta uma string de endereço legível a partir do objeto de endereço
 * extraído do XML da NFS-e.
 */
export function formatarEndereco(end) {
  if (!end || typeof end !== "object") return null;
  const partes = [end.xLgr, end.nro, end.xCpl, end.xBairro, end.CEP, end.cMun, end.UF].filter(
    Boolean,
  );
  return partes.length ? partes.join(", ") : null;
}
