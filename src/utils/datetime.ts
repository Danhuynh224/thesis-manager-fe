const DEFAULT_LOCALE = "vi-VN";

function parseDate(value?: string | null) {
  if (!value) {
    return null;
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return date;
}

export function formatDateTimeVi(
  value?: string | null,
  fallback = "--",
) {
  const date = parseDate(value);

  if (!date) {
    return value ?? fallback;
  }

  return new Intl.DateTimeFormat(DEFAULT_LOCALE, {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

export function formatDateVi(
  value?: string | null,
  fallback = "--",
) {
  const date = parseDate(value);

  if (!date) {
    return value ?? fallback;
  }

  return new Intl.DateTimeFormat(DEFAULT_LOCALE, {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(date);
}
