# hexo-image-sizes

Generate multiple image resolutions for each source image in Hexo. Uses the
awesome [sharp](https://github.com/lovell/sharp) image library under the hood.

## What is it?

Let's say you have a static blog in Hexo, and you keep your awesome full-size
photos in your `_source` directory with your Markdown files. You want to keep
your original photos, but they're way too big to serve to your users.

You could manually scale each image, perhaps to the content width of your site.
But what if you change your site theme? You need to resize all those images
again.

Taking inspiration from dynamic CMSs like Wordpress, this Hexo plugin
allows you to specify a "profile" for each type of image you want on your site,
and it will take care of generating the resized image files and linking to them.
An image profile is a semantic idea; each profile should correspond to a
use-case for an image.

For example, if you have a gallery on the front page, you
could create an image profile called `front_gallery`. Configure the sizes once
and forget about it. If your theme changes, adjust the sizes and regenerate.
Easy!

## Installation

In your Hexo site's root directory, run

    npm install hexo-image-sizes

## Usage

Using hexo-image-sizes requires two steps: first, you need to set up your
desired image profiles. Then, you need to embed your images in your posts.

### Configure image profiles

First, you need to set up image profiles in your sitewide `_config.yml`. Add
an `image_sizes` section to your config file, like this:

    # Configuration for hexo-image-sizes
    image_sizes:
      pattern: !!js/regexp /\.(gif|jpg|jpeg|png)$/i
      profiles:
        body:
          width: 700 // height will adjust to preserve aspect ratio
        thumbnail:
          width: 100 // Image will be cropped to a square
          height: 100
        huge:
          height: 1000
          allowEnlargement: true
      defaultProfile: body
      link: true
      linkProfile: huge
      useAltForTitle: true

The `image_sizes` config object supports the following fields:

* `pattern`: The regular expression describing which images you would like to
  process. If you don't specify a pattern, this will default to files with
  extension `jpg`, `jpeg`, and `png`. Note that the pattern needs to be a YAML
  js/regexp object, as shown in the example above. Just prefix your JavaScript
  regex with `!!js/regexp` to prevent YAML from trying to parse it.
* `profiles`: This object describes the image sizes you would like to produce.
  Each key is the name of an image profile, which can contain the following
  properties:
  * `width`: The maximum width of images with this profile, in pixels.
  * `height`: The maximum height of images with this profile, in pixels
  * `allowEnlargement`: A boolean, true if images smaller than the profile
    size should be enlarged to the maximum dimensions. By default, this is
    false. Enlargement can cause quality degradation, so use accordingly.

  If you want to preserve the aspect ratio of your images, just specify one of
  `width` and `height`, and the other will adjust automatically. Images are
  resized using bicubic interpolation.
* `defaultProfile`: The name of a profile specified in `profiles` that should be
  the default when an embedded image tag doesn't specify a profile (see below).
  the default when an embedded image tag doesn't specify a profile (see below).
* `link`: True if the image should be wrapped in a link to its source file.
This property can also be specified in the embed tag, in which case the setting
in the embed tag will take precedence.
* `linkProfile`: The profile of the image to which to link. If `linkProfile` is omitted, the link will go to the original image.
This property can also be specified in the embed tag, in which case the setting
in the embed tag will take precedence.
* `useAltForTitle`: Set to true to use image `alt` attributes as their `title`
  as well.

### Embed images

To use hexo-image-sizes, you need to alter the way you embed images in
Markdown. This package provides support for the `imsize` tag, which you
place in your posts' Markdown like this:

    {% imsize %}
    src: uploads/2017/01/05/5510-repair.jpg
    alt: Dell Precision 5510 repair
    title: Cool beans!
    profile: thumbnail
    link: true
    linkProfile: huge
    {% endimsize %}

The body of the `imsize` tag is a [YAML](http://yaml.org/start.html) document.
It supports three keys (others are simply ignored):

* `src`: The source path of the image you want to include. This path **must be
relative to the root of your Hexo source directory** and must not include a
leading slash. For example, in the above tag, the `uploads` directory is in
the top level of the `source` directory.
* `alt`: The alt-text for the image. If you leave this key out, then no "alt"
property will be added to the image tag.
* `profile`: The name of the image profile you'd like to use. This name should
match one you've configured in your sitewide `_config.yml` as described above.
If you leave this key out, or the name is invalid, the image will use the
default profile specified in `_config.yml`. If you don't have a default profile,
the image will be the unaltered original size.
* `link`: True if the image should be wrapped in a link to its source file.
If specified here, overrides the setting in `_config.yml`.
* `linkProfile`: The profile of the image to which to link. If `linkProfile` is omitted, the link will go to the original image.
If specified here, overrides the setting in `_config.yml`.
