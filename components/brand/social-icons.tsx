interface SocialIconProps {
  className?: string;
}

export function InstagramIcon({ className }: SocialIconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden>
      <rect x="3" y="3" width="18" height="18" rx="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.2" cy="6.8" r="1.1" fill="currentColor" stroke="none" />
    </svg>
  );
}

export function FacebookIcon({ className }: SocialIconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden>
      <path d="M14.5 8.5h2.2V5.4h-2.6c-2.2 0-3.6 1.4-3.6 3.7v1.6H8.4v3.1h2.1V21h3.3v-7.2h2.3l.4-3.1h-2.7V9.6c0-.7.3-1.1.7-1.1Z" />
    </svg>
  );
}

export function TelegramIcon({ className }: SocialIconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden>
      <path d="M21 4.5 3.6 11.2c-.7.3-.7 1.2 0 1.4l4.3 1.4 1.6 5c.2.6 1 .8 1.4.3l2.4-2.6 4.3 3.2c.5.4 1.3.1 1.4-.6L22.4 5.4c.2-.7-.5-1.2-1.4-.9Z" />
      <path d="m8 14 9.5-6.7-6.7 8" />
    </svg>
  );
}
