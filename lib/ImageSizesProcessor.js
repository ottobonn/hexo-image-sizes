var sharp = require("sharp");
var debug = require("debug")("hexo:image_sizes");
var path = require("path");
var mkdirp = require("mkdirp");

/*
* Wrap mkdirp in a Promise. mkdirp makes a directory if it doesn't already
* exist, and will also make of the directory's ancestors if they don't already
* exist.
*/
function mkdir (path) {
  return new Promise(function (resolve, reject) {
    mkdirp(path, function (err) {
      if (err) {
        reject(err);
      } else {
        resolve(path);
      }
    });
  });
}

var ImageSizesProcessor = function (hexo, name, options) {
  this.hexo = hexo;
  this.name = name;
  this.options = options;
  debug(name + " processor constructed");
};

/*
* Given the hexo File instance `file`, return a Promise representing the
* completion of resizing this image file.
*/
ImageSizesProcessor.prototype.process = function (file) {

  var outPath = path.join(
    this.hexo.public_dir,
    path.dirname(file.path),
    this.name + "-" + path.basename(file.path)
  );

  var width = this.options.width;
  var height = this.options.height;
  var allowEnlargement = this.options.allowEnlargement;

  // file.source is the file's full path on disk
  var verb = file.type;
  debug(verb + " " + outPath);
  if (verb === "create" || verb === "update") {
    return mkdir(path.dirname(outPath)).then(function () {
      var resizer = sharp(file.source).resize(width, height);
      if (!allowEnlargement) {
        resizer.withoutEnlargement();
      }
      return resizer.toFile(outPath);
    });
  } else {
    // File type indicates that no action is required
    return Promise.resolve();
  }

};

module.exports = ImageSizesProcessor;
