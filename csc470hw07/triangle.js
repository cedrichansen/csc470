'use strict';

var gl;

//a character that starts at the center of the screen
var characterVertices = [];
var normals = [];
var uvCoords = [];
var rightVectors = [];

var boxPosVertices = [];

var program;
var boxProgram

var positionBuffer;
var normalBuffer;
var uvBuffer;
var rightBuffer;

var boxPositionBuffer;

var jumpHeights = [];
var currentHeightIndex = 0;

var cameraPosition = vec3(0.0, 0.0, -2.5);
var lookingAt = vec3(0.0, 0.0, 0.0);
var up = vec3(0.0, 1.0, 0.0);
var right = vec3(1.0, 0.0, 0.0);

var modelView = lookAt(cameraPosition, lookingAt, up);

var moveSpeed = 0.01;
var rotationSpeed = 1;

var aspect = 1;
var zNear = 0.5;
var zFar = 1000;
var fieldOfView = 50;
var projectionMatrix = perspective(fieldOfView, aspect, zNear, zFar);

var tex;
var norm;

var jumping = false;

const uvData = [
    1, 0, 0, 0, 0, 1, 1, 0, 1, 1, 0, 1,
    1, 0, 0, 0, 0, 1, 1, 0, 1, 1, 0, 1,
    1, 0, 0, 0, 0, 1, 1, 0, 1, 1, 0, 1,
    1, 0, 0, 0, 0, 1, 1, 0, 1, 1, 0, 1,
    1, 0, 0, 0, 0, 1, 1, 0, 1, 1, 0, 1,
    1, 0, 0, 0, 0, 1, 1, 0, 1, 1, 0, 1,
];


window.onload = function init() {
    var canvas = document.getElementById("gl-canvas");
    gl = WebGLUtils.setupWebGL(canvas);
    if (!gl) {
        alert("WebGL isn't available");
    }

    drawBox();
    drawCharacter();

    //  Configure WebGL    
    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.clearColor(0.0, 0.0, 0.0, 1.0);
    gl.enable(gl.DEPTH_TEST);

    boxProgram = initShaders(gl, "vertex-shader-box", "fragment-shader-box");
    program = initShaders(gl, "vertex-shader", "fragment-shader");

    gl.useProgram(boxProgram);

    gl.uniformMatrix4fv(gl.getUniformLocation(boxProgram, "modelViewMatrix"), false, flatten(modelView));
    gl.uniformMatrix4fv(gl.getUniformLocation(boxProgram, "projectionMatrix"), false, flatten(projectionMatrix));

    boxPositionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, boxPositionBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(flatten(boxPosVertices)), gl.STATIC_DRAW)

    var boxPos = gl.getAttribLocation(boxProgram, "chracterPosition");
    gl.enableVertexAttribArray(boxPos);
    gl.bindBuffer(gl.ARRAY_BUFFER, boxPositionBuffer);
    gl.vertexAttribPointer(boxPos, 3, gl.FLOAT, false, 0, 0);


    gl.useProgram(program);

    positionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(flatten(characterVertices)), gl.STATIC_DRAW);

    normalBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, normalBuffer);
    this.gl.bufferData(gl.ARRAY_BUFFER, new this.Float32Array(flatten(normals)), gl.STATIC_DRAW);

    uvBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, uvBuffer);
    this.gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(flatten(uvCoords)), gl.STATIC_DRAW);

    //right buffer;
    rightBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, rightBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(flatten(rightVectors)), gl.STATIC_DRAW);

    tex = loadTexture("box.jpg");

    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.uniform1i(gl.getUniformLocation(program, "textureID"), 0);

    var vPosition = gl.getAttribLocation(program, "vPosition");
    gl.enableVertexAttribArray(vPosition);
    gl.bindBuffer(gl.ARRAY_BUFFER, this.positionBuffer);
    gl.vertexAttribPointer(vPosition, 3, gl.FLOAT, false, 0, 0);

    var vNormal = gl.getAttribLocation(program, "vNormal");
    gl.enableVertexAttribArray(vNormal);
    gl.bindBuffer(gl.ARRAY_BUFFER, normalBuffer);
    gl.vertexAttribPointer(vNormal, 3, gl.FLOAT, false, 0, 0);

    var uvLocation = gl.getAttribLocation(program, "uv");
    gl.enableVertexAttribArray(uvLocation);
    gl.bindBuffer(gl.ARRAY_BUFFER, uvBuffer);
    gl.vertexAttribPointer(uvLocation, 2, gl.FLOAT, false, 0, 0);

    var rightPos = gl.getAttribLocation(program, "vRight");
    gl.enableVertexAttribArray(rightPos);
    gl.bindBuffer(gl.ARRAY_BUFFER, rightBuffer);
    gl.vertexAttribPointer(rightPos, 3, gl.FLOAT, false, 0, 0);


    gl.uniformMatrix4fv(gl.getUniformLocation(program, "modelViewMatrix"), false, flatten(modelView));
    gl.uniformMatrix4fv(gl.getUniformLocation(program, "projectionMatrix"), false, flatten(projectionMatrix));

    gl.uniform1f(gl.getUniformLocation(program, "jumpHeight"), 0);

    document.addEventListener("keypress", handleKeyboard, false);

    window.addEventListener('keypress', function (e) {
        if (e.keyCode == 32 && e.target == document.body) {
            e.preventDefault();
            jump();
        }
    });

    render();
};

function loadTexture(url) {
    const texture = gl.createTexture();
    const image = new Image();

    image.onload = e => {
        gl.bindTexture(gl.TEXTURE_2D, texture);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
        gl.generateMipmap(gl.TEXTURE_2D);
        render();
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
    } else if (e.key == "u") {
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

function jump() {

    console.log("jumping");

    var tInc = 0.05;
    var currentTime = 0.05;
    var currentHeight = getHeight(currentTime);

    if (!jumping) {
        var i = 0
        while (i < 40) {
            currentTime += tInc;
            currentHeight = getHeight(currentTime);
            jumpHeights.push(currentHeight);
            i++
        }
    
        window.requestAnimationFrame(jumpAnim);
    }
    
}


function jumpAnim() {
    jumping = true;

    var jumpHeight = jumpHeights[currentHeightIndex];
    currentHeightIndex++;

    gl.uniform1f(gl.getUniformLocation(program, "jumpHeight"), jumpHeight);
    render();

    if (currentHeightIndex < jumpHeights.length - 1) {
        window.requestAnimationFrame(jumpAnim);
    } else {
        jumpHeights = [];
        currentHeightIndex = 0;
        jumping = false;
    }
}

function getHeight(t) {
    var vInit = 10;
    var newH = (vInit * t) + (0.5 * -9.8 * Math.pow(t, 2));
    return newH;
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

function turnRight() {
    var dir = vec4(lookingAt[0] - cameraPosition[0], lookingAt[1] - cameraPosition[1], lookingAt[2] - cameraPosition[2], 0);
    var rotateMatrix = rotate(rotationSpeed, up);
    var newAt = mult(rotateMatrix, dir);
    var finalAt = vec3(cameraPosition[0] + newAt[0], cameraPosition[1] + newAt[1], cameraPosition[2] + newAt[2]);
    lookingAt = finalAt;
    right = cross(lookingAt, up);
}

function turnLeft() {
    var dir = vec4(lookingAt[0] - cameraPosition[0], lookingAt[1] - cameraPosition[1], lookingAt[2] - cameraPosition[2], 0);
    var rotateMatrix = rotate(-rotationSpeed, up);
    var newAt = mult(rotateMatrix, dir);
    var finalAt = vec3(cameraPosition[0] + newAt[0], cameraPosition[1] + newAt[1], cameraPosition[2] + newAt[2]);
    lookingAt = finalAt;
    right = cross(lookingAt, up);
}

function lookUp() {
    var rotateMatrix = rotate(-rotationSpeed, right);
    var dir = vec4(lookingAt[0] - cameraPosition[0], lookingAt[1] - cameraPosition[1], lookingAt[2] - cameraPosition[2], 0);
    var newAt = mult(rotateMatrix, dir);
    var finalAt = vec3(cameraPosition[0] + newAt[0], cameraPosition[1] + newAt[1], cameraPosition[2] + newAt[2]);
    lookingAt = finalAt;

    var u = vec4(lookingAt[0] - up[0], lookingAt[1] - up[1], lookingAt[2] - up[2], 0);
    var newUp = mult(rotateMatrix, u);
    var finalUp = vec3(lookingAt[0] - newUp[0], lookingAt[1] - newUp[1], lookingAt[2] - newUp[2]);
    up = finalUp;
}

function lookDown() {
    var rotateMatrix = rotate(rotationSpeed, right);
    var dir = vec4(lookingAt[0] - cameraPosition[0], lookingAt[1] - cameraPosition[1], lookingAt[2] - cameraPosition[2], 0);
    var newAt = mult(rotateMatrix, dir);
    var finalAt = vec3(cameraPosition[0] + newAt[0], cameraPosition[1] + newAt[1], cameraPosition[2] + newAt[2]);
    lookingAt = finalAt;

    var u = vec4(lookingAt[0] - up[0], lookingAt[1] - up[1], lookingAt[2] - up[2], 0);
    var newUp = mult(rotateMatrix, u);
    var finalUp = vec3(lookingAt[0] - newUp[0], lookingAt[1] - newUp[1], lookingAt[2] - newUp[2]);
    up = finalUp;
}

function rollLeft() {
    var lookingAtRelative = add(lookingAt, cameraPosition);
    var rotateMatrix = rotate(rotationSpeed, lookingAtRelative);
    var u = vec4(lookingAt[0] - up[0], lookingAt[1] - up[1], lookingAt[2] - up[2], 0);
    var newUp = mult(rotateMatrix, u);
    var finalUp = vec3(lookingAt[0] - newUp[0], lookingAt[1] - newUp[1], lookingAt[2] - newUp[2]);
    up = finalUp;
    right = cross(lookingAt, up);
}

function rollRight() {
    var lookingAtRelative = scale(-1, add(lookingAt, cameraPosition));
    var rotateMatrix = rotate(rotationSpeed, lookingAtRelative);
    var u = vec4(lookingAt[0] - up[0], lookingAt[1] - up[1], lookingAt[2] - up[2], 0);
    var newUp = mult(rotateMatrix, u);
    var finalUp = vec3(lookingAt[0] - newUp[0], lookingAt[1] - newUp[1], lookingAt[2] - newUp[2]);
    up = finalUp;
    right = cross(lookingAt, up);
}



function drawBox() {
    var xVal = -0.3;
    var width = 0.5;
    var yVal = -0.5;
    var cubeDepth = 0.1;

    var pos = [
        vec3(xVal + width, yVal - width, cubeDepth),
        vec3(xVal + width, yVal, cubeDepth),
        vec3(xVal, yVal, cubeDepth),
        vec3(xVal + width, yVal - width, cubeDepth),
        vec3(xVal, yVal - width, cubeDepth),
        vec3(xVal, yVal, cubeDepth),

        //back side
        vec3(xVal, yVal, -cubeDepth),
        vec3(xVal + width, yVal, -cubeDepth),
        vec3(xVal + width, yVal - width, -cubeDepth),
        vec3(xVal, yVal, -cubeDepth),
        vec3(xVal, yVal - width, -cubeDepth),
        vec3(xVal + width, yVal - width, -cubeDepth),

        //right side
        vec3(xVal, yVal - width, cubeDepth),
        vec3(xVal, yVal, cubeDepth),
        vec3(xVal, yVal, -cubeDepth),
        vec3(xVal, yVal - width, cubeDepth),
        vec3(xVal, yVal - width, - cubeDepth),
        vec3(xVal, yVal, -cubeDepth),

        //left side
        vec3(xVal + width, yVal - width, cubeDepth),
        vec3(xVal + width, yVal, cubeDepth),
        vec3(xVal + width, yVal, -cubeDepth),
        vec3(xVal + width, yVal - width, cubeDepth),
        vec3(xVal + width, yVal - width, - cubeDepth),
        vec3(xVal + width, yVal, -cubeDepth),

        //top
        vec3(xVal, yVal, -cubeDepth),
        vec3(xVal, yVal, cubeDepth),
        vec3(xVal + width, yVal, cubeDepth),
        vec3(xVal, yVal, -cubeDepth),
        vec3(xVal + width, yVal, -cubeDepth),
        vec3(xVal + width, yVal, cubeDepth),

        //bottom
        vec3(xVal, yVal - width, -cubeDepth),
        vec3(xVal, yVal - width, cubeDepth),
        vec3(xVal + width, yVal - width, cubeDepth),
        vec3(xVal, yVal - width, -cubeDepth),
        vec3(xVal + width, yVal - width, -cubeDepth),
        vec3(xVal + width, yVal - width, cubeDepth),
    ];

    Array.prototype.push.apply(boxPosVertices, pos);
}
//xVal and yVal represent the corner of the capet, so just add the width to generate the square
function drawCharacter() {

    var xVal = 0.1;
    var yVal = 0.4;
    var width = 0.5;
    //pass these 2 into a seperate buffer
    var translationValueX = xVal + width / 2;
    var translationValueY = yVal - width / 2;

    var cubeDepth = width / 2;

    var newSquare = [
        //front facing side
        vec3(xVal + width, yVal - width, cubeDepth),
        vec3(xVal + width, yVal, cubeDepth),
        vec3(xVal, yVal, cubeDepth),
        vec3(xVal + width, yVal - width, cubeDepth),
        vec3(xVal, yVal - width, cubeDepth),
        vec3(xVal, yVal, cubeDepth),
        
        //back side
        vec3(xVal, yVal, -cubeDepth),
        vec3(xVal + width, yVal, -cubeDepth),
        vec3(xVal + width, yVal - width, -cubeDepth),
        vec3(xVal, yVal, -cubeDepth),
        vec3(xVal, yVal - width, -cubeDepth),
        vec3(xVal + width, yVal - width, -cubeDepth),
        
        //right side
        vec3(xVal, yVal - width, cubeDepth),
        vec3(xVal, yVal, cubeDepth),
        vec3(xVal, yVal, -cubeDepth), 
        vec3(xVal, yVal - width, cubeDepth),
        vec3(xVal, yVal - width, - cubeDepth),
        vec3(xVal, yVal, -cubeDepth),
            
        //left side
        vec3(xVal + width, yVal - width, cubeDepth),
        vec3(xVal + width, yVal, cubeDepth),
        vec3(xVal + width, yVal, -cubeDepth), 
        vec3(xVal + width, yVal - width, cubeDepth),
        vec3(xVal + width, yVal - width, - cubeDepth),
        vec3(xVal + width, yVal, -cubeDepth),

        //top
        vec3(xVal, yVal, -cubeDepth),
        vec3(xVal, yVal, cubeDepth),
        vec3(xVal + width, yVal, cubeDepth),
        vec3(xVal, yVal, -cubeDepth),
        vec3(xVal + width, yVal, -cubeDepth),
        vec3(xVal + width, yVal, cubeDepth),

        //bottom
        vec3(xVal, yVal - width, -cubeDepth),
        vec3(xVal, yVal - width, cubeDepth),
        vec3(xVal + width, yVal - width, cubeDepth),
        vec3(xVal, yVal - width, -cubeDepth),
        vec3(xVal + width, yVal - width, -cubeDepth),
        vec3(xVal + width, yVal - width, cubeDepth),

    ];

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

        vec3(-1, 0, 0),
        vec3(-1, 0, 0),
        vec3(-1, 0, 0),
        vec3(-1, 0, 0),
        vec3(-1, 0, 0),
        vec3(-1, 0, 0),

        vec3(1,0,0),
        vec3(1,0,0),
        vec3(1,0,0),
        vec3(1,0,0),
        vec3(1,0,0),
        vec3(1,0,0),

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
    ];

    var rightStuff = [
        vec3(1,0,0),
        vec3(1,0,0),
        vec3(1,0,0),
        vec3(1,0,0),
        vec3(1,0,0),
        vec3(1,0,0),

        vec3(1,0,0),
        vec3(1,0,0),
        vec3(1,0,0),
        vec3(1,0,0),
        vec3(1,0,0),
        vec3(1,0,0),

        vec3(0,1,0),
        vec3(0,1,0),
        vec3(0,1,0),
        vec3(0,1,0),
        vec3(0,1,0),
        vec3(0,1,0),

        vec3(0,1,0),
        vec3(0,1,0),
        vec3(0,1,0),
        vec3(0,1,0),
        vec3(0,1,0),
        vec3(0,1,0),

        vec3(0,0, 1),
        vec3(0,0, 1),
        vec3(0,0, 1),
        vec3(0,0, 1),
        vec3(0,0, 1),
        vec3(0,0, 1),

        vec3(0,0, 1),
        vec3(0,0, 1),
        vec3(0,0, 1),
        vec3(0,0, 1),
        vec3(0,0, 1),
        vec3(0,0, 1),
    ];

    Array.prototype.push.apply(characterVertices, newSquare);
    Array.prototype.push.apply(normals, normal);
    Array.prototype.push.apply(uvCoords, uvData); 
    Array.prototype.push.apply(rightVectors, rightStuff);
}

function render() {

    gl.clear(gl.COLOR_BUFFER_BIT);

    // //redraw the box
    gl.useProgram(boxProgram);

    gl.bindBuffer(gl.ARRAY_BUFFER, boxPositionBuffer);
    gl.drawArrays(gl.TRIANGLES, 0, boxPosVertices.length);


    //redraw the guy
    gl.useProgram(program);

    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(flatten(characterVertices)), gl.STATIC_DRAW);

    gl.bindBuffer(gl.ARRAY_BUFFER, normalBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(flatten(normals)), gl.STATIC_DRAW);

    gl.bindBuffer(gl.ARRAY_BUFFER, uvBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(flatten(uvCoords)), gl.STATIC_DRAW);

    gl.bindBuffer(gl.ARRAY_BUFFER, rightBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(flatten(rightVectors)), gl.STATIC_DRAW);

    gl.drawArrays(gl.TRIANGLES, 0, characterVertices.length);






}
