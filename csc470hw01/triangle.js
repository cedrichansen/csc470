'use strict';

var gl;
var vertices = [];
var numberOfSteps = 1;
var program;
var numberOfSquares = 0;

var initialWidth = 0.66666;

window.onload = function init() {
    var canvas = document.getElementById("gl-canvas");
    gl = WebGLUtils.setupWebGL(canvas);
    if (!gl) {
        alert("WebGL isn't available");
    }

    processSteps();
    console.log(vertices);

    //  Configure WebGL    
    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.clearColor(1.0, 0.0, 1.0, 1.0);

    //  Load shaders and initialize attribute buffers
    program = initShaders(gl, "vertex-shader", "fragment-shader");
    gl.useProgram(program);

    // Load the data into the GPU        
    var bufferId = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, bufferId);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(flatten(vertices)), gl.STATIC_DRAW);

    // Associate out shader variables with our data buffer
    var vPosition = gl.getAttribLocation(program, "vPosition");
    gl.enableVertexAttribArray(vPosition);
    gl.vertexAttribPointer(vPosition, 2, gl.FLOAT, false, 0, 0);

    //add event listener for number slider, and display current selection
    let i = document.querySelector('input'),
        o = document.querySelector('output');

    o.innerHTML = i.value;
    i.addEventListener('change', function () {
        o.innerHTML = i.value;
        numberOfSteps = i.value;
        updateSteps();
    }, false);

    render();
};

function updateSteps() {
    numberOfSquares = 0;
    vertices = [];
    processSteps();
    render();
}

function processSteps() {
    let squareWidth = initialWidth;
    for (var i = 1; i <= numberOfSteps; i++) {
        addSquaresToCanvas(i, squareWidth);
        squareWidth = squareWidth / 3;
    }

}

function addSquaresToCanvas(step, width) {
    //based off of the step, we know exactly which squares we need to place.
    //step 1 has 1 square, 2 has 9, 3 has 81 (note many of the squares are over other squares), etc;
    var rows = Math.pow(3, (step - 1));
    var columns = Math.pow(3, (step - 1));

    let startingX = -1 + width;
    let startingY = -1 + width;

    let x = startingX;
    let y = startingY;

    let distanceBetweenSquares = 3 * width;

    for (var i = 0; i < rows; i++) {
        x = startingX + (i * distanceBetweenSquares); //figure out where the squares upper left corner x  is
        for (var j = 0; j < columns; j++) {
            y = startingY + (j * distanceBetweenSquares) //figure out where the squares upper left corner y  is 
            addSquare(x, y, width);
        }
    }

}

//xVal and yVal represent the corner of the capet, so just add the width to generate the square
function addSquare(xVal, yVal, width) {

    var newSquare = [
        vec2(xVal, yVal),
        vec2(xVal + width, yVal),
        vec2(xVal, yVal + width),

        vec2(xVal + width, yVal),
        vec2(xVal, yVal + width),
        vec2(xVal + width, yVal + width),
    ];

    Array.prototype.push.apply(vertices, newSquare);

    numberOfSquares++;
}

function render() {
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(flatten(vertices)), gl.STATIC_DRAW);
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.drawArrays(gl.TRIANGLES, 0, vertices.length);
}
