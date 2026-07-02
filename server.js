require('dotenv').config();

const express = require('express');
const session = require('express-session');
const SQLiteStoreFactory = require('connect-sqlite3');
const bcrypt = require('bcryptjs');
const Database = require('better-sqlite3');
const multer = require('multer');
const QRCode = require('qrcode');
const path = require('path');
const fs = require('fs');

const app = express();
const SQLiteStore = SQLiteStoreFactory(session);

const PORT = process.env.PORT || 3000;
const dbPath = path.join(__dirname, 'data', 'app.db');
const uploadDir = path.join(__dirname, 'public', 'uploads');

if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const db = new Database(dbPath);

db.exec(`
  CREATE TABLE IF NOT EXISTS settings (
    key TEXT PRIMARY KEY,
    value TEXT
  );

  CREATE TABLE IF NOT EXISTS pages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    subtitle TEXT DEFAULT '',
    label TEXT DEFAULT '',
    body TEXT DEFAULT '',
    media TEXT DEFAULT '',
    qr_label TEXT DEFAULT '',
    qr_url TEXT DEFAULT '',
    enabled INTEGER DEFAULT 1,
    sort_order INTEGER DEFAULT 1,
    duration INTEGER DEFAULT 15,
    page_type TEXT DEFAULT 'standard',
    ssid TEXT DEFAULT '',
    wifi_password TEXT DEFAULT '',
    wifi_security TEXT DEFAULT 'WPA'
  );

  CREATE TABLE IF NOT EXISTS gallery_images (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  page_id INTEGER NOT NULL,
  filename TEXT NOT NULL,
  sort_order INTEGER DEFAULT 1
);

  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    role TEXT DEFAULT 'editor'
  );
`);

try {
  const cols = db.prepare('PRAGMA table_info(users)').all().map(c => c.name);

  if (!cols.includes('role')) {
    db.exec("ALTER TABLE users ADD COLUMN role TEXT DEFAULT 'editor'");
  }
} catch (e) {}

function setting(key, fallback = '') {
  const row = db.prepare('SELECT value FROM settings WHERE key = ?').get(key);
  return row ? row.value : fallback;
}

function setSetting(key, value) {
  db.prepare(`
    INSERT INTO settings (key, value)
    VALUES (?, ?)
    ON CONFLICT(key) DO UPDATE SET value = excluded.value
  `).run(key, value);
}

function seed() {
  const userCount = db.prepare('SELECT COUNT(*) count FROM users').get().count;

  if (!userCount) {
    db.prepare(`
      INSERT INTO users (username, password_hash, role)
      VALUES (?, ?, ?)
    `).run(
      process.env.ADMIN_USER || 'admin',
      bcrypt.hashSync(process.env.ADMIN_PASSWORD || 'changeme', 10),
      'admin'
    );

    db.prepare(`
      INSERT INTO users (username, password_hash, role)
      VALUES (?, ?, ?)
    `).run(
      process.env.EDITOR_USER || 'editor',
      bcrypt.hashSync(process.env.EDITOR_PASSWORD || 'changeme', 10),
      'editor'
    );
  }

  const defaults = {
    site_name: 'Bay WiFi Wall Boards',
    logo: '',
    footer: 'Powered by Bay WiFi Wall Boards',
    ticker: 'Reception open 8am–6pm • Checkout 10am • Scan the WiFi QR code to connect • Please contact reception if you need help',
    background: '#07111f',
    text_colour: '#ffffff',
    accent_colour: '#2fb5df',
    weather_location: 'Tenby'
  };

  for (const [key, value] of Object.entries(defaults)) {
    if (!db.prepare('SELECT key FROM settings WHERE key = ?').get(key)) {
      setSetting(key, value);
    }
  }

  const pageCount = db.prepare('SELECT COUNT(*) count FROM pages').get().count;

  if (!pageCount) {
    const pages = [
      {
        title: 'Welcome & Guest WiFi',
        subtitle: 'Scan the QR code to get connected',
        label: 'Welcome',
        body: 'Welcome to our park.\nPlease enjoy your stay.\nIf you need anything, please contact reception.',
        page_type: 'wifi',
        ssid: 'Guest WiFi',
        wifi_password: 'holiday123',
        wifi_security: 'WPA',
        sort_order: 1,
        qr_label: 'Scan to Connect',
        enabled: 1
      },
      {
        title: 'Hot Tub Instructions',
        subtitle: 'Please read before use',
        label: 'Guest Information',
        body: 'Shower before entering.\nNo glass near the hot tub.\nReplace the cover after use.\nChildren must be supervised.\nPlease do not change the temperature settings.',
        page_type: 'standard',
        sort_order: 2,
        enabled: 1
      },
      {
        title: 'Guest Information',
        subtitle: 'Useful information for your stay',
        label: 'Guest Information',
        body: 'Check in: 3pm\nCheck out: 10am\nReception: 8am–6pm\nLaundry: Open daily\nWaste and recycling: Near reception\nDog walking area: Follow signs around the park',
        page_type: 'standard',
        sort_order: 3,
        qr_label: 'Guest Handbook',
        enabled: 1
      },
      {
        title: 'Park Map',
        subtitle: 'Find your way around',
        label: 'Park Map',
        body: 'Reception\nParking\nPlay area\nLaundry\nBins and recycling\nDog walking area\nEmergency meeting point',
        page_type: 'map',
        qr_label: 'Open Map',
        sort_order: 4,
        enabled: 1
      },
      {
        title: 'Local Attractions',
        subtitle: 'Things to see and do nearby',
        label: 'Explore',
        body: 'Beautiful beaches nearby\nCastles and heritage sites\nCoastal walks and countryside trails\nFamily days out\nLocal towns, cafés and shops',
        page_type: 'standard',
        qr_label: 'Local Guide',
        sort_order: 5,
        enabled: 1
      },
      {
        title: 'Emergency Information',
        subtitle: 'Important contacts and location details',
        label: 'Emergency',
        body: 'Emergency services: 999\nReception: 01234 567890\nPark warden: 07700 123456\nNearest hospital: Add hospital name\nNearest pharmacy: Add pharmacy name\nPark postcode: Add postcode\nWhat3Words: Add location',
        page_type: 'emergency',
        qr_label: 'Open Location',
        sort_order: 6,
        enabled: 1
      },
      {
        title: 'Upcoming Events',
        subtitle: 'What’s happening during your stay',
        label: 'Events',
        body: 'Friday 7pm — Family Quiz Night\nSaturday 6pm — Live Music\nSunday 10am — Kids Treasure Hunt\nAsk reception for this week’s full schedule',
        page_type: 'events',
        qr_label: 'Events Calendar',
        sort_order: 7,
        enabled: 1
      },
      {
        title: 'Park Rules',
        subtitle: 'A few simple rules for everyone’s comfort',
        label: 'Park Rules',
        body: 'Quiet hours are between 10pm and 8am.\nPlease keep the area tidy.\nDogs must be kept on leads.\nDispose of rubbish in the correct bins.\nPlease respect other guests.',
        page_type: 'standard',
        sort_order: 8,
        enabled: 0
      }
    ];

    const insertPage = db.prepare(`
      INSERT INTO pages (
        title,
        subtitle,
        label,
        body,
        page_type,
        ssid,
        wifi_password,
        wifi_security,
        sort_order,
        qr_label,
        enabled,
        duration,
        media,
        qr_url
      )
      VALUES (
        @title,
        @subtitle,
        @label,
        @body,
        @page_type,
        @ssid,
        @wifi_password,
        @wifi_security,
        @sort_order,
        @qr_label,
        @enabled,
        15,
        '',
        ''
      )
    `);

    pages.forEach(page => {
      insertPage.run({
        title: page.title,
        subtitle: page.subtitle || '',
        label: page.label || '',
        body: page.body || '',
        page_type: page.page_type || 'standard',
        ssid: page.ssid || '',
        wifi_password: page.wifi_password || '',
        wifi_security: page.wifi_security || 'WPA',
        sort_order: page.sort_order || 1,
        qr_label: page.qr_label || '',
        enabled: page.enabled === 0 ? 0 : 1
      });
    });
  }
}

seed();

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use('/public', express.static(path.join(__dirname, 'public')));

app.use(session({
  store: new SQLiteStore({
    db: 'sessions.db',
    dir: path.join(__dirname, 'data')
  }),
  secret: process.env.SESSION_SECRET || 'change-me',
  resave: false,
  saveUninitialized: false,
  cookie: {
    maxAge: 1000 * 60 * 60 * 24 * 14
  }
}));

const upload = multer({
  storage: multer.diskStorage({
    destination: (req, file, callback) => {
      callback(null, uploadDir);
    },
    filename: (req, file, callback) => {
      const safeName = file.originalname
        .replace(/[^a-z0-9.\-_]/gi, '-')
        .toLowerCase();

      callback(null, Date.now() + '-' + safeName);
    }
  })
});

function requireLogin(req, res, next) {
  if (req.session.userId) return next();
  res.redirect('/login');
}

function requireAdmin(req, res, next) {
  if (req.session.userId && req.session.role === 'admin') return next();
  res.status(403).send('Admin access required');
}

function currentUser(req) {
  if (!req.session.userId) return null;

  return db.prepare(`
    SELECT id, username, role
    FROM users
    WHERE id = ?
  `).get(req.session.userId);
}

function allSettings() {
  const rows = db.prepare('SELECT key, value FROM settings').all();
  const out = {};

  rows.forEach(row => {
    out[row.key] = row.value;
  });

  return out;
}

function brandLogo(settings) {
  if (settings.logo) {
    return '/public/uploads/' + settings.logo;
  }

  if (fs.existsSync(path.join(__dirname, 'public', 'brand', 'bay-wifi-logo.png'))) {
    return '/public/brand/bay-wifi-logo.png';
  }

  return '/public/brand/bay-wifi-logo.svg';
}

function mediaUrl(file) {
  if (!file) return '';
  if (file.startsWith('/public/')) return file;
  return '/public/uploads/' + file;
}

function isVideo(file) {
  return /\.(mp4|webm|ogg)$/i.test(file || '');
}

async function pageToDisplay(page) {
  let qrData = '';

  if (page.page_type === 'wifi' && page.ssid) {
    qrData = page.wifi_security === 'nopass'
      ? `WIFI:T:nopass;S:${page.ssid};;`
      : `WIFI:T:${page.wifi_security || 'WPA'};S:${page.ssid};P:${page.wifi_password || ''};;`;
  } else if (page.qr_url) {
    qrData = page.qr_url;
  }

  let qrImage = '';

  if (qrData) {
    qrImage = await QRCode.toDataURL(qrData, {
      width: 500,
      margin: 2
    });
  }

  let galleryImages = [];

  if (page.page_type === 'gallery') {
    galleryImages = db.prepare(`
      SELECT *
      FROM gallery_images
      WHERE page_id = ?
      ORDER BY sort_order ASC, id ASC
    `).all(page.id).map(image => ({
      ...image,
      url: mediaUrl(image.filename),
      is_video: isVideo(image.filename)
    }));
  }

  return {
    ...page,
    media_url: mediaUrl(page.media),
    is_video: isVideo(page.media),
    gallery_images: galleryImages,
    body_lines: String(page.body || '').split('\n').filter(Boolean),
    qr_image: qrImage
  };
}


app.get('/', (req, res) => {
  res.redirect('/display');
});

app.get('/login', (req, res) => {
  const settings = allSettings();

  res.render('login', {
    error: '',
    settings,
    brandLogo: brandLogo(settings)
  });
});

app.post('/login', (req, res) => {
  const user = db.prepare('SELECT * FROM users WHERE username = ?').get(req.body.username);

  if (!user || !bcrypt.compareSync(req.body.password, user.password_hash)) {
    const settings = allSettings();

    return res.render('login', {
      error: 'Invalid username or password.',
      settings,
      brandLogo: brandLogo(settings)
    });
  }

  req.session.userId = user.id;
  req.session.role = user.role || 'editor';

  res.redirect('/admin');
});

app.get('/logout', (req, res) => {
  req.session.destroy(() => res.redirect('/login'));
});

app.get('/admin', requireLogin, (req, res) => {
  const settings = allSettings();
  const pages = db.prepare(`
    SELECT *
    FROM pages
    ORDER BY sort_order ASC, id ASC
  `).all();

  const user = currentUser(req);

  const users = req.session.role === 'admin'
    ? db.prepare(`
        SELECT id, username, role
        FROM users
        ORDER BY role ASC, username ASC
      `).all()
    : [];

  res.render('admin', {
    settings,
    pages,
    user,
    users,
    isAdmin: req.session.role === 'admin',
    brandLogo: brandLogo(settings),
    message: req.query.message || ''
  });
});

app.post('/admin/settings', requireAdmin, upload.single('logo_file'), (req, res) => {
  [
    'site_name',
    'footer',
    'ticker',
    'background',
    'text_colour',
    'accent_colour',
    'weather_location'
  ].forEach(key => {
    setSetting(key, req.body[key] || '');
  });

  if (req.file) {
    setSetting('logo', req.file.filename);
  }

  res.redirect('/admin?message=' + encodeURIComponent('Branding saved.'));
});

app.post('/admin/pages/status', requireLogin, (req, res) => {
  db.prepare('SELECT id FROM pages').all().forEach(page => {
    db.prepare(`
      UPDATE pages
      SET enabled = ?, sort_order = ?, duration = ?
      WHERE id = ?
    `).run(
      req.body[`enabled_${page.id}`] ? 1 : 0,
      parseInt(req.body[`sort_${page.id}`] || page.id, 10),
      Math.max(3, parseInt(req.body[`duration_${page.id}`] || 15, 10)),
      page.id
    );
  });

  res.redirect('/admin?message=' + encodeURIComponent('Page settings saved.'));
});

app.post('/admin/pages/create', requireLogin, (req, res) => {
  const maxSort = db.prepare(`
    SELECT COALESCE(MAX(sort_order), 0) AS max_sort
    FROM pages
  `).get();

  const result = db.prepare(`
    INSERT INTO pages (
      title,
      subtitle,
      label,
      body,
      page_type,
      enabled,
      sort_order,
      duration
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    'New Page',
    'Edit this page',
    'Guest Information',
    '',
    'standard',
    0,
    maxSort.max_sort + 1,
    15
  );

  res.redirect('/admin/page/' + result.lastInsertRowid);
});

app.get('/admin/page/:id', requireLogin, (req, res) => {
  const settings = allSettings();
  const page = db.prepare('SELECT * FROM pages WHERE id = ?').get(req.params.id);

  if (!page) {
    return res.status(404).send('Page not found');
  }

  res.render('edit-page', {
    page,
    settings,
    user: currentUser(req),
    isAdmin: req.session.role === 'admin',
    brandLogo: brandLogo(settings)
  });
});

app.post(
  '/admin/page/:id',
  requireLogin,
  upload.fields([
    { name: 'media_file', maxCount: 1 },
    { name: 'gallery_files', maxCount: 20 }
  ]),
  (req, res) => {
    const page = db.prepare('SELECT * FROM pages WHERE id = ?').get(req.params.id);

    if (!page) {
      return res.status(404).send('Page not found');
    }

    const media = req.files?.media_file?.[0]
      ? req.files.media_file[0].filename
      : page.media;

    if (req.files?.gallery_files?.length) {
      const maxSort = db.prepare(`
        SELECT COALESCE(MAX(sort_order), 0) AS max_sort
        FROM gallery_images
        WHERE page_id = ?
      `).get(req.params.id);

      const insertGalleryImage = db.prepare(`
        INSERT INTO gallery_images (page_id, filename, sort_order)
        VALUES (?, ?, ?)
      `);

      req.files.gallery_files.forEach((file, index) => {
        insertGalleryImage.run(
          req.params.id,
          file.filename,
          maxSort.max_sort + index + 1
        );
      });
    }

    db.prepare(`
      UPDATE pages
      SET
        title = ?,
        subtitle = ?,
        label = ?,
        body = ?,
        media = ?,
        qr_label = ?,
        qr_url = ?,
        page_type = ?,
        ssid = ?,
        wifi_password = ?,
        wifi_security = ?,
        enabled = ?,
        sort_order = ?,
        duration = ?
      WHERE id = ?
    `).run(
      req.body.title || '',
      req.body.subtitle || '',
      req.body.label || '',
      req.body.body || '',
      media,
      req.body.qr_label || '',
      req.body.qr_url || '',
      req.body.page_type || 'standard',
      req.body.ssid || '',
      req.body.wifi_password || '',
      req.body.wifi_security || 'WPA',
      req.body.enabled ? 1 : 0,
      parseInt(req.body.sort_order || 1, 10),
      Math.max(3, parseInt(req.body.duration || 15, 10)),
      req.params.id
    );

    res.redirect('/admin/page/' + req.params.id);
  }
);

app.post('/admin/page/:id/remove-media', requireLogin, (req, res) => {
  db.prepare("UPDATE pages SET media = '' WHERE id = ?").run(req.params.id);
  res.redirect('/admin/page/' + req.params.id);
});

app.post('/admin/gallery-image/:id/delete', requireLogin, (req, res) => {
  const image = db.prepare(`
    SELECT *
    FROM gallery_images
    WHERE id = ?
  `).get(req.params.id);

  if (!image) {
    return res.redirect('/admin');
  }

  db.prepare(`
    DELETE FROM gallery_images
    WHERE id = ?
  `).run(req.params.id);

  res.redirect('/admin/page/' + image.page_id);
});

app.post('/admin/change-password', requireLogin, (req, res) => {
  const user = currentUser(req);
  const { current_password, new_password, confirm_password } = req.body;

  if (!new_password || new_password.length < 8) {
    return res.redirect('/admin?message=' + encodeURIComponent('Password must be at least 8 characters.'));
  }

  if (new_password !== confirm_password) {
    return res.redirect('/admin?message=' + encodeURIComponent('New passwords do not match.'));
  }

  const full = db.prepare('SELECT * FROM users WHERE id = ?').get(user.id);

  if (!bcrypt.compareSync(current_password || '', full.password_hash)) {
    return res.redirect('/admin?message=' + encodeURIComponent('Current password is incorrect.'));
  }

  db.prepare('UPDATE users SET password_hash = ? WHERE id = ?').run(
    bcrypt.hashSync(new_password, 10),
    user.id
  );

  res.redirect('/admin?message=' + encodeURIComponent('Password changed successfully.'));
});

app.post('/admin/users/:id/password', requireAdmin, (req, res) => {
  if (!req.body.new_password || req.body.new_password.length < 8) {
    return res.redirect('/admin?message=' + encodeURIComponent('Password must be at least 8 characters.'));
  }

  if (req.body.new_password !== req.body.confirm_password) {
    return res.redirect('/admin?message=' + encodeURIComponent('Passwords do not match.'));
  }

  db.prepare('UPDATE users SET password_hash = ? WHERE id = ?').run(
    bcrypt.hashSync(req.body.new_password, 10),
    req.params.id
  );

  res.redirect('/admin?message=' + encodeURIComponent('User password updated.'));
});

app.post('/admin/users/create-editor', requireAdmin, (req, res) => {
  const username = String(req.body.username || '').trim();
  const password = String(req.body.password || '');

  if (!username || password.length < 8) {
    return res.redirect('/admin?message=' + encodeURIComponent('Enter a username and password of at least 8 characters.'));
  }

  try {
    db.prepare(`
      INSERT INTO users (username, password_hash, role)
      VALUES (?, ?, ?)
    `).run(username, bcrypt.hashSync(password, 10), 'editor');
  } catch (e) {
    return res.redirect('/admin?message=' + encodeURIComponent('Could not create user. Username may already exist.'));
  }

  res.redirect('/admin?message=' + encodeURIComponent('Editor user created.'));
});

app.get('/display', async (req, res) => {
  const settings = allSettings();

  const rawPages = db.prepare(`
    SELECT *
    FROM pages
    WHERE enabled = 1
    ORDER BY sort_order ASC, id ASC
  `).all();

  const pages = [];

  for (const page of rawPages) {
    pages.push(await pageToDisplay(page));
  }

  res.render('display', {
    settings,
    pages,
    brandLogo: brandLogo(settings)
  });
});

app.get('/health', (req, res) => {
  res.json({
    ok: true,
    app: 'Bay WiFi Wall Boards',
    version: '2.2.1',
    uptime: process.uptime()
  });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Bay WiFi Wall Boards running on http://localhost:${PORT}`);
});
