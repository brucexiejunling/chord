import {getOffset} from './utils';
const ParticleSystem = require('./physics/system');
const Renderer = require('./render');

let defaultOpts = {
    params: {
        stiffness: 1000,
        repulsion: 50,
        gravity: true,
        friction: 0.5,
        precision: 0.6,
        fps: 55,
        dt: 0.015
    },
    screen: {
        width: '100%',
        height: '100%',
        padding: [200, 300, 200, 200],
        step: 0.2
    },
    edge: {
        color: '',
        activeColor: '',
        weight: 1
    },
    node: {
        color: '',
        activeColor: '',
        weight: 1,
        fontColor: '',
        fontSize: 14
    },
    font: {
        color: '#fff',
        activeColor: '#fff',
        size: ''
    },
    handlers: {
        onClickNode: (btnType, node)=> {},
        onClickEdge: (btnType, edge)=> {},
        onMouseEnterNode: (node)=> {},
        onMouseLeaveNode: (node)=> {},
        onMouseEnterEdge: (edge)=> {},
        onMouseLeaveEdge: (edge)=> {}
    }
}
module.exports = {
    canvas: null,
    system: null,
    options: defaultOpts,
    init: function (el, opts) {
        Object.assign(this.options, opts);
        let data = opts.data;
        if(typeof el === 'string') {
            let selector = el.indexOf('canvas') > -1 ? el : `${el} canvas`
            this.canvas = document.querySelectorAll(selector)[0];
        } else {
            this.canvas = el;
        }
        this.system = ParticleSystem();
        this.system.parameters(this.options.params);
        const {padding, step} = this.options.screen;
        this.system.screen({padding, step});
        this.system.renderer = Renderer(this.canvas);

        this.system.merge(data)

        this.initMouseEvent();
    },
    update: function (data) {
        this.system.graft(data);
    },
    repaint: function (data) {
        this.system.merge(data);
    },
    initMouseEvent: function () {
        let oldmass = 1
        let canDragNode = false,
            canDragCanvas = false,
            moving = false,
            hovering = false;
        let nearest = null,
            dragged = null;

        this.canvas.addEventListener('contextmenu', (e) => {
            e.preventDefault();
        })
        this.canvas.addEventListener('mousedown', (e) => {
            let pos = getOffset(e.target);
            let p = {
                x: e.pageX - pos.left,
                y: e.pageY - pos.top
            }
            nearest = dragged = this.system.nearest(p);

            if (!nearest) {
                return
            }
            if (nearest.node !== null && nearest.distance <= nearest.node.width / 2) {
                canDragNode = true;
                nearest.node.tempMass = 50
                nearest.node.fixed = true
            } else {
                canDragCanvas = true;
            }
            return false
        });

        let lastHovered = null,
            lastPageX = null,
            lastPageY = null;
        this.canvas.addEventListener('mousemove', (e) => {
            // drag the node
            if (canDragNode) {
                moving = true;
                let pos = getOffset(e.target);
                let s = {
                    x: e.pageX - pos.left,
                    y: e.pageY - pos.top
                };
                nearest = this.system.nearest(s);
                if (!nearest) return
                if (dragged !== null && dragged.node !== null) {
                    let p = this.system.fromScreen(s)
                    dragged.node.p = {
                        x: p.x,
                        y: p.y
                    }
                }
            } else if (canDragCanvas) {
                moving = true;
                //drag the canvas
                if (lastPageX !== null) {
                    let deltaX = e.pageX - lastPageX,
                        deltaY = e.pageY - lastPageY;
                    let padding = this.options.screen.padding;
                    padding[0] += deltaY;
                    padding[1] -= deltaX;
                    padding[2] -= deltaY;
                    padding[3] += deltaX;
                    this.system.screenPadding(padding);
                }
                lastPageX = e.pageX;
                lastPageY = e.pageY;
            } else {
                let pos = getOffset(e.target);
                let p = {
                    x: e.pageX - pos.left,
                    y: e.pageY - pos.top
                }
                let hovered = this.system.nearest(p);
                if (!hovered) {
                    return
                }
                if (hovered.node !== null && hovered.distance <= hovered.node.width / 2) {
                    if (!hovering) {
                        this.canvas.style.cursor = 'pointer'
                        let froms = this.system.getEdgesFrom(hovered.node);
                        let tos = this.system.getEdgesTo(hovered.node);
                        hovered.edges = froms.concat(tos)
                        this.handleMouseEnterNode(hovered);
                        lastHovered = hovered;
                        hovering = true;
                    }
                } else {
                    this.canvas.style.cursor = 'default'
                    if (lastHovered) {
                        this.handleMouseLeaveNode(lastHovered)
                        lastHovered = null;
                    }
                    hovering = false;
                }
            }
            return false
        });

        this.canvas.addEventListener('mouseup', (e) => {
            canDragNode = false;
            canDragCanvas = false;
            lastPageX = lastPageY = null;
            if (dragged !== null && dragged.node !== undefined) {
                dragged.node.fixed = false
                dragged.node.tempMass = 100
                dragged = null;
            }

            let pos = getOffset(e.target);
            let p = {
                x: e.pageX - pos.left,
                y: e.pageY - pos.top
            }
            let clicked = this.system.nearest(p);

            if (!clicked) {
                return
            }

            if (clicked.node !== null && clicked.distance <= clicked.node.width / 2) {
                if (!moving) {
                    this.handleClickNode(e, clicked);
                }
            } else if (clicked.distance > clicked.node.width / 2) {
                let min = this.system.nearestEdge(p);
                if (min && min.distance < 20) {
                    this.handleClickEdge(e, min.edge)
                }
            }
            moving = false;
            return false
        });


        window.addEventListener('mouseup', (e) => {
            canDragNode = false;
            canDragCanvas = false;
        })
    },

    handleClickNode: function (e, node) {
        if(e.button === 0) {
            this.options.onClickNode && this.options.onClickNode(node.node.data);
        }
    },
    handleClickEdge: function (e, edge) {
        if(e.button === 2) {
            let offset = getOffset(e.target);
            let pos = {left: e.pageX - offset.left, top: e.pageY - offset.top};
            this.options.onRightClickEdge && this.options.onRightClickEdge(pos, edge);
        }
    },
    handleMouseEnterNode: function (node) {
        node.edges.forEach((edge) => {
            edge.data.color = '#eb2ad2';
            let snode = this.system.getNode(edge.source.name);
            if (snode) {
                snode.data.color = '#eb2ad2'
            }
            let tnode = this.system.getNode(edge.target.name);
            if (tnode) {
                tnode.data.color = '#eb2ad2'
            }
        })
    },
    handleMouseLeaveNode: function (node) {
        node.edges.forEach((edge) => {
            edge.data.color = '#ddd';
            let snode = this.system.getNode(edge.source.name);
            if (snode) {
                snode.data.color = ''
            }
            let tnode = this.system.getNode(edge.target.name);
            if (tnode) {
                tnode.data.color = '#e7b627'
            }
        })
    }
}