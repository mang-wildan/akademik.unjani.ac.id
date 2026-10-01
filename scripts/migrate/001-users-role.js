// Role 'admin' → 'superadmin' (K-02); every existing account stays active.
const User = require('../../models/User');

module.exports = {
  id: '001-users-role',
  title: "Role 'admin' menjadi 'superadmin', akun lama tetap aktif",
  async run({ apply, log, review, backup }) {
    const users = await User.find({}, 'email role isActive').lean();
    const toRename = users.filter(u => u.role === 'admin');
    const toActivate = users.filter(u => u.isActive === undefined);
    toRename.forEach(u => log(`${u.email}: admin → superadmin`));
    users.filter(u => u.role === 'user').forEach(u => review(`${u.email} ber-role 'user' (tidak dipakai lagi): ubah ke editor atau nonaktifkan`));

    if (apply) {
      backup('users', [...toRename, ...toActivate]);
      await User.updateMany({ role: 'admin' }, { $set: { role: 'superadmin' } });
      await User.updateMany({ isActive: { $exists: false } }, { $set: { isActive: true } });
    }
    return `${toRename.length} akun diubah ke superadmin, ${toActivate.length} akun ditandai aktif`;
  },
};
