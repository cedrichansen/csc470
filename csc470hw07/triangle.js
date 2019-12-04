'use strict';

var gl;
var backTex;

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

var boxHit = false;

var characterTop = 0;
var characterLeft = 0 ;
var characterRight= 0;
var characterWidth = 0.5;

var boxRight = 0;
var boxLeft = 1000;
var boxBottom = 100;
var boxWidth = 0.3;

var score = 0;

const uvData = [
    1, 0, 0, 0, 0, 1, 1, 0, 1, 1, 0, 1,
    1, 0, 0, 0, 0, 1, 1, 0, 1, 1, 0, 1,
    1, 0, 0, 0, 0, 1, 1, 0, 1, 1, 0, 1,
    1, 0, 0, 0, 0, 1, 1, 0, 1, 1, 0, 1,
    1, 0, 0, 0, 0, 1, 1, 0, 1, 1, 0, 1,
    1, 0, 0, 0, 0, 1, 1, 0, 1, 1, 0, 1,
];

function initBkgnd() {
    backTex = gl.createTexture();
    backTex.Img = new Image();
    backTex.Img.onload = function() {
        handleBkTex(backTex);
    }
    backTex.Img.src = "mario.jpg";
}

function handleBkTex(tex) {
    gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, tex.Img);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    gl.bindTexture(gl.TEXTURE_2D, null);
}

window.onload = function init() {
    var canvas = document.getElementById("gl-canvas");
    gl = WebGLUtils.setupWebGL(canvas);
    if (!gl) {
        alert("WebGL isn't available");
    }

    document.getElementById("score").innerHTML = "Score: " + score;
    drawBox();
    drawCharacter();


    for (let i = 0; i<boxPosVertices.length; i++) {
        if (boxLeft > boxPosVertices[i][0]) {
            boxLeft = boxPosVertices[i][0];
        }
        if (boxBottom > boxPosVertices[i][1]) {
            boxBottom = boxPosVertices[i][1];
        }
    }
    boxRight = boxLeft + boxWidth;

    this.console.log("Box b: " + this.boxBottom + " left: " + this.boxLeft + " right: " + this.boxRight);

    //  Configure WebGL    
    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.clearColor(0.0, 0.0, 0.0, 0.0);
    initBkgnd();
    gl.enable(gl.DEPTH_TEST);

    boxProgram = initShaders(gl, "vertex-shader-box", "fragment-shader-box");
    program = initShaders(gl, "vertex-shader", "fragment-shader");

    gl.useProgram(boxProgram);

    gl.uniformMatrix4fv(gl.getUniformLocation(boxProgram, "modelViewMatrix"), false, flatten(modelView));
    gl.uniformMatrix4fv(gl.getUniformLocation(boxProgram, "projectionMatrix"), false, flatten(projectionMatrix));

    gl.uniform1f(gl.getUniformLocation(boxProgram, "score"), score);

    boxPositionBuffer = gl.createBuffer();
    var boxPos = gl.getAttribLocation(boxProgram, "chracterPosition");
    gl.enableVertexAttribArray(boxPos);
    gl.vertexAttribPointer(boxPos, 3, gl.FLOAT, false, 0, 0);
    gl.bindBuffer(gl.ARRAY_BUFFER, boxPositionBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(flatten(boxPosVertices)), gl.STATIC_DRAW)



    gl.useProgram(program);

    positionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(flatten(characterVertices)), gl.STATIC_DRAW);

    normalBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, normalBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new this.Float32Array(flatten(normals)), gl.STATIC_DRAW);

    uvBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, uvBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(flatten(uvCoords)), gl.STATIC_DRAW);

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
    else if (e.key == "t") {
        moveCharacterUp();
        validkeyPress = true;
    } else if (e.key == "g") {
        moveCharacterDown();
        validkeyPress = true;
    } else if (e.key == "f") {
        moveCharacterLeft();
        validkeyPress = true;
    } else if (e.key == "h") {
        moveCharacterRight();
        validkeyPress = true;
    }

    if (validkeyPress) {

        characterLeft = -100;
        characterTop = -100;
        for (let i =0; i<characterVertices.length; i++) {
            if (characterLeft < characterVertices[i][0]) {
                characterLeft = characterVertices[i][0];
            }
            if (characterTop < characterVertices[i][1]) {
                characterTop = characterVertices[i][1];
            }
        }
        characterRight = characterLeft - characterWidth;



        console.log("top" + characterTop + " L: " + characterLeft + " right" + characterRight);

        modelView = lookAt(cameraPosition, lookingAt, up);
        gl.uniformMatrix4fv(gl.getUniformLocation(program, "modelViewMatrix"), false, flatten(modelView));
        gl.uniformMatrix4fv(gl.getUniformLocation(program, "projectionMatrix"), false, flatten(projectionMatrix));
        render();
    }
}

function moveCharacterUp() {
    for (let i = 0; i < characterVertices.length; i++) {
        characterVertices[i][1] = characterVertices[i][1] + moveSpeed;
      }
}

function moveCharacterDown() {
    for (let i = 0; i < characterVertices.length; i++) {
        characterVertices[i][1] = characterVertices[i][1] - moveSpeed;
      }
}
function moveCharacterLeft() {
    for (let i = 0; i < characterVertices.length; i++) {
        characterVertices[i][0] = characterVertices[i][0] + moveSpeed;
      }
}
function moveCharacterRight() {
    for (let i = 0; i < characterVertices.length; i++) {
        characterVertices[i][0] = characterVertices[i][0] - moveSpeed;
      }
}


function jump() {


    var tInc = 0.05;
    var currentTime = 0.05;
    var currentHeight = getHeight(currentTime);
    var scoredPoint = false;

    if (!jumping) {
        console.log("jumping");
        var i = 0
        while (i < 40) {
            currentTime += tInc;
            currentHeight = getHeight(currentTime);
            jumpHeights.push(currentHeight);
            
            if (boxBottom > characterTop && characterLeft > boxLeft && characterRight < boxRight) {

            } else {
                if (!scoredPoint) {
                    console.log("Hit the box!");
                    score++;
                    scoredPoint = true;
                }
            }
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
    var width = boxWidth;
    var yVal = -0.5;
    var cubeDepth = 0.1;

    var distance = -10;

    var pos = [
        vec3(xVal + width, yVal - width, distance +  cubeDepth),
        vec3(xVal + width, yVal, distance + cubeDepth),
        vec3(xVal, yVal, distance + cubeDepth),
        vec3(xVal + width, yVal - width,distance +  cubeDepth),
        vec3(xVal, yVal - width,distance +  cubeDepth),
        vec3(xVal, yVal,distance +  cubeDepth),

        //back side
        vec3(xVal, yVal, distance - cubeDepth),
        vec3(xVal + width, yVal, distance + 0 -cubeDepth),
        vec3(xVal + width, yVal - width, distance + 0 -cubeDepth),
        vec3(xVal, yVal,distance + 0  -cubeDepth),
        vec3(xVal, yVal - width,distance + 0  -cubeDepth),
        vec3(xVal + width, yVal - width,distance + 0  -cubeDepth),

        //right side
        vec3(xVal, yVal - width, distance + cubeDepth),
        vec3(xVal, yVal, distance + cubeDepth),
        vec3(xVal, yVal, distance + 0 -cubeDepth),
        vec3(xVal, yVal - width, distance + cubeDepth),
        vec3(xVal, yVal - width, distance + 0 - cubeDepth),
        vec3(xVal, yVal, distance + 0 -cubeDepth),

        //left side
        vec3(xVal + width, yVal - width,distance +  cubeDepth),
        vec3(xVal + width, yVal, distance + cubeDepth),
        vec3(xVal + width, yVal, distance + 0 -cubeDepth),
        vec3(xVal + width, yVal - width, distance + cubeDepth),
        vec3(xVal + width, yVal - width, distance + 0 - cubeDepth),
        vec3(xVal + width, yVal, distance + 0 -cubeDepth),

        //top
        vec3(xVal, yVal, distance + 0 -cubeDepth),
        vec3(xVal, yVal, distance + cubeDepth),
        vec3(xVal + width, yVal, distance + cubeDepth),
        vec3(xVal, yVal, distance + 0 -cubeDepth),
        vec3(xVal + width, yVal, distance + 0 -cubeDepth),
        vec3(xVal + width, yVal, distance + 0 +cubeDepth),

        //bottom
        vec3(xVal, yVal - width, distance + 0 -cubeDepth),
        vec3(xVal, yVal - width, distance + cubeDepth),
        vec3(xVal + width, yVal - width, distance + cubeDepth),
        vec3(xVal, yVal - width, distance + 0 -cubeDepth),
        vec3(xVal + width, yVal - width, distance + 0 -cubeDepth),
        vec3(xVal + width, yVal - width, distance + cubeDepth),
    ];

    Array.prototype.push.apply(boxPosVertices, pos);
}

function drawCharacter() {

    var xVal = 0.1;
    var yVal = 0.4;
    var width = characterWidth;

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
    gl.uniform1f(gl.getUniformLocation(boxProgram, "score"), score);
    document.getElementById("score").innerHTML = "Score: " + score;



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
