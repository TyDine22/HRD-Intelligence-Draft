"use client";

import * as React from "react";

export function usePagination<T>(items: T[], pageSize = 15) {
  const [page, setPage] = React.useState(1);
  const pages = Math.max(1, Math.ceil(items.length / pageSize));

  React.useEffect(() => {
    if (page > pages) setPage(pages);
  }, [page, pages]);

  const slice = React.useMemo(() => items.slice((page - 1) * pageSize, page * pageSize), [items, page, pageSize]);

  const reset = React.useCallback(() => setPage(1), []);

  return { page, setPage, pageSize, slice, total: items.length, reset };
}
