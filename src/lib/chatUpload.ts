import { supabase } from "@/integrations/supabase/client";

const BUCKET = "chat-uploads";
const ONE_YEAR = 60 * 60 * 24 * 365;

/**
 * Uploads chat images and returns long-lived signed URLs that can be
 * rendered and downloaded by both the client and the management panel.
 */
export async function uploadChatImages(files: File[], folder: string): Promise<string[]> {
  const urls: string[] = [];

  for (const file of files) {
    const ext = file.name.split(".").pop() || "jpg";
    const path = `${folder}/${Date.now()}_${Math.random().toString(36).slice(2, 8)}.${ext}`;

    const { error } = await supabase.storage.from(BUCKET).upload(path, file, {
      contentType: file.type || "image/jpeg",
      upsert: false,
    });
    if (error) throw error;

    const { data } = await supabase.storage.from(BUCKET).createSignedUrl(path, ONE_YEAR);
    if (data?.signedUrl) urls.push(data.signedUrl);
  }

  return urls;
}

export async function downloadImage(url: string, filename = "image.jpg") {
  try {
    const res = await fetch(url);
    const blob = await res.blob();
    const objectUrl = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = objectUrl;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(objectUrl);
  } catch {
    window.open(url, "_blank");
  }
}
