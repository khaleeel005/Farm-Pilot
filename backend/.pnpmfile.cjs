module.exports = {
  hooks: {
    readPackage(pkg) {
      // Allow build scripts for native modules
      if (pkg.name === 'sqlite3' || pkg.name === 'esbuild') {
        pkg.scripts = pkg.scripts || {};
      }
      return pkg;
    },
  },
};
