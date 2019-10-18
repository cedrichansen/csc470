'use strict';

var gl;
var vertices = [];
var translations = [];

var numberOfSteps = 1;
var program;
var numberOfSquares = 0;

var initialWidth = 0.66666;

var rotating = false;

var rotationSpeedX = 0.01;
var rotationValueX = 0.0;

var rotationSpeedY = 0.01;
var rotationValueY = 0.0;

var rotationSpeedZ = 0.01;
var rotationValueZ = 0.0;

var rotationDirection = 1;

var positionBuffer;
var translationBuffer;

var scaleFactor = 0;

var stopId;

window.onload = function init() {
    var canvas = document.getElementById("gl-canvas");
    gl = WebGLUtils.setupWebGL(canvas);
    if (!gl) {
        alert("WebGL isn't available");
    }

    processSteps();

    //  Configure WebGL    
    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.clearColor(0.0, 0.0, 0.0, 1.0);

    //  Load shaders and initialize attribute buffers
    program = initShaders(gl, "vertex-shader", "fragment-shader");
    gl.useProgram(program);

    gl.enable(gl.DEPTH_TEST);
    // Position buffer       
    positionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(flatten(vertices)), gl.STATIC_DRAW);

    // //translation values
    translationBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, translationBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new this.Float32Array(flatten(translations)), gl.STATIC_DRAW);


    var vPosition = gl.getAttribLocation(program, "vPosition");
    gl.enableVertexAttribArray(vPosition);
    gl.bindBuffer(gl.ARRAY_BUFFER, this.positionBuffer);
    gl.vertexAttribPointer(vPosition, 3, gl.FLOAT, false, 0, 0);
    

    var vTranslation = gl.getAttribLocation(program, "vTranslation");
    gl.enableVertexAttribArray(vTranslation);
    gl.bindBuffer(gl.ARRAY_BUFFER, this.translationBuffer);
    gl.vertexAttribPointer(vTranslation, 3, gl.FLOAT, false, 0, 0);
   

    var rotateSlider = document.getElementById("rotateSlider");
    rotateSlider.addEventListener('change', function(event){
        rotateButtonPress(rotateSlider.checked);
    });

    //add event listener for number slider, and display current selection
    let i = document.getElementById("stepsSlider"),
        o = document.querySelector('output');

    o.innerHTML = i.value;
    i.addEventListener('change', function () {
        o.innerHTML = i.value;
        numberOfSteps = i.value;
        updateSteps();
    }, false);

    var elem = document.getElementById('gl-canvas');
    elem.addEventListener('click', function (event) {
        changeRotationDirection();
    }, false);

    var scaleFactorSlider = document.getElementById("scaleSlider");
    scaleFactorSlider.addEventListener('change', function(event) {
        scaleFactor = scaleFactorSlider.value * 0.1;
        gl.uniform1f(gl.getUniformLocation(program, "scaleFactor"), scaleFactor);
        render();
    })


    //following 3 event listeners are for toggle switches. 
    //When pressed, the rotation speed changes accordingly
    var xToggle = this.document.getElementById("rotationX");
    xToggle.addEventListener('change', function(event){
        if (xToggle.checked) {
            rotationSpeedX = 0.01 * rotationDirection;
        } else {
            rotationSpeedX = 0.00;
        }
    }, false)

    var yToggle = this.document.getElementById("rotationY");
    yToggle.addEventListener('change', function(event){
        if (yToggle.checked) {
            rotationSpeedY = 0.01 * rotationDirection;
        } else {
            rotationSpeedY = 0.00;
        }
    }, false)

    var zToggle = this.document.getElementById("rotationZ");
    zToggle.addEventListener('change', function(event){
        if (zToggle.checked) {
            rotationSpeedZ = 0.01;
        } else {
            rotationSpeedZ = 0.00;
        }
    }, false)

    render();
};

//called when canvas is clicked
function changeRotationDirection() {
    rotationDirection = -rotationDirection;
}

//called when rotate button on web page is pressed
function rotateButtonPress(rotateOn) {
    if (!rotateOn) {
        rotating = false;
        cancelAnimationFrame(stopId);
    } else {
        rotating = true;
        window.requestAnimationFrame(rotateAnimation);
    }
}

function rotateAnimation() {

    rotationValueX += rotationSpeedX * rotationDirection;
    rotationValueY += rotationSpeedY * rotationDirection;
    rotationValueZ += rotationSpeedZ * rotationDirection;

    gl.uniform1f(gl.getUniformLocation(program, "vRotationAngleX"), rotationValueX);
    gl.uniform1f(gl.getUniformLocation(program, "vRotationAngleY"), rotationValueY);
    gl.uniform1f(gl.getUniformLocation(program, "vRotationAngleZ"), rotationValueZ);
    gl.uniform1f(gl.getUniformLocation(program, "scaleFactor"), scaleFactor);

    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.drawArrays(gl.LINES, 0, vertices.length);
    stopId = window.requestAnimationFrame(rotateAnimation);
}

function updateSteps() {
    numberOfSquares = 0;
    vertices = [];
    translations = [];
    processSteps();
    render();
}

function processSteps() {
    let squareWidth = initialWidth;
    addSquaresToCanvas(numberOfSteps, -1, 1, squareWidth)
}

function addSquaresToCanvas(steps, topLeftX, topLeftY, width) {

    //draw the current middle
    var squareTopLeftX = topLeftX+width;
    var squareTopLeftY = topLeftY-width;
    addSquare(squareTopLeftX, squareTopLeftY, width);
    
    if (steps > 1) {
        steps--;
        var squareWidth = width/3;
        //add the row above
        addSquaresToCanvas(steps, topLeftX, topLeftY, squareWidth);
        addSquaresToCanvas(steps, topLeftX + width, topLeftY, squareWidth);
        addSquaresToCanvas(steps, topLeftX + (2* width), topLeftY, squareWidth);

        //add left and right
        addSquaresToCanvas(steps, topLeftX, topLeftY-width, squareWidth);
        addSquaresToCanvas(steps, topLeftX + (2*width), topLeftY-width, squareWidth);

        //add row below
        addSquaresToCanvas(steps, topLeftX, topLeftY-(2* width), squareWidth);
        addSquaresToCanvas(steps, topLeftX + width, topLeftY - (2 * width), squareWidth);
        addSquaresToCanvas(steps, topLeftX + (2* width), topLeftY- (2*width), squareWidth);
        
    }

}

//xVal and yVal represent the corner of the capet, so just add the width to generate the square
function addSquare(xVal, yVal, width) {

    //pass these 2 into a seperate buffer
    var translationValueX = xVal + width/2;
    var translationValueY = yVal - width/2;

    var cubeDepth = width/2;

    var newSquare = [
        //front facing side
        vec3(xVal, yVal, cubeDepth),
        vec3(xVal + width, yVal, cubeDepth),
        vec3(xVal + width, yVal, cubeDepth),
        vec3(xVal + width, yVal- width, cubeDepth),
        vec3(xVal + width, yVal- width, cubeDepth),
        vec3(xVal, yVal- width, cubeDepth),
        vec3(xVal, yVal- width, cubeDepth),
        vec3(xVal, yVal, cubeDepth),


        //back facing side
        vec3(xVal, yVal, -cubeDepth),
        vec3(xVal + width, yVal, -cubeDepth),
        vec3(xVal + width, yVal, -cubeDepth),
        vec3(xVal + width, yVal- width, -cubeDepth),
        vec3(xVal + width, yVal- width, -cubeDepth),
        vec3(xVal, yVal- width, -cubeDepth),
        vec3(xVal, yVal- width, -cubeDepth),
        vec3(xVal, yVal, -cubeDepth),


        // //lines connecting front and back
        vec3(xVal, yVal, cubeDepth),
        vec3(xVal, yVal, -cubeDepth),
        vec3(xVal, yVal -width, cubeDepth),
        vec3(xVal, yVal -width, -cubeDepth),
        vec3(xVal + width, yVal, cubeDepth),
        vec3(xVal + width, yVal, -cubeDepth),
        vec3(xVal + width, yVal -width, cubeDepth),
        vec3(xVal + width, yVal -width, -cubeDepth),
    ];

    var translation = [
        vec3(translationValueX, translationValueY, 0),
        vec3(translationValueX, translationValueY, 0),
        vec3(translationValueX, translationValueY, 0),
        vec3(translationValueX, translationValueY, 0),
        vec3(translationValueX, translationValueY, 0),
        vec3(translationValueX, translationValueY, 0),
        vec3(translationValueX, translationValueY, 0),
        vec3(translationValueX, translationValueY, 0),

        vec3(translationValueX, translationValueY, 0),
        vec3(translationValueX, translationValueY, 0),
        vec3(translationValueX, translationValueY, 0),
        vec3(translationValueX, translationValueY, 0),
        vec3(translationValueX, translationValueY, 0),
        vec3(translationValueX, translationValueY, 0),
        vec3(translationValueX, translationValueY, 0),
        vec3(translationValueX, translationValueY, 0),

        vec3(translationValueX, translationValueY, 0),
        vec3(translationValueX, translationValueY, 0),
        vec3(translationValueX, translationValueY, 0),
        vec3(translationValueX, translationValueY, 0),
        vec3(translationValueX, translationValueY, 0),
        vec3(translationValueX, translationValueY, 0),
        vec3(translationValueX, translationValueY, 0),
        vec3(translationValueX, translationValueY, 0),

    ]

    Array.prototype.push.apply(vertices, newSquare);
    Array.prototype.push.apply(translations, translation);

    numberOfSquares++;
}

function render() {
    gl.clear(gl.COLOR_BUFFER_BIT);

    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(flatten(vertices)), gl.STATIC_DRAW);

    gl.bindBuffer(gl.ARRAY_BUFFER, translationBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(flatten(translations)), gl.STATIC_DRAW);

    gl.drawArrays(gl.LINES, 0, vertices.length);
    
}
