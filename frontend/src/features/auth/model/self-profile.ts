export function visibleProfileContacts({
  email,
  phone,
  showEmail,
  showPhone,
}: {
  email?: string | null;
  phone?: string | null;
  showEmail: boolean;
  showPhone: boolean;
}): { email: string | null; phone: string | null } {
  return {
    email: showEmail && email ? email : null,
    phone: showPhone && phone ? phone : null,
  };
}
