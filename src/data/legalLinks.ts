/**
 * The four compliance legal links, defined once and consumed by both the
 * HomePage footer and the PublicLayout footer. Keeping them in one place means
 * the required-for-discoverability set (Terms, Refund, Privacy, Account
 * Deletion) can never drift between the two surfaces.
 */
export interface LegalLink {
  to: string
  label: string
}

export const LEGAL_LINKS: LegalLink[] = [
  { to: '/terms', label: 'Terms & Conditions' },
  { to: '/refund', label: 'Refund Policy' },
  { to: '/privacy', label: 'Privacy Policy' },
  { to: '/delete-account', label: 'Account Deletion' },
]
