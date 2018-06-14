var BYTES_PER_PIXEL = 4; // rgba
var OPAQUE = 0xff;
var TRANSPARENT = 0;

// https://stackoverflow.com/questions/11068240
function parseColor(color) {
  // 6 digit hex rgb
  // ex. #336699
  var hex6 = color.match(/^#([0-9a-fA-F]{2})([0-9a-fA-F]{2})([0-9a-fA-F]{2})$/);
  if (hex6) {
    return [
      parseInt(hex6[1], 16),
      parseInt(hex6[2], 16),
      parseInt(hex6[3], 16),
      OPAQUE
    ];
  }
  // 3 digit hex rgb
  // ex. #369
  var hex3 = color.match(/^#([0-9a-fA-F])([0-9a-fA-F])([0-9a-fA-F])$/);
  if (hex3) {
    return [
      parseInt(hex3[1], 16),
      parseInt(hex3[2], 16),
      parseInt(hex3[3], 16),
      OPAQUE
    ];
  }
  // TODO: rgb, rgba, hsv, named colors et all...
  // fallback
  var hex = parseInt(color);
  if (hex) {
    return [
      (hex >>> 16) & OPAQUE, // r
      (hex >>> 8) & OPAQUE, // g
      hex & OPAQUE, // b
      (hex >>> 24) & OPAQU // a
    ];
  }
  throw new Error('invalid color');
}

function rgba(r, g, b, a) {
  return 'rgba(' + r + ',' + g + ',' + b + ',' + (a / 255) + ')';
}

// https://en.wikipedia.org/wiki/X_PixMap
function parsePixmap(pixmap) {
  var mvalue = pixmap[0].match(/^(\d+)\s+(\d+)\s+(\d+)\s+(\d+)$/);
  if (!mvalue) {
    throw new Error('invalid pixmap');
  }
  var width = parseInt(mvalue[1], 10);
  //assert(width > 0);
  var height = parseInt(mvalue[2], 10);
  //assert(height > 0);
  var ncolors = parseInt(mvalue[3], 10);
  //assert(colors > 0);
  var cpp = parseInt(mvalue[4], 10);
  //assert(cpp > 0);
  var palette = {};
  for (var i = 0; i < ncolors; i += 1) {
    mcolor = pixmap[1 + i].match(/^(\S+)\s+(\S+)\s+(\S+)$/);
    if (!mcolor) {
      throw new Error('invalid pixmap');
    }
    //assert(mcolor[2] == 'c');
    palette[mcolor[1]] = parseColor(mcolor[3]);
  }
  var pixels = new Uint8ClampedArray(width * height * BYTES_PER_PIXEL);
  for (var y = 0, dst = 0; y < height; y += 1) {
    var row = pixmap[1 + ncolors + y];
    for (var x = 0; x < width; x += 1, dst += 4) {
      var pixel = row.substr(x * cpp, cpp);
      var color = palette[pixel];
      if (!color) {
        throw new Error('invalid pixmap');
      }
      pixels.set(color, dst);
    }
  }
  return {
    width: width,
    height: height,
    pixels: pixels
  };
}

function pixmapToImageData(g, pixmap)  {
  var id = g.createImageData(pixmap.width, pixmap.height);
  //assert(pixmap.pixels.length ==  pixmap.width * pixmap.height * 4);
  id.data.set(pixmap.pixels, 0);
  return id;
}

function drawPixmap(pixmap, x0, y0, drawPixelFunc) {
  for(var y = 0, i = 0; y < pixmap.height; y += 1) {
    for(var x = 0; x < pixmap.width; x += 1) {
      drawPixelFunc(x0, y0, x, y, pixmap.pixels[i++], pixmap.pixels[i++], pixmap.pixels[i++], pixmap.pixels[i++]);
    }
  }
}

function canvasRectFn(xsize, ysize, xscan, yscan, ctx) {
  return (x0, y0, x, y, r, g, b, a)=>{
    ctx.fillStyle = rgba(r, g, b, a);
    //ctx.fillRect(x * xsize, y * ysize, xsize - xscan, ysize - yscan);
    ctx.fillRect(x0 + x * xsize, y0 + y * ysize, xsize - xscan,  ysize - yscan);
  };
}

function canvasArcFn(xsize, ysize, xscan, yscan, ctx) {
  var radius = (xsize - xscan) / 2;
  return (x0, y0, x, y, r, g, b, a)=>{
    ctx.beginPath();
    ctx.fillStyle = rgba(r, g, b, a);
    //ctx.arc(x * xsize + radius, y * ysize + radius, radius, 0, 2 * Math.PI, ysize - yscan);
    ctx.arc(x0 + x * xsize + radius, y0 + y * ysize + radius, radius, 0, 2 * Math.PI, ysize - yscan);
    ctx.fill();
  };
}
