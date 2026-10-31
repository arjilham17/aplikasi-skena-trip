const assert = require('assert');
const fs = require('fs');
const path = require('path');

const src = fs.readFileSync(path.join(__dirname, 'index.js'), 'utf8');

// 1. Payment method endpoints must use upload.single('imageFile') to match client FormData
assert(src.includes("app.post('/api/admin/payment-methods', authenticateToken, isSuperAdmin, upload.single('imageFile')"));
assert(src.includes("app.put('/api/admin/payment-methods/:id', authenticateToken, isSuperAdmin, upload.single('imageFile')"));

// 2. No endpoint should leak full user record (password hash / reset token) via include: { user: true }
assert(!/include:\s*\{[^}]*\buser:\s*true\b/.test(src), 'Found unsafe include: { user: true }');

// 3. Multer must enforce 5MB file size limit and image MIME/extension filter
assert(src.includes('limits: { fileSize: 5 * 1024 * 1024 }'));
assert(src.includes("['image/jpeg', 'image/png', 'image/webp'].includes(file.mimetype)"));

// 4. Booking creation must run inside a Serializable transaction
assert(src.includes("isolationLevel: 'Serializable'"));

// 5. Payment & booking status transitions must validate allowed values and positive amount
assert(src.includes("if (!(amountVal > 0))"));
assert(src.includes("if (!['pending', 'confirmed', 'cancelled'].includes(status))"));
assert(src.includes("if (!['paid', 'rejected', 'pending_verification'].includes(status))"));

console.log('All server security & validation checks passed.');
