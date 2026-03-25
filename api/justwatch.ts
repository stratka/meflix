const JUSTWATCH_GRAPHQL = 'https://apis.justwatch.com/graphql';

const MOVIE_QUERY = `
query GetNodeByExternalId(
  $externalId: String!
  $provider: ExternalIdProvider!
  $objectType: ObjectType!
  $country: Country!
  $language: Language!
  $platform: Platform!
) {
  nodeByExternalId(externalId: $externalId, provider: $provider, objectType: $objectType) {
    ... on Movie {
      id
      content(country: $country, language: $language) { title }
      offers(country: $country, platform: $platform) {
        monetizationType
        standardWebURL
        package { id packageId clearName technicalName }
      }
    }
    ... on Show {
      id
      content(country: $country, language: $language) { title }
      offers(country: $country, platform: $platform) {
        monetizationType
        standardWebURL
        package { id packageId clearName technicalName }
      }
    }
  }
}`;

export default async function handler(req: any, res: any) {
  const { tmdbId, country, mediaType } = req.query;
  if (!tmdbId || !country) {
    return res.status(400).json({ error: 'Missing tmdbId or country' });
  }

  const objectType = mediaType === 'tv' ? 'SHOW' : 'MOVIE';
  const lang = country === 'CZ' ? 'cs' : country === 'SK' ? 'sk' : 'en';

  try {
    const response = await fetch(JUSTWATCH_GRAPHQL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'User-Agent': 'Mozilla/5.0',
      },
      body: JSON.stringify({
        query: MOVIE_QUERY,
        variables: {
          externalId: String(tmdbId),
          provider: 'TMDB',
          objectType,
          country: String(country).toUpperCase(),
          language: lang,
          platform: 'WEB',
        },
      }),
    });

    const data = await response.json();
    res.status(200).json(data);
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
}
