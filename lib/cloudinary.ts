import "server-only";

import { v2 as cloudinary } from "cloudinary";
import { unstable_cache } from "next/cache";

const SHOWCASE_PREFIX = "showcase/";
const DEFAULT_MAX_RESULTS = 100;

export type ShowcaseImage = {
  publicId: string;
  category: string;
  subcategory?: string;
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

function extractCategoriesFromPath(path: string, isFolder: boolean) {
  const normalized = path.replace(/\\/g, "/").replace(/^\/+/, "");

  let parts: string[] = [];
  if (normalized.toLowerCase().startsWith(SHOWCASE_PREFIX)) {
    parts = normalized.slice(SHOWCASE_PREFIX.length).split("/").filter(Boolean);
  } else {
    parts = normalized.split("/").filter(Boolean);
  }

  if (!isFolder && parts.length > 0) {
    parts.pop(); // remove filename
  }

  if (parts.length === 0) {
    return { category: "Uncategorized" };
  }

  const category = parts[0].replace(/_/g, " ").trim().toUpperCase();
  const subcategory = parts.length > 1 ? parts[1].replace(/_/g, " ").trim().toUpperCase() : undefined;

  return { category, subcategory };
}

function extractCategories(resource: CloudinaryResource) {
  if (resource.asset_folder) {
    return extractCategoriesFromPath(resource.asset_folder, true);
  }
  return extractCategoriesFromPath(resource.public_id, false);
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

async function fetchShowcaseImages(
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
          ...extractCategories(resource),
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
            ...extractCategories(resource),
          });
        }

        nextCursor = response.next_cursor;
      } while (nextCursor);
    }
  } catch (error) {
    // Rethrow so a failed fetch isn't cached as an empty gallery.
    throw error;
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

/**
 * Showcase listing, cached for an hour across requests (and shared by the home
 * and portfolio pages) so page loads don't wait on the Cloudinary Search API.
 */
const cachedShowcaseImages = unstable_cache(fetchShowcaseImages, ["showcase-images"], {
  revalidate: 3600,
  tags: ["showcase"],
});

export async function getShowcaseImages(maxResults = DEFAULT_MAX_RESULTS) {
  try {
    return await cachedShowcaseImages(maxResults);
  } catch (error) {
    console.error("Failed to fetch Cloudinary showcase images", error);
    return [];
  }
}

const QUOTE_FOLDER = "quotes";

export type UploadedFile = { url: string; publicId: string; bytes: number; resourceType: string };

/** Stream a file to Cloudinary. Returns null when Cloudinary isn't configured; throws on failure. */
async function uploadToCloudinary(file: File, folder: string): Promise<UploadedFile | null> {
  if (!configureCloudinary()) {
    return null;
  }

  const buffer = Buffer.from(await file.arrayBuffer());

  const result = await new Promise<{ secure_url: string; public_id: string; bytes: number; resource_type: string }>(
    (resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        {
          folder,
          resource_type: "auto",
          use_filename: true,
          unique_filename: true,
        },
        (error, uploaded) => {
          if (error || !uploaded) {
            reject(error ?? new Error("Upload failed"));
            return;
          }
          resolve(uploaded as { secure_url: string; public_id: string; bytes: number; resource_type: string });
        },
      );
      stream.end(buffer);
    },
  );

  return { url: result.secure_url, publicId: result.public_id, bytes: result.bytes, resourceType: result.resource_type };
}

/**
 * Uploads a customer's quote attachment to Cloudinary and returns its secure
 * URL, or null when Cloudinary isn't configured. Throws on upload failure.
 */
export async function uploadQuoteAttachment(file: File): Promise<string | null> {
  return (await uploadToCloudinary(file, QUOTE_FOLDER))?.url ?? null;
}

/** Design proofs and files staff attach to an order, grouped per order number. */
export async function uploadOrderAsset(file: File, orderNumber: number) {
  return uploadToCloudinary(file, `orders/${orderNumber}`);
}

/** Remove an asset we uploaded. Failures are logged, not thrown: the DB row is what matters. */
export async function deleteCloudinaryAsset(publicId: string, mimeType: string | null) {
  if (!configureCloudinary()) return;
  const resourceType = mimeType?.startsWith("image/") ? "image" : mimeType === "application/pdf" ? "image" : "raw";
  try {
    await cloudinary.uploader.destroy(publicId, { resource_type: resourceType, invalidate: true });
  } catch (error) {
    console.error("Cloudinary delete failed", publicId, error);
  }
}
