import { useCallback, useEffect, useRef, useState } from "react";
import { browser } from "wxt/browser";
import {
  type Moment,
  type PopupMessage,
  replySchema,
  type Selection,
  type Snapshot,
  selectionSchema,
} from "../contracts";
import { momentLink } from "../moments";

async function request(message: PopupMessage) {
  const reply = replySchema.parse(await browser.runtime.sendMessage(message));
  if (!reply.ok) throw new Error(reply.error);
  return reply.state;
}
export function useExtension() {
  const [state, setState] = useState<Snapshot | null>(null);
  const [selection, setSelection] = useState<Selection | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [removed, setRemoved] = useState<Moment | null>(null);
  const mounted = useRef(false);
  const reload = useCallback(async () => {
    try {
      const value = await request({ type: "snapshot" });
      if (mounted.current) {
        setState(value);
        setError(null);
      }
    } catch (error) {
      if (mounted.current)
        setError(
          error instanceof Error
            ? error.message
            : "Your saved moments could not be loaded.",
        );
    }
  }, []);
  const capture = useCallback(async (): Promise<Selection | null> => {
    try {
      const [tab] = await browser.tabs.query({
        active: true,
        currentWindow: true,
      });
      const raw: unknown =
        tab?.id === undefined
          ? null
          : await browser.tabs.sendMessage(
              tab.id,
              { type: "read-selection" },
              { frameId: 0 },
            );
      const parsed = selectionSchema.safeParse(raw);
      const value = parsed.success ? parsed.data : null;
      if (mounted.current) setSelection(value);
      return value;
    } catch {
      if (mounted.current) setSelection(null);
      return null;
    }
  }, []);
  const send = useCallback(
    async (message: PopupMessage): Promise<boolean> => {
      setPending(true);
      setError(null);
      setNotice(null);
      try {
        const value = await request(message);
        if (mounted.current) {
          setState(value);
          if (message.type === "save-moment") {
            setNotice("Moment saved");
            setRemoved(null);
          }
          if (message.type === "remove-moment") {
            setRemoved(
              state?.moments.find((moment) => moment.id === message.id) ?? null,
            );
            setNotice("Moment removed");
          }
          if (message.type === "restore-moment") {
            setRemoved(null);
            setNotice("Moment restored");
          }
        }
        return true;
      } catch (error) {
        if (mounted.current)
          setError(
            error instanceof Error ? error.message : "Please try again.",
          );
        return false;
      } finally {
        if (mounted.current) setPending(false);
      }
    },
    [state],
  );
  const copy = useCallback(async (moment: Moment) => {
    setError(null);
    try {
      await navigator.clipboard.writeText(momentLink(moment));
      if (mounted.current) setNotice("Link copied");
    } catch {
      if (mounted.current)
        setError(
          "The link could not be copied. Open the moment and copy the address instead.",
        );
    }
  }, []);
  useEffect(() => {
    mounted.current = true;
    const onStorage = (changes: Record<string, unknown>) => {
      if ("moments" in changes) void reload();
    };
    void reload();
    void capture();
    browser.storage.onChanged.addListener(onStorage);
    return () => {
      mounted.current = false;
      browser.storage.onChanged.removeListener(onStorage);
    };
  }, [capture, reload]);
  return {
    state,
    selection,
    error,
    pending,
    notice,
    removed,
    send,
    copy,
    capture,
    reload,
  };
}
