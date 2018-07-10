//
// kernel.js
//
// run-loop manager for physics and tween updates
//

import {
  trace
} from './utils'
const Physics = require('./physics/physics');
const Tween = require('./tween/tween');

module.exports = function (pSystem) {
  let _physics = null
  let _tween = null
  let _fpsWindow = [] // for keeping track of the actual frame rate
  _fpsWindow.last = new Date()
  let _screenInterval = null
  let _attached = null

  let _tickInterval = null
  let _lastTick = null
  let _paused = false

  let that = {
    system: pSystem,
    tween: null,
    nodes: {},

    init: function () {
      _tween = Tween()
      that.tween = _tween
      let params = pSystem.parameters()

      _physics = Physics(params.dt, params.stiffness, params.repulsion, params.friction, that.system._updateGeometry, params.integrator)
      that.start()
      return that
    },

    //
    // updates from the ParticleSystem
    graphChanged: function (changes) {
      // a node or edge was added or deleted
      _physics._update(changes)
      that.start() // <- is this just to kick things off in the non-worker mode? (yes)
    },

    particleModified: function (id, mods) {
      // a particle's position or mass is changed
      _physics.modifyNode(id, mods)
      that.start() // <- is this just to kick things off in the non-worker mode? (yes)
    },

    physicsModified: function (param) {

      // intercept changes to the framerate in case we're using a worker and
      // managing our own draw timer
      if (!isNaN(param.timeout)) {
        // clear the old interval then let the call to .start set the new one
        clearInterval(_tickInterval)
        _tickInterval = null
      }

      // a change to the physics parameters 
      _physics.modifyPhysics(param)
      that.start() // <- is this just to kick things off in the non-worker mode? (yes)
    },

    _lastPositions: null,

    // 
    // the main render loop when running in web worker mode
    _lastFrametime: new Date().valueOf(),
    _lastBounds: null,
    _currentRenderer: null,
    screenUpdate: function () {
      let now = new Date().valueOf()

      let shouldRedraw = false
      if (that._lastPositions !== null) {
        that.system._updateGeometry(that._lastPositions)
        that._lastPositions = null
        shouldRedraw = true
      }

      if (_tween && _tween.busy()) shouldRedraw = true

      if (that.system._updateBounds(that._lastBounds)) shouldRedraw = true


      if (shouldRedraw) {
        let render = that.system.renderer
        if (render !== undefined) {
          if (render !== _attached) {
            render.init(that.system)
            _attached = render
          }

          if (_tween) _tween.tick()
          render.redraw()

          let prevFrame = _fpsWindow.last
          _fpsWindow.last = new Date()
          _fpsWindow.push(_fpsWindow.last - prevFrame)
          if (_fpsWindow.length > 50) _fpsWindow.shift()
        }
      }
    },

    // 
    // the main render loop when running in non-worker mode
    physicsUpdate: function () {
      if (_tween) _tween.tick()
      _physics.tick()

      let stillActive = that.system._updateBounds()
      if (_tween && _tween.busy()) stillActive = true

      let render = that.system.renderer
      let now = new Date()
      if (render !== undefined) {
        if (render !== _attached) {
          render.init(that.system)
          _attached = render
        }
        render.redraw({
          timestamp: now
        })
      }

      let prevFrame = _fpsWindow.last
      _fpsWindow.last = now
      _fpsWindow.push(_fpsWindow.last - prevFrame)
      if (_fpsWindow.length > 50) _fpsWindow.shift()

      // but stop the simulation when energy of the system goes below a threshold
      let sysEnergy = _physics.systemEnergy()
      if ((sysEnergy.mean + sysEnergy.max) / 2 < 0.05) {
        if (_lastTick === null) _lastTick = new Date().valueOf()
        if (new Date().valueOf() - _lastTick > 1000) {
          // trace('stopping')
          clearInterval(_tickInterval)
          _tickInterval = null
        } else {
          // trace('pausing')
        }
      } else {
        // trace('continuing')
        _lastTick = null
      }
    },


    fps: function (newTargetFPS) {
      if (newTargetFPS !== undefined) {
        let timeout = 1000 / Math.max(1, targetFps)
        that.physicsModified({
          timeout: timeout
        })
      }

      let totInterv = 0
      for (let i = 0, j = _fpsWindow.length; i < j; i++) totInterv += _fpsWindow[i]
      let meanIntev = totInterv / Math.max(1, _fpsWindow.length)
      if (!isNaN(meanIntev)) return Math.round(1000 / meanIntev)
      else return 0
    },

    // 
    // start/stop simulation
    // 
    start: function (unpause) {
      if (_tickInterval !== null) return; // already running
      if (_paused && !unpause) return; // we've been .stopped before, wait for unpause
      _paused = false


      _lastTick = null
      _tickInterval = setInterval(that.physicsUpdate,
        that.system.parameters().timeout)
    },
    stop: function () {
      _paused = true
      if (_tickInterval !== null) {
        clearInterval(_tickInterval)
        _tickInterval = null
      }

    }
  }

  return that.init()
}