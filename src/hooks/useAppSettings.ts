import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

export const DEFAULT_WHATSAPP_NUMBER = "+447423449300";

export function useAppSetting(key: string) {
  const [value, setValue] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchValue = useCallback(async () => {
    const { data } = await supabase
      .from("app_settings")
      .select("value")
      .eq("key", key)
      .maybeSingle();
    setValue(data?.value ?? null);
    setLoading(false);
  }, [key]);

  useEffect(() => {
    fetchValue();
  }, [fetchValue]);

  const save = useCallback(
    async (newValue: string) => {
      const { error } = await supabase
        .from("app_settings")
        .upsert({ key, value: newValue }, { onConflict: "key" });
      if (!error) setValue(newValue);
      return error;
    },
    [key]
  );

  return { value, loading, save, refetch: fetchValue };
}

/** Digits-only form used by wa.me links. Returns null when unusable. */
export function toWaLink(raw: string | null | undefined): string | null {
  if (!raw) return null;
  const digits = raw.replace(/\D/g, "");
  return digits.length >= 8 ? digits : null;
}
