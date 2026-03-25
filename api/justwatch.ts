const JUSTWATCH_GRAPHQL = 'https://apis.justwatch.com/graphql';

// Hledá film podle názvu a vrátí přímé URL pro streamovací služby
const SEARCH_QUERY = `
query GetSuggestedTitles(
  $country: Country!
  $language: Language!
  $first: Int!
  $filter: TitleFilter!
) {
  popularTitles(country: $country, first: $first, filter: $filter) {
    edges {
      node {
        ... on Movie {
          id
          objectType
          content(country: $country, language: $language) {
            title
            externalIds { tmdbId }
          }
          offers(country: $country, platform: WEB) {
            monetizationType
            standardWebURL
            package { id packageId clearName technicalName }
          }
        }
        ... on Show {
          id
          objectType
          content(country: $country, language: $language) {
            title
            externalIds { tmdbId }
          }
          offers(country: $country, platform: WEB) {
            monetizationType
            standardWebURL
            package { id packageId clearName technicalName }
          }
        }
      }
    }
  }
}`;

export default async function handler(req: any, res: any) {
  const { tmdbId, country, mediaType, title } = req.query;
  if (!tmdbId || !country || !title) {
    return res.status(400).json({ error: 'Missing tmdbId, country or title' });
  }

  const lang = country === 'CZ' ? 'cs' : country === 'SK' ? 'sk' : 'en';

  try {
    const response = await fetch(JUSTWATCH_GRAPHQL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Origin': 'https://www.justwatch.com',
        'Referer': 'https://www.justwatch.com/',
      },
      body: JSON.stringify({
        operationName: 'GetSuggestedTitles',
        query: SEARCH_QUERY,
        variables: {
          country: String(country).toUpperCase(),
          language: lang,
          first: 5,
          filter: { searchQuery: String(title) },
        },
      }),
    });

    const data = await response.json();

    // Najdi správný film podle TMDB ID
    const edges = data?.data?.popularTitles?.edges || [];
    const match = edges.find((e: any) => {
      const extId = e?.node?.content?.externalIds?.tmdbId;
      return String(extId) === String(tmdbId);
    });

    if (match) {
      const offers = (match.node.offers || []).filter((o: any) => o.monetizationType === 'FLATRATE');
      return res.status(200).json({ offers });
    }

    // Vrátíme první výsledek jako fallback
    const firstOffers = edges[0]?.node?.offers?.filter((o: any) => o.monetizationType === 'FLATRATE') || [];
    res.status(200).json({ offers: firstOffers, fallback: true });
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
}
