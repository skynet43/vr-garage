interface Props {
  d: string;
  size?: number;
  width?: number;
}

export function IconPath({ d, size = 18 }: Props) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d={d} />
    </svg>
  );
}

export const ICONS = {
  dashboard: 'M3 3h7v9H3zM14 3h7v5h-7zM14 12h7v9h-7zM3 16h7v5H3z',
  car: 'M5 16l1.5-5A2 2 0 0 1 8.4 9.5h7.2a2 2 0 0 1 1.9 1.5L19 16M5 16h14M5 16v3.5h2.5M19 16v3.5h-2.5M7.5 19.5h9M7 13.5h.01M17 13.5h.01',
  wrench: 'M14.7 6.3a4.5 4.5 0 0 0-6 6L3 18l3 3 5.7-5.7a4.5 4.5 0 0 0 6-6L14 13l-3-3 3.7-3.7z',
  box: 'M21 8l-9-5-9 5v8l9 5 9-5V8zM3 8l9 5 9-5M12 13v8',
  gauge: 'M12 15l4-6M5.5 19a9 9 0 1 1 13 0M12 15h.01',
  cube: 'M12 2l9 5v10l-9 5-9-5V7l9-5zM12 12l9-5M12 12L3 7M12 12v10',
  pulse: 'M3 12h4l3 8 4-16 3 8h4',
  search: 'M11 19a8 8 0 1 0 0-16 8 8 0 0 0 0 16zM21 21l-4.3-4.3',
  x: 'M18 6L6 18M6 6l12 12',
  check: 'M20 6L9 17l-5-5',
  bolt: 'M13 2L3 14h7l-1 8 10-12h-7l1-8z',
  book: 'M4 19.5A2.5 2.5 0 0 1 6.5 17H20V2H6.5A2.5 2.5 0 0 0 4 4.5v15zM4 19.5A2.5 2.5 0 0 0 6.5 22H20v-5',
};
