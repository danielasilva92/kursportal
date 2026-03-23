import { Parser } from "json2csv";
import { flattenCreatorForCsv } from "../utils/flattenCreatorForCsv.js";

export function convertCreatorsToCsv(creators) {
  const flattened = creators.map(flattenCreatorForCsv);

  const fields = [
    "creatorName",
    "platform",
    "courseUrl",
    "subject",
    "courseCount",
    "pricing",
    "website",
    "emails",
    "socials",
    "estimatedReach",
    "dataSource",
    "language",
    "title",
    "description",
  ];

  const parser = new Parser({ fields });
  return parser.parse(flattened);
}