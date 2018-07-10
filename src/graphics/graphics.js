//  graphics.js
import {
  nano,
  objcopy,
  objmerge
} from '../utils';
const Primitives = require('./primitives');
const Colors = require('./colors');

let Graphics = function (canvas) {
  let dom = typeof canvas == 'String' ? document.querySelectorAll(canvas)[0] : canvas;
  let ctx = dom.getContext('2d')

  let _bounds = null

  let _colorMode = "rgb" // vs hsb
  let _coordMode = "origin" // vs "center"

  let _drawLibrary = {}
  let _drawStyle = {
    background: null,
    fill: null,
    stroke: null,
    width: 0
  }

  let _fontLibrary = {}
  let _fontStyle = {
    font: "sans-serif",
    size: 12,
    align: "left",
    color: Colors.decode("black"),
    alpha: 1,
    baseline: "ideographic"
  }

  let _lineBuffer = [] // calls to .lines sit here until flushed by .drawlines

  ///MACRO:primitives-start
  let primitives = Primitives(ctx, _drawStyle, _fontStyle)
  let _Oval = primitives._Oval
  let _Rect = primitives._Rect
  let _Color = primitives._Color
  let _Path = primitives._Path
  ///MACRO:primitives-end    

  let that = {
    init: function () {
      if (!ctx) return null
      return that
    },

    // canvas-wide settings
    size: function (width, height) {
      if (!isNaN(width) && !isNaN(height)) {
        dom.setAttribute('width', width);
        dom.setAttribute('height', height);

        // if (_drawStyle.fill!==null) that.fill(_drawStyle.fill)
        // if (_drawStyle.stroke!==null) that.stroke(_drawStyle.stroke)
        // that.textStyle(_fontStyle)

        // trace(_drawStyle,_fontStyle)
      }
      return {
        width: dom.getAttribute('width'),
        height: dom.getAttribute('height')
      }
    },

    clear: function (x, y, w, h) {
      if (arguments.length < 4) {
        x = 0;
        y = 0
        w = dom.getAttribute('width')
        h = dom.getAttribute('height')
      }

      ctx.clearRect(x, y, w, h)
      if (_drawStyle.background !== null) {
        ctx.save()
        ctx.fillStyle = Colors.encode(_drawStyle.background)
        ctx.fillRect(x, y, w, h)
        ctx.restore()
      }
    },

    background: function (a, b, c, d) {
      if (a == null) {
        _drawStyle.background = null
        return null
      }

      let fillColor = Colors.decode(a, b, c, d)
      if (fillColor) {
        _drawStyle.background = fillColor
        that.clear()
      }
    },


    // drawing to screen
    noFill: function () {
      _drawStyle.fill = null
    },
    fill: function (a, b, c, d) {
      if (arguments.length == 0) {
        return _drawStyle.fill
      } else if (arguments.length > 0) {
        let fillColor = Colors.decode(a, b, c, d)
        _drawStyle.fill = fillColor
        ctx.fillStyle = Colors.encode(fillColor)
      }
    },

    noStroke: function () {
      _drawStyle.stroke = null
      ctx.strokeStyle = null
    },
    stroke: function (a, b, c, d) {
      if (arguments.length == 0 && _drawStyle.stroke !== null) {
        return _drawStyle.stroke
      } else if (arguments.length > 0) {
        let strokeColor = Colors.decode(a, b, c, d)
        _drawStyle.stroke = strokeColor
        ctx.strokeStyle = Colors.encode(strokeColor)
      }
    },
    strokeWidth: function (ptsize) {
      if (ptsize === undefined) return ctx.lineWidth
      ctx.lineWidth = _drawStyle.width = ptsize
    },



    Color: function (clr) {
      return new _Color(clr)
    },


    // Font:function(fontName, pointSize){
    //   return new _Font(fontName, pointSize)
    // },
    // font:function(fontName, pointSize){
    //   if (fontName!==undefined) _fontStyle.font = fontName
    //   if (pointSize!==undefined) _fontStyle.size = pointSize
    //   ctx.font = nano("{size}px {font}", _fontStyle)
    // },


    drawStyle: function (style) {
      // without arguments, show the current state
      if (arguments.length == 0) return objcopy(_drawStyle)

      // if this is a ("stylename", {style}) invocation, don't change the current
      // state but add it to the library
      if (arguments.length == 2) {
        let styleName = arguments[0]
        let styleDef = arguments[1]
        if (typeof styleName == 'string' && typeof styleDef == 'object') {
          let newStyle = {}
          if (styleDef.color !== undefined) {
            let textColor = Colors.decode(styleDef.color)
            if (textColor) newStyle.color = textColor
          }
          'background fill stroke width'.split(' ').forEach(function (param) {
            if (styleDef[param] !== undefined) newStyle[param] = styleDef[param]
          })
          if (Object.keys(newStyle).length > 0) _drawLibrary[styleName] = newStyle
        }
        return
      }

      // if a ("stylename") invocation, load up the selected style
      if (arguments.length == 1 && _drawLibrary[arguments[0]] !== undefined) {
        style = _drawLibrary[arguments[0]]
      }

      // for each of the properties specified, update the canvas state
      if (style.width !== undefined) _drawStyle.width = style.width
      ctx.lineWidth = _drawStyle.width

      'background fill stroke'.split(' ').forEach(function (color) {
        if (style[color] !== undefined) {
          if (style[color] === null) _drawStyle[color] = null
          else {
            let useColor = Colors.decode(style[color])
            if (useColor) _drawStyle[color] = useColor
          }
        }
      })
      ctx.fillStyle = _drawStyle.fill
      ctx.strokeStyle = _drawStyle.stroke
    },

    textStyle: function (style) {
      // without arguments, show the current state
      if (arguments.length == 0) return objcopy(_fontStyle)

      // if this is a ("name", {style}) invocation, don't change the current
      // state but add it to the library
      if (arguments.length == 2) {
        let styleName = arguments[0]
        let styleDef = arguments[1]
        if (typeof styleName == 'string' && typeof styleDef == 'object') {
          let newStyle = {}
          if (styleDef.color !== undefined) {
            let textColor = Colors.decode(styleDef.color)
            if (textColor) newStyle.color = textColor
          }
          'font size align baseline alpha'.split(' ').forEach(function (param) {
            if (styleDef[param] !== undefined) newStyle[param] = styleDef[param]
          })
          if (Object.keys(newStyle).length > 0) _fontLibrary[styleName] = newStyle
        }
        return
      }

      if (arguments.length == 1 && _fontLibrary[arguments[0]] !== undefined) {
        style = _fontLibrary[arguments[0]]
      }

      if (style.font !== undefined) _fontStyle.font = style.font
      if (style.size !== undefined) _fontStyle.size = style.size
      ctx.font = nano("{size}px {font}", _fontStyle)

      if (style.align !== undefined) {
        ctx.textAlign = _fontStyle.align = style.align
      }
      if (style.baseline !== undefined) {
        ctx.textBaseline = _fontStyle.baseline = style.baseline
      }

      if (style.alpha !== undefined) _fontStyle.alpha = style.alpha
      if (style.color !== undefined) {
        let textColor = Colors.decode(style.color)
        if (textColor) _fontStyle.color = textColor
      }
      if (_fontStyle.color) {
        let textColor = Colors.blend(_fontStyle.color, _fontStyle.alpha)
        if (textColor) ctx.fillStyle = textColor
      }
      // trace(_fontStyle,opts)
    },

    text: function (textStr, x, y, opts) { // opts: x,y, color, font, align, baseline, width
      if (arguments.length >= 3 && !isNaN(x)) {
        opts = opts || {}
        opts.x = x
        opts.y = y
      } else if (arguments.length == 2 && typeof (x) == 'object') {
        opts = x
      } else {
        opts = opts || {}
      }

      let style = objmerge(_fontStyle, opts)
      ctx.save()
      if (style.align !== undefined) ctx.textAlign = style.align
      if (style.baseline !== undefined) ctx.textBaseline = style.baseline
      if (style.font !== undefined && !isNaN(style.size)) {
        ctx.font = nano("{size}px {font}", style)
      }

      let alpha = (style.alpha !== undefined) ? style.alpha : _fontStyle.alpha
      let color = (style.color !== undefined) ? style.color : _fontStyle.color
      ctx.fillStyle = Colors.blend(color, alpha)

      // if (alpha>0) ctx.fillText(textStr, style.x, style.y);        
      if (alpha > 0) ctx.fillText(textStr, Math.round(style.x), style.y);
      ctx.restore()
    },

    textWidth: function (textStr, style) { // style: x,y, color, font, align, baseline, width
      style = objmerge(_fontStyle, style || {})
      ctx.save()
      ctx.font = nano("{size}px {font}", style)
      let width = ctx.measureText(textStr).width
      ctx.restore()
      return width
    },

    // shape primitives.
    // classes will return an {x,y,w,h, fill(), stroke()} object without drawing
    // functions will draw the shape based on current stroke/fill state
    Rect: function (x, y, w, h, r, style) {
      return new _Rect(x, y, w, h, r, style)
    },
    rect: function (x, y, w, h, r, style) {
      _Rect.prototype._draw(x, y, w, h, r, style)
    },

    Oval: function (x, y, w, h, style) {
      return new _Oval(x, y, w, h, style)
    },
    oval: function (x, y, w, h, style) {
      style = style || {}
      _Oval.prototype._draw(x, y, w, h, style)
    },

    // draw a line immediately
    line: function (x1, y1, x2, y2, style) {
      let p = new _Path(x1, y1, x2, y2)
      p.draw(style)
    },

    // queue up a line segment to be drawn in a batch by .drawLines
    lines: function (x1, y1, x2, y2) {
      if (typeof y2 == 'number') {
        // ƒ( x1, y1, x2, y2)
        _lineBuffer.push([{
          x: x1,
          y: y1
        }, {
          x: x2,
          y: y2
        }])
      } else {
        // ƒ( {x:1, y:1}, {x:2, y:2} )
        _lineBuffer.push([x1, y1])
      }
    },

    // flush the buffered .lines to screen
    drawLines: function (style) {
      let p = new _Path(_lineBuffer)
      p.draw(style)
      _lineBuffer = []
    }


  }
  return that.init()
}

module.exports = Graphics;

// // helpers for figuring out where to draw arrows
// let intersect_line_line = function(p1, p2, p3, p4)
// {
//  let denom = ((p4.y - p3.y)*(p2.x - p1.x) - (p4.x - p3.x)*(p2.y - p1.y));
// 
//  // lines are parallel
//  if (denom === 0) {
//    return false;
//  }
// 
//  let ua = ((p4.x - p3.x)*(p1.y - p3.y) - (p4.y - p3.y)*(p1.x - p3.x)) / denom;
//  let ub = ((p2.x - p1.x)*(p1.y - p3.y) - (p2.y - p1.y)*(p1.x - p3.x)) / denom;
// 
//  if (ua < 0 || ua > 1 || ub < 0 || ub > 1) {
//    return false;
//  }
// 
//  return arbor.Point(p1.x + ua * (p2.x - p1.x), p1.y + ua * (p2.y - p1.y));
// }
// 
// let intersect_line_box = function(p1, p2, p3, w, h)
// {
//  let tl = {x: p3.x, y: p3.y};
//  let tr = {x: p3.x + w, y: p3.y};
//  let bl = {x: p3.x, y: p3.y + h};
//  let br = {x: p3.x + w, y: p3.y + h};
// 
//  let result;
//  if (result = intersect_line_line(p1, p2, tl, tr)) { return result; } // top
//  if (result = intersect_line_line(p1, p2, tr, br)) { return result; } // right
//  if (result = intersect_line_line(p1, p2, br, bl)) { return result; } // bottom
//  if (result = intersect_line_line(p1, p2, bl, tl)) { return result; } // left
// 
//  return false;
// }