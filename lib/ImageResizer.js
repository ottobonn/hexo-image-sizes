let sharp = require("sharp");
let debug = require("debug")("hexo:image_sizes");
let streamToArray = require("stream-to-array");

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
  let autoRotate = this.options.autoRotate;

  const inputStream = this.hexo.route.get(originalRouteName);

  if (!inputStream) {
    debug("Failed to find input stream for route", {originalRouteName});
    return;
  }

  return streamToArray(inputStream).then(function (parts) {
    const buffers = [];
    for (let i = 0; i < parts.length; i++) {
      const part = parts[i];
      buffers.push((part instanceof Buffer) ? part : new Buffer(part));
    }
    return Buffer.concat(buffers);
  }).then(buffer => {
    let image = sharp(buffer);
    if (autoRotate) {
      image = image.rotate();
    }
    image = image.resize(width, height, { withoutEnlargement: !allowEnlargement });
    const resizedPromise = image.toBuffer();
    return this.hexo.route.set(resizedRouteName, () => resizedPromise);
  });
};

module.exports = ImageResizer;
