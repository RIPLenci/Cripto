const crypto = require('crypto');
function hashPassword(plain) {
  let hash = plain;
  for (let i = 1; i <= 9; i++) {
    const algo = i % 2 === 0 ? "sha512" : "sha256";
    hash = crypto.createHash(algo).update(hash + `_AETHER_LAYER_${i}_2026`).digest("hex");
  }
  return hash;
}
console.log(hashPassword("admin123") === "ca53f43be5add7d6eb670aafa011effca479da642daebd19315d392a589a2cf1");
console.log(hashPassword("123456") === "ca53f43be5add7d6eb670aafa011effca479da642daebd19315d392a589a2cf1");
console.log(hashPassword("AetherSecurity2026") === "ca53f43be5add7d6eb670aafa011effca479da642daebd19315d392a589a2cf1");
