import User from '../models/User.js';

export async function getMe(req, res) {
  res.json({ user: req.user });
}

export async function updateNotificationPreferences(req, res) {
  try {
    const { emailEnabled, smsEnabled, phoneNumber, smsMinSeverity } = req.body;
    const update = {};
    if (emailEnabled !== undefined) update['notificationPreferences.emailEnabled'] = emailEnabled;
    if (smsEnabled !== undefined) update['notificationPreferences.smsEnabled'] = smsEnabled;
    if (phoneNumber !== undefined) update['notificationPreferences.phoneNumber'] = phoneNumber;
    if (smsMinSeverity !== undefined) update['notificationPreferences.smsMinSeverity'] = smsMinSeverity;

    const user = await User.findByIdAndUpdate(req.user._id, { $set: update }, { new: true }).select('-passwordHash');
    res.json({ user });
  } catch (err) {
    console.error('Update notification prefs error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
}