let sharp = require("sharp");
let debug = require("debug")("hexo:image_sizes");
let streamToArray = require("stream-to-array");
let Utility = require("./Utility");

var ImageResizer = function (hexo, name, options) {
  this.hexo = hexo;
  this.name = name;
  this.options = options;
  debug(name + " processor constructed");
};

/*
Resize the image from the stream at "originalRouteName" and write it to
"resizedRouteName"
*/
ImageResizer.prototype.resizeRoute = function({originalRouteName, resizedRouteName}) {
  let width = this.options.width;
  let height = this.options.height;
  let allowEnlargement = this.options.allowEnlargement;
  let disableRotation = this.options.disableRotation;

  originalRouteName = Utility.pathSwapSlashes(originalRouteName);
  var inputStream = this.hexo.route.get(originalRouteName);

  if (!inputStream) {
    inputStream = this.hexo.route.get(Utility.pathSwapSlashes(originalRouteName));
    if (!inputStream) {
      inputStream = this.hexo.route.get(Utility.pathShiftPrivateDirectory(Utility.pathSwapSlashes(originalRouteName)));
      if (!inputStream) {
        debug("Failed to find input stream for route", {originalRouteName});
        debug("Routes: ", this.hexo.route.list());
        return;
      }
    }
  }

  resizedRouteName = Utility.pathShiftPrivateDirectory(resizedRouteName);

  return streamToArray(inputStream).then(function (parts) {
    const buffers = [];
    for (let i = 0; i < parts.length; i++) {
      const part = parts[i];
      buffers.push((part instanceof Buffer) ? part : new Buffer(part));
    }
    return Buffer.concat(buffers);
  }).then(buffer => {
    let image = sharp(buffer);
    if (!disableRotation)
    {
      image = image.rotate();
    }
    let noEnlargement = false;
    if (!allowEnlargement) {
      noEnlargement = true;
    }
    image = image.resize(width, height, { withoutEnlargement: noEnlargement });
    const resizedPromise = image.toBuffer();
    return this.hexo.route.set(resizedRouteName, () => resizedPromise);
  });
};

module.exports = ImageResizer;
