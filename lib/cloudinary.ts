import "server-only";

import { v2 as cloudinary } from "cloudinary";

const SHOWCASE_PREFIX = "showcase/";
const DEFAULT_MAX_RESULTS = 100;

export type ShowcaseImage = {
  publicId: string;
  category: string;
};

type CloudinaryResource = {
  public_id: string;
  asset_folder?: string;
};

type CloudinaryResourcesResponse = {
  resources?: CloudinaryResource[];
  next_cursor?: string;
};

let isConfigured = false;

function extractCategoryFromPath(path: string) {
  const normalized = path.replace(/\\/g, "/").replace(/^\/+/, "");

  if (normalized.toLowerCase().startsWith(SHOWCASE_PREFIX)) {
    const [folder] = normalized.slice(SHOWCASE_PREFIX.length).split("/");

    if (!folder) {
      return "Uncategorized";
    }

    return folder.replace(/[-_]+/g, " ").trim().toUpperCase();
  }

  const [, folder] = normalized.split("/");

  if (!folder) {
    return "Uncategorized";
  }

  return folder.replace(/[-_]+/g, " ").trim().toUpperCase();
}

function extractCategory(resource: CloudinaryResource) {
  if (resource.asset_folder) {
    return extractCategoryFromPath(resource.asset_folder);
  }

  return extractCategoryFromPath(resource.public_id);
}

function configureCloudinary() {
  if (isConfigured) {
    return true;
  }

  const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;

  if (!cloudName || !apiKey || !apiSecret) {
    console.warn(
      "Cloudinary is not fully configured. Set NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET.",
    );
    return false;
  }

  cloudinary.config({
    cloud_name: cloudName,
    api_key: apiKey,
    api_secret: apiSecret,
    secure: true,
  });

  isConfigured = true;
  return true;
}

export async function getShowcaseImages(
  maxResults = DEFAULT_MAX_RESULTS,
): Promise<ShowcaseImage[]> {
  if (!configureCloudinary()) {
    return [];
  }

  const images: ShowcaseImage[] = [];
  let nextCursor: string | undefined;

  try {
    do {
      let search = cloudinary.search
        .expression("resource_type:image AND asset_folder:showcase*")
        .sort_by("public_id", "desc")
        .max_results(maxResults);

      if (nextCursor) {
        search = search.next_cursor(nextCursor);
      }

      const response = (await search.execute()) as CloudinaryResourcesResponse;

      for (const resource of response.resources ?? []) {
        const folderPath =
          resource.asset_folder?.replace(/\\/g, "/").replace(/^\/+/, "") ?? "";

        if (!folderPath.toLowerCase().startsWith(SHOWCASE_PREFIX)) {
          continue;
        }

        images.push({
          publicId: resource.public_id,
          category: extractCategory(resource),
        });
      }

      nextCursor = response.next_cursor;
    } while (nextCursor);

    if (images.length === 0) {
      nextCursor = undefined;

      do {
        const response = (await cloudinary.api.resources({
          resource_type: "image",
          type: "upload",
          prefix: SHOWCASE_PREFIX,
          max_results: maxResults,
          next_cursor: nextCursor,
        })) as CloudinaryResourcesResponse;

        for (const resource of response.resources ?? []) {
          if (!resource.public_id.startsWith(SHOWCASE_PREFIX)) {
            continue;
          }

          images.push({
            publicId: resource.public_id,
            category: extractCategory(resource),
          });
        }

        nextCursor = response.next_cursor;
      } while (nextCursor);
    }
  } catch (error) {
    console.error("Failed to fetch Cloudinary showcase images", error);
    return [];
  }

  const deduped = Array.from(
    new Map(images.map((image) => [image.publicId, image])).values(),
  );

  return deduped.sort((a, b) => {
    const byCategory = a.category.localeCompare(b.category);

    if (byCategory !== 0) {
      return byCategory;
    }

    return a.publicId.localeCompare(b.publicId);
  });
}
