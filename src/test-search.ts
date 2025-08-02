import { searchSimilarDocs } from './opensearch';

(async () => {
  const resultados = await searchSimilarDocs("O que é investimento?");
  console.log(resultados);
})();