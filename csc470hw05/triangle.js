'use strict';

var gl;
var vertices = [];
var translations = [];
var normals = [];
var uvCoords = [];

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
var normalBuffer;
var uvBuffer;

var scaleFactor = 0;

var stopId;

var cameraPosition = vec3(0.0, 0.0, -2.5);
var lookingAt = vec3(0.0, 0.0, 0.0);
var up = vec3(0.0, 1.0, 0.0);
var right = vec3(1.0, 0.0, 0.0);

var modelView = lookAt(cameraPosition, lookingAt, up);

var moveSpeed = 0.01;
var rotationSpeed = 1;

var aspect = 1;
var zNear = 1;
var zFar = 1000;
var fieldOfView = 50;

var projectionMatrix = perspective(fieldOfView, aspect, zNear, zFar);

var brick;

const uvData = [
    1,1,1,0,0,1,0,1,1,0,0,0,
    1,1,1,0,0,1,0,1,1,0,0,0,
    1,1,1,0,0,1,0,1,1,0,0,0,
    1,1,1,0,0,1,0,1,1,0,0,0,
    1,1,1,0,0,1,0,1,1,0,0,0,
    1,1,1,0,0,1,0,1,1,0,0,0,
]


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

    normalBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, normalBuffer);
    this.gl.bufferData(gl.ARRAY_BUFFER, new this.Float32Array(flatten(this.normals)), gl.STATIC_DRAW);

    uvBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, uvBuffer);
    this.gl.bufferData(gl.ARRAY_BUFFER, new this.Float32Array(flatten(uvCoords)), gl.STATIC_DRAW);

    brick = loadTexture("https://raw.githubusercontent.com/invent-box/Learn-WebGL/master/10-Textures/public/textures/default_brick.png");

    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, this.brick);

    gl.uniform1i(gl.getUniformLocation(program, "textureID"), 0);

    var vPosition = gl.getAttribLocation(program, "vPosition");
    gl.enableVertexAttribArray(vPosition);
    gl.bindBuffer(gl.ARRAY_BUFFER, this.positionBuffer);
    gl.vertexAttribPointer(vPosition, 3, gl.FLOAT, false, 0, 0);


    var vTranslation = gl.getAttribLocation(program, "vTranslation");
    gl.enableVertexAttribArray(vTranslation);
    gl.bindBuffer(gl.ARRAY_BUFFER, this.translationBuffer);
    gl.vertexAttribPointer(vTranslation, 3, gl.FLOAT, false, 0, 0);

    var vNormal = gl.getAttribLocation(program, "vNormal");
    gl.enableVertexAttribArray(vNormal);
    gl.bindBuffer(gl.ARRAY_BUFFER, normalBuffer);
    gl.vertexAttribPointer(vNormal, 3, gl.FLOAT, false, 0,0);

    var uvLocation = gl.getAttribLocation(program, "uv");
    gl.enableVertexAttribArray(uvLocation);
    gl.bindBuffer(gl.ARRAY_BUFFER, uvBuffer);
    gl.vertexAttribPointer(uvLocation, 2, gl.FLOAT, false, 0,0);

    gl.uniformMatrix4fv(gl.getUniformLocation(program, "modelViewMatrix"), false, flatten(modelView));
    gl.uniformMatrix4fv(gl.getUniformLocation(program, "projectionMatrix"), false, flatten(projectionMatrix));


    gl.uniform1f(gl.getUniformLocation(program, "colour"), vec3(1.0, 0.5, 0.5));


    var rotateSlider = document.getElementById("rotateSlider");
    rotateSlider.addEventListener('change', function (event) {
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

    //following 3 event listeners are for toggle switches. 
    //When pressed, the rotation speed changes accordingly
    var xToggle = this.document.getElementById("rotationX");
    xToggle.addEventListener('change', function (event) {
        if (xToggle.checked) {
            rotationSpeedX = 0.01 * rotationDirection;
        } else {
            rotationSpeedX = 0.00;
        }
    }, false)

    var yToggle = this.document.getElementById("rotationY");
    yToggle.addEventListener('change', function (event) {
        if (yToggle.checked) {
            rotationSpeedY = 0.01 * rotationDirection;
        } else {
            rotationSpeedY = 0.00;
        }
    }, false)

    var zToggle = this.document.getElementById("rotationZ");
    zToggle.addEventListener('change', function (event) {
        if (zToggle.checked) {
            rotationSpeedZ = 0.01;
        } else {
            rotationSpeedZ = 0.00;
        }
    }, false)

    document.addEventListener("keypress", handleKeyboard, false);

    render();
};

function loadTexture(url) {
    const texture = gl.createTexture();
    const image = new Image();

   image.onload = e => {
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
    gl.generateMipmap(gl.TEXTURE_2D);

   }; 
    
   image.crossOrigin = "";
   image.src = url;
   return texture;
}


function handleKeyboard(e) {
    var validkeyPress = false;
    if (e.key == "a") {
        strafeLeft();
        validkeyPress = true;
    } else if (e.key == "d") {
        strafeRight();
        validkeyPress = true;
    } else if (e.key == "w") {
        moveUp();
        validkeyPress = true;
    } else if (e.key == "s") {
        moveDown();
        validkeyPress = true;
    } else if (e.key == "q") {
        zoom();
        validkeyPress = true;
    } else if (e.key == "e") {
        further();
        validkeyPress = true;
    } else if (e.key == "z") {
        turnRight();
        validkeyPress = true;
    } else if (e.key == "x") {
        turnLeft();
        validkeyPress = true;
    } else if (e.key == "u"){
        lookUp();
        validkeyPress = true;
    } else if (e.key == "j") {
        lookDown();
        validkeyPress = true;
    } else if (e.key == "y") {
        rollLeft();
        validkeyPress = true;
    } else if (e.key == "i") {
        rollRight();
        validkeyPress = true;
    }
    
    if (validkeyPress) {
        modelView = lookAt(cameraPosition, lookingAt, up);
        projectionMatrix = perspective(fieldOfView, aspect, zNear, zFar);
        gl.uniformMatrix4fv(gl.getUniformLocation(program, "modelViewMatrix"), false, flatten(modelView));
        gl.uniformMatrix4fv(gl.getUniformLocation(program, "projectionMatrix"), false, flatten(projectionMatrix));
        render();
    }
}

function strafeLeft() {
    var change = scale(-moveSpeed, normalize(right));
    var newAt = add(lookingAt, change);
    lookingAt = newAt;
    var newEye = add(cameraPosition, change);
    cameraPosition = newEye;
}

function strafeRight() {
    var change = scale(moveSpeed, normalize(right));
    var newAt = add(lookingAt, change);
    lookingAt = newAt;
    var newEye = add(cameraPosition, change);
    cameraPosition = newEye;
}

function moveDown() {
    var change = scale(moveSpeed, normalize(up));
    var newAt = add(lookingAt, change);
    lookingAt = newAt;
    var newEye = add(cameraPosition, change);
    cameraPosition = newEye;
}

function moveUp() {
    var change = scale(-moveSpeed, normalize(up));
    var newAt = add(lookingAt, change);
    lookingAt = newAt;
    var newEye = add(cameraPosition, change);
    cameraPosition = newEye;
}

function zoom() {
    var change = scale(moveSpeed, vec3(cameraPosition[0] - lookingAt[0], cameraPosition[1] - lookingAt[1], cameraPosition[2] - lookingAt[2]));
    var newAt = add(lookingAt, change);
    lookingAt = newAt;
    var newEye = add(cameraPosition, change);
    cameraPosition = newEye;
}

function further() {
    var change = scale(-moveSpeed, vec3(cameraPosition[0] - lookingAt[0], cameraPosition[1] - lookingAt[1], cameraPosition[2] - lookingAt[2]));
    var newAt = add(lookingAt, change);
    lookingAt = newAt;
    var newEye = add(cameraPosition, change);
    cameraPosition = newEye;
}

function turnRight(){
    var dir = vec4(lookingAt[0]-cameraPosition[0], lookingAt[1]-cameraPosition[1], lookingAt[2]-cameraPosition[2], 0);
    var rotateMatrix = rotate(rotationSpeed, up);
    var newAt = mult(rotateMatrix, dir);
    var finalAt = vec3(cameraPosition[0] + newAt[0], cameraPosition[1] + newAt[1], cameraPosition[2] + newAt[2]);
    lookingAt = finalAt;
    right = cross(lookingAt, up);
}

function turnLeft(){
    var dir = vec4(lookingAt[0]-cameraPosition[0], lookingAt[1]-cameraPosition[1], lookingAt[2]-cameraPosition[2], 0);
    var rotateMatrix = rotate(-rotationSpeed, up);
    var newAt = mult(rotateMatrix, dir);
    var finalAt = vec3(cameraPosition[0] + newAt[0], cameraPosition[1] + newAt[1], cameraPosition[2] + newAt[2]);
    lookingAt = finalAt;
    right = cross(lookingAt, up);
}

function lookUp() {
    var rotateMatrix = rotate(-rotationSpeed, right);
    var dir = vec4(lookingAt[0]-cameraPosition[0], lookingAt[1]-cameraPosition[1], lookingAt[2]-cameraPosition[2], 0);
    var newAt = mult(rotateMatrix, dir);
    var finalAt = vec3(cameraPosition[0] + newAt[0], cameraPosition[1] + newAt[1], cameraPosition[2] + newAt[2]);
    lookingAt = finalAt;

    var u = vec4(lookingAt[0] - up[0], lookingAt[1]- up[1], lookingAt[2] - up[2], 0);
    var newUp = mult(rotateMatrix, u);
    var finalUp = vec3(lookingAt[0] - newUp[0], lookingAt[1]- newUp[1], lookingAt[2] - newUp[2]);
    up = finalUp;
}

function lookDown() {
    var rotateMatrix = rotate(rotationSpeed, right);
    var dir = vec4(lookingAt[0]-cameraPosition[0], lookingAt[1]-cameraPosition[1], lookingAt[2]-cameraPosition[2], 0);
    var newAt = mult(rotateMatrix, dir);
    var finalAt = vec3(cameraPosition[0] + newAt[0], cameraPosition[1] + newAt[1], cameraPosition[2] + newAt[2]);
    lookingAt = finalAt;

    var u = vec4(lookingAt[0] - up[0], lookingAt[1]- up[1], lookingAt[2] - up[2], 0);
    var newUp = mult(rotateMatrix, u);
    var finalUp = vec3(lookingAt[0] - newUp[0], lookingAt[1]- newUp[1], lookingAt[2] - newUp[2]);
    up = finalUp;
}

function rollLeft(){
    var lookingAtRelative = add(lookingAt, cameraPosition);
    var rotateMatrix = rotate(rotationSpeed, lookingAtRelative);
    var u = vec4(lookingAt[0] - up[0], lookingAt[1]- up[1], lookingAt[2] - up[2], 0);
    var newUp = mult(rotateMatrix, u);
    var finalUp = vec3(lookingAt[0] - newUp[0], lookingAt[1]- newUp[1], lookingAt[2] - newUp[2]);
    up = finalUp;
    right = cross(lookingAt, up);
}

function rollRight(){
    var lookingAtRelative = scale(-1, add(lookingAt, cameraPosition));
    var rotateMatrix = rotate(rotationSpeed, lookingAtRelative);
    var u = vec4(lookingAt[0] - up[0], lookingAt[1]- up[1], lookingAt[2] - up[2], 0);
    var newUp = mult(rotateMatrix, u);
    var finalUp = vec3(lookingAt[0] - newUp[0], lookingAt[1]- newUp[1], lookingAt[2] - newUp[2]);
    up = finalUp;
    right = cross(lookingAt, up);
}

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
    gl.drawArrays(gl.TRIANGLES, 0, vertices.length);
    stopId = window.requestAnimationFrame(rotateAnimation);
}

function updateSteps() {
    numberOfSquares = 0;
    vertices = [];
    translations = [];
    normals = [];
    uvCoords = [];
    processSteps();
    render();
}

function processSteps() {
    let squareWidth = initialWidth;
    addSquaresToCanvas(numberOfSteps, -1, 1, squareWidth)
}

function addSquaresToCanvas(steps, topLeftX, topLeftY, width) {

    //draw the current middle
    var squareTopLeftX = topLeftX + width;
    var squareTopLeftY = topLeftY - width;
    addSquare(squareTopLeftX, squareTopLeftY, width);

    if (steps > 1) {
        steps--;
        var squareWidth = width / 3;
        //add the row above
        addSquaresToCanvas(steps, topLeftX, topLeftY, squareWidth);
        addSquaresToCanvas(steps, topLeftX + width, topLeftY, squareWidth);
        addSquaresToCanvas(steps, topLeftX + (2 * width), topLeftY, squareWidth);

        //add left and right
        addSquaresToCanvas(steps, topLeftX, topLeftY - width, squareWidth);
        addSquaresToCanvas(steps, topLeftX + (2 * width), topLeftY - width, squareWidth);

        //add row below
        addSquaresToCanvas(steps, topLeftX, topLeftY - (2 * width), squareWidth);
        addSquaresToCanvas(steps, topLeftX + width, topLeftY - (2 * width), squareWidth);
        addSquaresToCanvas(steps, topLeftX + (2 * width), topLeftY - (2 * width), squareWidth);

    }

}

//xVal and yVal represent the corner of the capet, so just add the width to generate the square
function addSquare(xVal, yVal, width) {

    //pass these 2 into a seperate buffer
    var translationValueX = xVal + width / 2;
    var translationValueY = yVal - width / 2;

    var cubeDepth = width / 2;

    var newSquare = [
        //front facing side
        vec3(xVal, yVal, cubeDepth),
        vec3(xVal + width, yVal, cubeDepth),
        vec3(xVal + width, yVal - width, cubeDepth),
        vec3(xVal, yVal, cubeDepth),
        vec3(xVal, yVal - width, cubeDepth),
        vec3(xVal + width, yVal - width, cubeDepth),

        //back side
        vec3(xVal, yVal, -cubeDepth),
        vec3(xVal + width, yVal, -cubeDepth),
        vec3(xVal + width, yVal - width, -cubeDepth),
        vec3(xVal, yVal, -cubeDepth),
        vec3(xVal, yVal - width, -cubeDepth),
        vec3(xVal + width, yVal - width, -cubeDepth),

        //right side
        vec3(xVal, yVal, -cubeDepth), 
        vec3(xVal, yVal - width, cubeDepth),
        vec3(xVal, yVal, cubeDepth),
        vec3(xVal, yVal - width, cubeDepth),
        vec3(xVal, yVal - width, - cubeDepth),
        vec3(xVal, yVal, -cubeDepth),

        //left side
        vec3(xVal + width, yVal, -cubeDepth), 
        vec3(xVal + width, yVal - width, cubeDepth),
        vec3(xVal + width, yVal, cubeDepth),
        vec3(xVal + width, yVal - width, cubeDepth),
        vec3(xVal + width, yVal - width, - cubeDepth),
        vec3(xVal + width, yVal, -cubeDepth),

        //top
        vec3(xVal, yVal, cubeDepth),
        vec3(xVal, yVal, -cubeDepth),
        vec3(xVal + width, yVal, cubeDepth),
        vec3(xVal, yVal, -cubeDepth),
        vec3(xVal + width, yVal, -cubeDepth),
        vec3(xVal + width, yVal, cubeDepth),

        //bottom
        vec3(xVal, yVal - width, cubeDepth),
        vec3(xVal, yVal - width, -cubeDepth),
        vec3(xVal + width, yVal - width, cubeDepth),
        vec3(xVal, yVal - width, -cubeDepth),
        vec3(xVal + width, yVal - width, -cubeDepth),
        vec3(xVal + width, yVal - width, cubeDepth),

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

    var normal = [

        vec3(0,0, 1),
        vec3(0,0, 1),
        vec3(0,0, 1),
        vec3(0,0, 1),
        vec3(0,0, 1),
        vec3(0,0, 1),

        vec3(0,0, -1),
        vec3(0,0, -1),
        vec3(0,0, -1),
        vec3(0,0, -1),
        vec3(0,0, -1),
        vec3(0,0, -1),


        vec3(1,0,0),
        vec3(1,0,0),
        vec3(1,0,0),
        vec3(1,0,0),
        vec3(1,0,0),
        vec3(1,0,0),

        vec3(-1, 0, 0),
        vec3(-1, 0, 0),
        vec3(-1, 0, 0),
        vec3(-1, 0, 0),
        vec3(-1, 0, 0),
        vec3(-1, 0, 0),

        vec3(0,1,0),
        vec3(0,1,0),
        vec3(0,1,0),
        vec3(0,1,0),
        vec3(0,1,0),
        vec3(0,1,0),

        vec3(0,-1,0),
        vec3(0,-1,0),
        vec3(0,-1,0),
        vec3(0,-1,0),
        vec3(0,-1,0),
        vec3(0,-1,0),
    ]

    Array.prototype.push.apply(vertices, newSquare);
    Array.prototype.push.apply(translations, translation);
    Array.prototype.push.apply(normals, normal);
    Array.prototype.push.apply(uvCoords, uvData); //this is always the same

    numberOfSquares++;
}

function render() {
    gl.clear(gl.COLOR_BUFFER_BIT);

    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(flatten(vertices)), gl.STATIC_DRAW);

    gl.bindBuffer(gl.ARRAY_BUFFER, translationBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(flatten(translations)), gl.STATIC_DRAW);

    gl.bindBuffer(gl.ARRAY_BUFFER, normalBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(flatten(normals)), gl.STATIC_DRAW);

    gl.drawArrays(gl.TRIANGLES, 0, vertices.length);

}
