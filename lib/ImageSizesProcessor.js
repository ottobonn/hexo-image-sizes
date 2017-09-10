let sharp = require("sharp");
let debug = require("debug")("hexo:image_sizes");
let path = require("path");
let mkdirp = require("mkdirp");

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
* Given the file info from the `imagesToGenerate` database, create the file.
*/
ImageSizesProcessor.prototype.process = function (file) {
  let fullOutput = path.join(this.hexo.public_dir, file.relativeOutput);

  let width = this.options.width;
  let height = this.options.height;
  let allowEnlargement = this.options.allowEnlargement;

  return mkdir(path.dirname(fullOutput)).then(function () {
    let resizer = sharp(file.fullInput).resize(width, height);
    if (!allowEnlargement) {
      resizer.withoutEnlargement();
    }
    return resizer.toFile(fullOutput);
  }).then(function() {
    debug(`Created ${fullOutput}`);
  });
};

module.exports = ImageSizesProcessor;
