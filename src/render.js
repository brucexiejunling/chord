module.exports = function (canvas) {
    let ctx = canvas.getContext("2d")
    let particleSystem = null;
    let scaleRate = 1;
    let that = {
        init: function (system) {
            particleSystem = system
            window.addEventListener('resize', that.resize)
            that.resize()
            canvas.addEventListener('mousewheel', (e) => {
                e.preventDefault()
                if (e.wheelDelta > 0) {
                    scaleRate += 0.1;
                } else {
                    scaleRate -= 0.1;
                }
                let w = window.innerWidth * scaleRate,
                    h = window.innerHeight * scaleRate;
                particleSystem.screenSize(w, h) // inform the system so it can map coords for us
                that.redraw()
            })
        },
        redraw: function () {
            if (particleSystem === null) return
            ctx.clearRect(0, 0, canvas.width, canvas.height)
            ctx.strokeStyle = ""
            ctx.lineWidth = 1 * scaleRate;
            ctx.beginPath()
            particleSystem.eachEdge(function (edge, pt1, pt2) {
                ctx.save()
                ctx.beginPath()

                ctx.strokeStyle = edge.data.color || '#ddd'

                ctx.moveTo(pt1.x, pt1.y)
                ctx.quadraticCurveTo((pt1.x + pt2.x) / 2, (pt1.y + pt2.y) / 2 + 20, pt2.x, pt2.y)
                ctx.stroke()
                ctx.restore()

                const label = edge.data.label;
                if (label) {
                    ctx.fillStyle = edge.data.color || '#999';
                    ctx.font = `italic ${12 * scaleRate}px sans-serif`;
                    ctx.textAlign = "center"
                    ctx.fillText(label, (pt1.x + pt2.x) / 2, (pt1.y + pt2.y) / 2)
                }

            })

            particleSystem.eachNode(function (node, pt) {
                let w = ctx.measureText(node.data.label || "").width * 2;
                node.width = w * scaleRate;
                let label = node.data.label
                if (!(label || "").match(/^[ \t]*$/)) {
                    pt.x = Math.floor(pt.x)
                    pt.y = Math.floor(pt.y)
                } else {
                    label = null
                }

                ctx.beginPath();
                ctx.clearRect(pt.x - w / 2, pt.y - 16 * scaleRate / 2, w / 2, 16 * scaleRate)
                ctx.save();
                ctx.translate((1 - scaleRate) * pt.x, (1 - scaleRate) * pt.y)
                ctx.scale(scaleRate, scaleRate)
                ctx.arc(pt.x, pt.y, w / 2, 0, 2 * Math.PI);
                ctx.fillStyle = node.data.color || '#e7b627';
                ctx.fill();
                ctx.restore()


                // draw the text
                if (label) {
                    ctx.font = `bold ${16 * scaleRate}px Arial`
                    ctx.textAlign = "center"
                    ctx.fillStyle = "#fff"
                    ctx.fillText(label || "", pt.x, pt.y + 16 * scaleRate / 2)
                }
            })
        },
        resize: function () {
            var w = window.innerWidth,
                h = window.innerHeight;
            canvas.width = w;
            canvas.height = h // resize the canvas element to fill the screen
            particleSystem.screenSize(w, h) // inform the system so it can map coords for us
            that.redraw()
        }
    }
    return that
}