// ==UserScript==
// @name         Tracers
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  Just tracers that show players and animals
// @author       Devil D. Nudo#7346
// @match        *://*.moomoo.io/*
// @match        *://moomoo.io/*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=moomoo.io
// @grant        none
// @run-at       document-start
// ==/UserScript==

(function() {
    function gameRender(myPlayer, tmpPlayer, xOffset, yOffset, context) {
        const config = {
            enemyColor: "#8c2626",
            allyColor: "#548c26",
            animalColor: "#a18226",
            lineWidth: 5.5
        }

        function tracer(target, other, color) {
            context.save()
            context.strokeStyle = color
            context.lineCap = "round"
            context.lineWidth = config.lineWidth
            context.beginPath()
            context.moveTo(target.x - xOffset, target.y - yOffset)
            context.lineTo(other.x - xOffset, other.y - yOffset)
            context.closePath()
            context.stroke()
            context.restore()
        }

        if (tmpPlayer.sid === myPlayer.sid || !myPlayer.isAlive) return

        if (tmpPlayer.isPlayer) {
            const color = (tmpPlayer.team !== myPlayer.team || !tmpPlayer.team) ? config.enemyColor : config.allyColor

            tracer(myPlayer, tmpPlayer, color)
        } else {
            tracer(myPlayer, tmpPlayer, config.animalColor)
        }
    }
    
    function applyRegex(code) {
        const matchHealth = code.match(/\.health\>\d/)
        const tmpPlayer = code.slice(matchHealth.index - 1, matchHealth.index)
        const targetContent = `${tmpPlayer}.health>0`
        const regex = new RegExp(`${tmpPlayer}\.health\>0`)
        const args = `A, U, d, f, ve`
        const result = code.replace(regex, `;${gameRender.toString()};gameRender(${args});${targetContent}`)

        code = result

        return code
    }

    async function loadScript(script) {
        const response = await fetch(script.src)

        let code = await response.text()

        code = applyRegex(code)

        eval(code)
    }

    const observer = new MutationObserver(function(mutations) {
        for (const mutation of mutations) {
            for (const node of mutation.addedNodes) {
                if (node.tagName === "SCRIPT" && /bundle\.js$/.test(node.src)) {
                    observer.disconnect()

                    loadScript(node)

                    node.remove()
                }
            }
        }
    })

    observer.observe(document, {
        childList: true,
        subtree: true
    })
})()
