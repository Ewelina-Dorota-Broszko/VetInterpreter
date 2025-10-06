// backend/scripts/seed-admin.ts
import 'dotenv/config';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import User from '../src/models/user'; // dostosuj ścieżkę jeśli inaczej

function arg(name: string, def?: string) {
  const hit = process.argv.find(a => a.startsWith(`--${name}=`));
  return hit ? hit.split('=').slice(1).join('=') : def;
}

async function main() {
  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error('Brak MONGODB_URI w env');
  await mongoose.connect(uri);
  const email = arg('email') || process.env.ADMIN_EMAIL;
  const password = arg('password') || process.env.ADMIN_PASSWORD;
  const resetPass = arg('reset-pass') === '1';

  if (!email || !password) throw new Error('Podaj --email i --password lub ustaw w env');

  let user = await User.findOne({ email: new RegExp(`^${email.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') });
  if (!user) {
    const passwordHash = await bcrypt.hash(password, 12);
    user = await User.create({
      email,
      passwordHash,
      firstName: 'Admin',
      lastName: 'User',
      phone: '+48111222333',
      role: 'admin',
      isVet: false
    });
    console.log('✅ Utworzono admina:', email);
  } else {
    user.role = 'admin';
    if (resetPass) user.passwordHash = await bcrypt.hash(password, 12);
    await user.save();
    console.log(`✅ Konto istnieje — ustawiono role=admin${resetPass ? ' i zresetowano hasło' : ''}`);
  }

  await mongoose.disconnect();
}

main().catch(e => { console.error(e); process.exit(1); });
