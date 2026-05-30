export function getDisplayName(user) {
  if (user?.name && user.name.trim() !== '') {
    return user.name;
  }

  if (user?.email) {
    const namePart = user.email.split('@')[0];

    const cleanName = namePart
      .replace(/[0-9]/g, '')       // remove numbers
      .replace(/[._-]/g, ' ')      // replace separators with space
      .trim()
      .split(' ')[0];              // take first word only

    if (cleanName) {
      return cleanName.charAt(0).toUpperCase() + cleanName.slice(1).toLowerCase();
    }
  }

  return 'Admin';
}
