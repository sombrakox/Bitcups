import { useEffect, useState } from "react";

/**
 * Accordion panel state: a closed header opens on click, the open header closes
 * on click. Follows the selected id whenever the URL selection changes.
 */
export function useExpandedPanel(selectedId: string | null) {
  const [openId, setOpenId] = useState<string | null>(selectedId);

  useEffect(() => {
    setOpenId(selectedId);
  }, [selectedId]);

  const togglePanel = (id: string) => {
    setOpenId((prev) => (prev === id ? null : id));
  };

  return { openId, togglePanel, openPanel: setOpenId };
}
