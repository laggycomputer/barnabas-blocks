function blackAndWhite(context) {
    const imageData = context.getImageData(0, 0, 128, 64)
    const data = imageData.data
    const threshhold = document.getElementById("threshold").value
    for (let i = 0; i < data.length; i += 4) {
        let avg = (data[i] + data[i + 1] + data[i + 2]) / 3
        avg > threshhold ? avg = 255 : avg = 0

        data[i] = avg // red
        data[i + 1] = avg // green
        data[i + 2] = avg // blue
    }
    context.putImageData(imageData, 0, 0)
    return data
}

function invert(canvas, context) {
    const imageData = context.getImageData(0, 0, canvas.width, canvas.height)
    const data = imageData.data
    for (let i = 0; i < data.length; i += 4) {
        data[i] = 255 - data[i] // red
        data[i + 1] = 255 - data[i + 1] // green
        data[i + 2] = 255 - data[i + 2] // blue
    }

    context.putImageData(imageData, 0, 0)
}

function toBytes(canvas) {
    const context = canvas?.getContext("2d")

    if (!context) {
        // don't block the page, especially image processing
        return new Promise(resolve => resolve(alert("Please upload an image first!")))
    }

    const imageData = context.getImageData(0, 0, 128, 64)
    const data = imageData.data
    const out = []
    for (let i = 0; i < data.length; i += 4) {
        out.push(data[i] / 255)
    }

    const ret = []
    for (let i = 0; i < out.length; i += 8) {
        ret.push(parseInt(out.slice(i, i + 8).join(""), 2))
    }

    const created = ret.map(b => b.toString(16).padStart(2, "0")).join("")
    document.getElementById("code-output").textContent = created
    navigator.clipboard.writeText(created)
}

document.getElementById("generate").addEventListener("click", () => toBytes(document.getElementById("canvasContainer").childNodes[0]))

function updatePreview() {
    const file = document.getElementById("file-input").files[0]
    const arrayIn = undefined
    // todo: byte array
    if (!file && !arrayIn) {
        return
    }

    const reader = new FileReader()

    reader.onload = (f) => {
        const container = document.getElementById("canvasContainer")
        container.innerHTML = ""
        // if (!f.type.startsWith("image/")) { return }
        const canvas = document.createElement("canvas")
        canvas.width = 128
        canvas.height = 64

        const context = canvas.getContext("2d")

        context.fillStyle = document.getElementById("bgColorWhite").checked ? "white" : "black"
        if (document.getElementById("invert").checked) {
            context.fillStyle = document.getElementById("bgColorWhite").checked ? "black" : "white"
        }
        context.setTransform(1, 0, 0, 1, 0, 0) // start with identity matrix transform (no rotation).

        context.globalCompositeOperation = "source-over"
        context.clearRect(0, 0, canvas.width, canvas.height)
        context.fillRect(0, 0, canvas.width, canvas.height)

        const img = new Image()
        img.src = f.target.result

        let offset_x = 0
        let offset_y = 0

        switch (document.getElementById("scale").value) {
            case "1": // Original

                if (document.getElementById("centerHorizontally").checked) {
                    offset_x = Math.round((canvas.width - img.width) / 2)
                }
                if (document.getElementById("centerVertically").checked) {
                    offset_y = Math.round((canvas.height - img.height) / 2)
                }

                context.drawImage(img, 0, 0, img.width, img.height,
                    offset_x, offset_y, img.width, img.height)
                break
            case "2": {
                // Fit (make as large as possible without changing ratio)
                const horRatio = canvas.width / img.width
                const verRatio = canvas.height / img.height
                const useRatio = Math.min(horRatio, verRatio)

                if (document.getElementById("centerHorizontally").checked) {
                    offset_x = Math.round((canvas.width - img.width * useRatio) / 2)
                }
                if (document.getElementById("centerVertically").checked) {
                    offset_y = Math.round((canvas.height - img.height * useRatio) / 2)
                }

                context.drawImage(img, 0, 0, img.width, img.height,
                    offset_x, offset_y, img.width * useRatio, img.height * useRatio)
                break
            }
            case "3": // Stretch x+y (make as large as possible without keeping ratio)
                context.drawImage(img, 0, 0, img.width, img.height,
                    offset_x, offset_y, canvas.width, canvas.height)
                break
            case "4": // Stretch x (make as wide as possible)
                offset_x = 0

                if (document.getElementById("centerVertically").checked) {
                    Math.round(offset_y = (canvas.height - img.height) / 2)
                }

                context.drawImage(img, 0, 0, img.width, img.height,
                    offset_x, offset_y, canvas.width, img.height)
                break
            case "5": // Stretch y (make as tall as possible)
                if (document.getElementById("centerHorizontally").checked) {
                    offset_x = Math.round((canvas.width - img.width) / 2)
                }

                offset_y = 0
                context.drawImage(img, 0, 0, img.width, img.height,
                    offset_x, offset_y, img.width, canvas.height)
                break
        }

        blackAndWhite(context)

        if (document.getElementById("invert").checked) {
            invert(canvas, context)
        }

        if (document.getElementById("flipHorizontally").checked) {
            context.save()
            context.scale(-1, 1)
            context.drawImage(canvas, -canvas.width, 0)
            context.restore()
        } else if (document.getElementById("flipVertically").checked) {
            context.save()
            context.scale(1, -1)
            context.drawImage(canvas, 0, -canvas.height)
            context.restore()
        }

        container.appendChild(canvas)
    }
    reader.readAsDataURL(file)
}

Array.from(document.getElementsByClassName("updates-image")).forEach((e) => {
    e.addEventListener("change", updatePreview)
    e.addEventListener("click", updatePreview)
})
