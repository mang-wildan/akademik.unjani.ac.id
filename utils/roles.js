// Admin roles (SRS §2.2, K-02). 'admin' is the pre-F2 role; migration
// 001-users-role renames it to 'superadmin', and both are accepted meanwhile.
const SUPERADMIN = 'superadmin';
const EDITOR = 'editor';
const LEGACY_ADMIN = 'admin';

const ROLE_VALUES = [SUPERADMIN, EDITOR, LEGACY_ADMIN];

const roleOf = userOrRole => (typeof userOrRole === 'string' ? userOrRole : userOrRole && userOrRole.role);

// Any account allowed into the admin panel.
const isStaff = userOrRole => ROLE_VALUES.includes(roleOf(userOrRole));

// Accounts, site settings and master data.
const isSuperadmin = userOrRole => [SUPERADMIN, LEGACY_ADMIN].includes(roleOf(userOrRole));

const ROLE_LABELS = { [SUPERADMIN]: 'Super Admin', [LEGACY_ADMIN]: 'Super Admin', [EDITOR]: 'Editor' };
const roleLabel = userOrRole => ROLE_LABELS[roleOf(userOrRole)] || 'Pengguna';

module.exports = { SUPERADMIN, EDITOR, LEGACY_ADMIN, ROLE_VALUES, isStaff, isSuperadmin, roleLabel };
