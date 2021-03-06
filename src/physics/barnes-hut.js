//
//  barnes-hut.js
//
//  implementation of the barnes-hut quadtree algorithm for n-body repulsion
//  http://www.cs.princeton.edu/courses/archive/fall03/cs126/assignments/barnes-hut.html
//
//  Created by Christian Swinehart on 2011-01-14.
//  Copyright (c) 2011 Samizdat Drafting Co. All rights reserved.
//

import {Point} from './atoms'

let _branches = []
let _branchCtr = 0
let _root = null
let _theta = .5

module.exports = function () {
  let BarnesHutTree = {
    init: function (topleft, bottomright, theta) {
      _theta = theta

      // create a fresh root node for these spatial bounds
      _branchCtr = 0
      _root = this._newBranch()
      _root.origin = topleft
      _root.size = bottomright.subtract(topleft)
    },

    insert: function (newParticle) {
      // add a particle to the tree, starting at the current _root and working down
      let node = _root
      let queue = [newParticle]

      while (queue.length) {
        let particle = queue.shift()
        let p_mass = particle._m || particle.m
        let p_quad = this._whichQuad(particle, node)

        if (node[p_quad] === undefined) {
          // slot is empty, just drop this node in and update the mass/c.o.m.
          node[p_quad] = particle
          node.mass += p_mass
          if (node.p) {
            node.p = node.p.add(particle.p.multiply(p_mass))
          } else {
            node.p = particle.p.multiply(p_mass)
          }

        } else if ('origin' in node[p_quad]) {
          // slot conatins a branch node, keep iterating with the branch
          // as our new root
          node.mass += (p_mass)
          if (node.p) node.p = node.p.add(particle.p.multiply(p_mass))
          else node.p = particle.p.multiply(p_mass)

          node = node[p_quad]
          queue.unshift(particle)
        } else {
          // slot contains a particle, create a new branch and recurse with
          // both points in the queue now
          let branch_size = node.size.divide(2)
          let branch_origin = new Point(node.origin)
          if (p_quad[0] == 's') branch_origin.y += branch_size.y
          if (p_quad[1] == 'e') branch_origin.x += branch_size.x

          // replace the previously particle-occupied quad with a new internal branch node
          let oldParticle = node[p_quad]
          node[p_quad] = this._newBranch()
          node[p_quad].origin = branch_origin
          node[p_quad].size = branch_size
          node.mass = p_mass
          node.p = particle.p.multiply(p_mass)
          node = node[p_quad]

          if (oldParticle.p.x === particle.p.x && oldParticle.p.y === particle.p.y) {
            // prevent infinite bisection in the case where two particles
            // have identical coordinates by jostling one of them slightly
            let x_spread = branch_size.x * .08
            let y_spread = branch_size.y * .08
            oldParticle.p.x = Math.min(branch_origin.x + branch_size.x,
              Math.max(branch_origin.x,
                oldParticle.p.x - x_spread / 2 +
                Math.random() * x_spread))
            oldParticle.p.y = Math.min(branch_origin.y + branch_size.y,
              Math.max(branch_origin.y,
                oldParticle.p.y - y_spread / 2 +
                Math.random() * y_spread))
          }

          // keep iterating but now having to place both the current particle and the
          // one we just replaced with the branch node
          queue.push(oldParticle)
          queue.unshift(particle)
        }

      }

    },

    applyForces: function (particle, repulsion) {
      // find all particles/branch nodes this particle interacts with and apply
      // the specified repulsion to the particle
      let queue = [_root]
      while (queue.length) {
        let node = queue.shift()
        if (node === undefined) continue
        if (particle === node) continue

        if ('f' in node) {
          // this is a particle leafnode, so just apply the force directly
          let d = particle.p.subtract(node.p);
          let distance = Math.max(1.0, d.magnitude());
          let direction = ((d.magnitude() > 0) ? d : Point.random(1)).normalize()
          particle.applyForce(direction.multiply(repulsion * (node._m || node.m))
            .divide(distance * distance));
        } else {
          // it's a branch node so decide if it's cluster-y and distant enough
          // to summarize as a single point. if it's too complex, open it and deal
          // with its quadrants in turn
          let dist = particle.p.subtract(node.p.divide(node.mass)).magnitude()
          let size = Math.sqrt(node.size.x * node.size.y)
          if (size / dist > _theta) { // i.e., s/d > Θ
            // open the quad and recurse
            queue.push(node.ne)
            queue.push(node.nw)
            queue.push(node.se)
            queue.push(node.sw)
          } else {
            // treat the quad as a single body
            let d = particle.p.subtract(node.p.divide(node.mass));
            let distance = Math.max(1.0, d.magnitude());
            let direction = ((d.magnitude() > 0) ? d : Point.random(1)).normalize()
            particle.applyForce(direction.multiply(repulsion * (node.mass))
              .divide(distance * distance));
          }
        }
      }
    },

    _whichQuad: function (particle, node) {
      // sort the particle into one of the quadrants of this node
      if (particle.p.exploded()) return null
      let particle_p = particle.p.subtract(node.origin)
      let halfsize = node.size.divide(2)
      if (particle_p.y < halfsize.y) {
        if (particle_p.x < halfsize.x) return 'nw'
        else return 'ne'
      } else {
        if (particle_p.x < halfsize.x) return 'sw'
        else return 'se'
      }
    },

    _newBranch: function () {
      let branch;
      // to prevent a gc horrorshow, recycle the tree nodes between iterations
      if (_branches[_branchCtr]) {
        branch = _branches[_branchCtr]
        branch.ne = branch.nw = branch.se = branch.sw = undefined
        branch.mass = 0
        delete branch.p
      } else {
        branch = {
          origin: null,
          size: null,
          nw: undefined,
          ne: undefined,
          sw: undefined,
          se: undefined,
          mass: 0
        }
        _branches[_branchCtr] = branch
      }

      _branchCtr++
      return branch
    }
  }

  return BarnesHutTree;
}