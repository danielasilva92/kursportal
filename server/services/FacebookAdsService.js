import axios from "axios";

const PLATFORM_DOMAINS = [
  "teachable.com",
  "kajabi.com",
  "mykajabi.com",
  "thinkific.com",
  "podia.com",
  "learnworlds.com",
];

const SEARCH_TERMS = ["onlinekurs", "distanskurs", "utbildning online", "lär dig", "kurspaket"];

function extractCreatorUrls(ads = []) {
  const urls = new Set();

  for (const ad of ads) {
    const links = [
      ...(ad.snapshot?.link_url ? [ad.snapshot.link_url] : []),
      ...(ad.snapshot?.cards?.map((c) => c.link_url) || []),
    ];

    for (const link of links) {
      if (!link) continue;
      try {
        const { hostname } = new URL(link);
        const usesPlatform = PLATFORM_DOMAINS.some((d) => hostname.includes(d));
        if (usesPlatform) {
          urls.add(link);
        }
      } catch {
        continue;
      }
    }
  }

  return [...urls];
}

export async function discoverViaFacebookAds() {
  const token = process.env.FACEBOOK_ACCESS_TOKEN;
  if (!token) return [];

  const found = new Set();

  for (const term of SEARCH_TERMS) {
    try {
      const response = await axios.get("https://graph.facebook.com/v19.0/ads_archive", {
        params: {
          access_token: token,
          ad_type: "ALL",
          ad_reached_countries: "SE",
          search_terms: term,
          fields: "snapshot{link_url,cards{link_url}}",
          limit: 50,
        },
        timeout: 10000,
      });

      const ads = response.data?.data || [];
      extractCreatorUrls(ads).forEach((url) => found.add(url));
    } catch (err) {
      const status = err?.response?.status;
      if (status === 401 || status === 403) break;
      continue;
    }
  }

  return [...found];
}
