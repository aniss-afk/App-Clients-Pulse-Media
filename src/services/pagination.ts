/** Charge l'historique entier, même si la limite serveur est inférieure à celle demandée. */
export async function lireHistorique<T>(page: (debut: number, fin: number) => PromiseLike<{
  data: T[] | null;
  error: { message: string } | null;
  count: number | null;
}>): Promise<T[]> {
  const lignes: T[] = [];
  let attendu: number | null = null;
  for (let tentative = 0; tentative < 1000; tentative++) {
    const { data, error, count } = await page(lignes.length, lignes.length + 999);
    if (error) throw new Error(error.message);
    if (count === null || !Number.isSafeInteger(count) || count < 0) throw new Error('Historique incomplet : nombre de lignes indisponible.');
    if (attendu !== null && count !== attendu) throw new Error('Les données ont changé pendant la lecture. Réessayez.');
    attendu = count;
    const recues = data ?? [];
    if (recues.length === 0 && lignes.length < attendu) throw new Error('Historique incomplet. Réessayez.');
    lignes.push(...recues);
    if (lignes.length === attendu) return lignes;
    if (lignes.length > attendu) throw new Error('Historique incohérent. Réessayez.');
  }
  throw new Error('Historique trop volumineux pour être chargé intégralement.');
}
