const parseQueryWithMangetURI = (query) => {
  const knownMagnetURIQueryKeys = [
    "xt",
    "dn",
    "xl",
    "tr",
    "ws",
    "as",
    "xs",
    "kt",
    "mt",
    "so",
    "x.pe",
  ];

  if (!query.uri) {
    return;
  }

  let parsedQuery = {};

  let magnetURI = query.uri;

  for (const [key, val] of Object.entries(query)) {
    if (knownMagnetURIQueryKeys.includes(key)) {
      if (Array.isArray(val)) {
        magnetURI += "&" + val.map((v) => `${key}=${v}`).join("&");
      } else {
        magnetURI += "&" + `${key}=${val}`;
      }
    } else if (key !== "uri") {
      parsedQuery[key] = val;
    }
  }

  parsedQuery.magnetURI = magnetURI;

  return parsedQuery;
};

export default parseQueryWithMangetURI;
