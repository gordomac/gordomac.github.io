"use strict";

var canvas;
var gl;

var rand;
var tronTexture;
var redTexture;
var count = 8;
var texture;
var numObst = 4;
var vertDisp = 0;
var NumVertices  =  36 + 3*2*2*48+72+108+72+72; //3*2*24
console.log(NumVertices);
//var count = 4;
var circlePoints1 = [];
var circlePoints2 = [];
var thetaSection = 3.1415*2/48;
var rad = 0.75;
var obstState = [];
var obstTrans = [];
var obstVerts = [];
for(var tk = 0; tk<numObst; tk++){
	obstTrans.push(mat4());
}
for(var k = 0; k < 48; k++){
	var x1 = rad*(Math.cos(thetaSection*k));
	var y1 = rad *(Math.sin(thetaSection*k));
	var z1 = 0;
	//Second Circle is offset by one half the triangle size
	var x2 = rad * (Math.cos(thetaSection*k+thetaSection/2));
	var y2 = rad*(Math.sin(thetaSection*k+thetaSection/2));
	var z2 = 50;
	circlePoints1.push([x1,y1,z1,1.0]);
	circlePoints2.push([x2,y2,z2,1.0]);
}
var racerAngle = 0;
var points = [];
var colors = [];
var texCoordsArray = [];
var texCoord = [
    vec2(0, 0),
    vec2(0, 2.5),
    vec2(0.1, 2.5),
    vec2(0.1, 0),
	vec2(0, 0),
    vec2(0, 1),
    vec2(1, 1),
    vec2(1, 0)
];
var obstaclesTheta =[];
var xAxis = 0;
var yAxis = 1;
var zAxis = 2;

var axis = 0;
var racerTheta = mat4();
var theta = [ 0, 0, 0 ];

//var obstTrans = mat4();// later be array
var obstTheta = mat4();
var cylinderTrans = mult(mat4(), translate(0,0,0));
var thetaLoc;
var program;
var eye = [0.0, 0.0,2.0];
var at = [0.0,0.0,20.0];
var up = [0.0,1.0,0.0];
var camera = lookAt(eye,at,up);
var persp = perspective(45,1,0.001,100);
var scoreNode;


var lightPosition = vec4(0,0,15,1.0); // you can change all of these values
var lightAmbient = vec4(0.2, 0.2, 0.2, 1.0 );
var lightDiffuse = vec4( 1.0, 1.0, 1.0, 1.0 );
var lightSpecular = vec4( 1.0, 1.0, 1.0, 1.0 );
var materialAmbient = vec4( 1.0, 0.0, 1.0, 1.0 );
var materialDiffuse = vec4( 1.0, 0.8, 0.0, 1.0 );
var materialSpecular = vec4( 1.0, 1.0, 1.0, 1.0 );
var materialShininess = 1000.0;
var ambientProduct = mult(lightAmbient, materialAmbient);
var diffuseProduct = mult(lightDiffuse, materialDiffuse);
var specularProduct = mult(lightSpecular, materialSpecular);
var normalsArray = [];

window.onload = function init()
{
    canvas = document.getElementById( "gl-canvas" );

    gl = WebGLUtils.setupWebGL( canvas );
    if ( !gl ) { alert( "WebGL isn't available" ); }
	//gl.enable(gl.DEPTH_TEST);
	racer();
    colorCube(0);
	colorCube(20);
	makeObstacles();
	//obstacle1();//cross
	//rectangularPrism(.25,.75,.1,-.53,0);//Side clench
	//rectangularPrism(.25,.75,.1,.53,0);
	
	
	//rectangularPrism(.75,.6,0.1,0,.25);//Cube hole
	//rectangularPrism(.25,.3,0.1,.5,-.65);
	//rectangularPrism(.25,.3,0.1,-.5,-.65);
	
	//rectangularPrism(0.44,0.44,0.1,0.09,0.09);
    gl.viewport( 0, 0, canvas.width, canvas.height );
    gl.clearColor( 0.0, 0.0, 0.0, 1.0 );

    gl.enable(gl.DEPTH_TEST);

    //
    //  Load shaders and initialize attribute buffers
    //
    program = initShaders( gl, "vertex-shader", "fragment-shader" );
    gl.useProgram( program );

    var cBuffer = gl.createBuffer();
    gl.bindBuffer( gl.ARRAY_BUFFER, cBuffer );
    gl.bufferData( gl.ARRAY_BUFFER, flatten(colors), gl.STATIC_DRAW );

    var vColor = gl.getAttribLocation( program, "vColor" );
    gl.vertexAttribPointer( vColor, 4, gl.FLOAT, false, 0, 0 );
    gl.enableVertexAttribArray( vColor );

    var vBuffer = gl.createBuffer();
    gl.bindBuffer( gl.ARRAY_BUFFER, vBuffer );
    gl.bufferData( gl.ARRAY_BUFFER, flatten(points), gl.STATIC_DRAW );


    var vPosition = gl.getAttribLocation( program, "vPosition" );
    gl.vertexAttribPointer( vPosition, 4, gl.FLOAT, false, 0, 0 );
    gl.enableVertexAttribArray( vPosition );
	
	var tBuffer = gl.createBuffer();
    gl.bindBuffer( gl.ARRAY_BUFFER, tBuffer );
    gl.bufferData( gl.ARRAY_BUFFER, flatten(texCoordsArray), gl.STATIC_DRAW );

    var vTexCoord = gl.getAttribLocation( program, "vTexCoord" );
    gl.vertexAttribPointer( vTexCoord, 2, gl.FLOAT, false, 0, 0 );
    gl.enableVertexAttribArray( vTexCoord );
	
	var tronImage = document.getElementById("texImage");
	tronTexture = gl.createTexture();
	
    configureTexture( tronImage,tronTexture );
	var redImage = document.getElementById("texImage2");
	redTexture = gl.createTexture();
	configureTexture( redImage,redTexture );

    //thetaLoc = gl.getUniformLocation(program, "theta");
	
	// look up the elements we want to affect
	var scoreElement = document.getElementById("score");
	var loseElement = document.getElementById("lose");
 
// Create text nodes to save some time for the browser.
	scoreNode = document.createTextNode("");
	var loseNode = document.createTextNode("");
 
	// Add those text nodes where they need to go
	scoreElement.appendChild(scoreNode);
	loseElement.appendChild(loseNode);
	
	
	
	var nBuffer = gl.createBuffer();
    gl.bindBuffer( gl.ARRAY_BUFFER, nBuffer);
    gl.bufferData( gl.ARRAY_BUFFER, flatten(normalsArray), gl.STATIC_DRAW );

    var vNormal = gl.getAttribLocation( program, "vNormal" );
    gl.vertexAttribPointer( vNormal, 4, gl.FLOAT, false, 0, 0 );
    gl.enableVertexAttribArray( vNormal);

    gl.uniform4fv( gl.getUniformLocation(program, "ambientProduct"),flatten(ambientProduct) ); // will all have to move to render, and for each light, object
    gl.uniform4fv( gl.getUniformLocation(program, "diffuseProduct"),flatten(diffuseProduct) );
    gl.uniform4fv( gl.getUniformLocation(program, "specularProduct"),flatten(specularProduct) );
    gl.uniform4fv( gl.getUniformLocation(program, "lightPosition"),flatten(lightPosition) );
    gl.uniform1f( gl.getUniformLocation(program, "shininess"),materialShininess );
	
	
    //event listeners for buttons
	

	document.addEventListener("keydown", function(event) {
		var x = event.keyCode;
		//var cenFacesCoord = [];
		//if(rotCounter ==0 && dontRotate ==0){
			if (x == 37) {
				racerTheta = mult(racerTheta, rotate(2,[0,0,1]));
				racerAngle -= 2;
				//console.log(racerTheta);
				//racerTheta = mult(racerTheta, translate(0,0,1));
				//render();
				//requestAnimFrame(render);
			}
			if (x == 39) {
				racerTheta = mult(racerTheta, rotate(-2,[0,0,1]))
				racerAngle += 2;
				//render();
				//requestAnimFrame(render);
			}
			if(racerAngle>=360){
				racerAngle = racerAngle - 360;
			}
			else if(racerAngle < 0){
				racerAngle = racerAngle + 360;
			}
			//console.log(racerTheta);
			//console.log(racerAngle);
		//}
	});

    render();
}
function randObstacle(){
	var choice = -1;
	do{
		choice = Math.floor((Math.random() * (numObst)));
	}while(obstState[choice] == 1 || obstState[choice]==2);
	obstState[choice] = 1;
}
function makeObstacles(){
	rand =  Math.floor(Math.random() * (6))+1;
	rectangularPrism(.3,.75,.1,-.53,0);//Side Clench
	rectangularPrism(.3,.75,.1,.53,0);
	obstaclesTheta.push([174,186,354,6]);
	obstState.push(0);
	obstVerts.push(72);
	
	rand =  Math.floor(Math.random() * (6))+1;	
	rectangularPrism(.75,.6,0.1,0,.25);//Cube hole
	rectangularPrism(.25,.3,0.1,.5,-.65);
	rectangularPrism(.25,.3,0.1,-.5,-.65);
	obstaclesTheta.push([352,8]);
	obstState.push(0);
	obstVerts.push(108);
	
	rand =  Math.floor(Math.random() * (6))+1;
	rectangularPrism(1,.15,0.1,0,0);//Cross
	rectangularPrism(.15,1,0.1,0,0);
	obstaclesTheta.push([36,54,126,144,216,234,306,324]);
	obstState.push(0);
	obstVerts.push(72);
	
	rand =  Math.floor(Math.random() * (6))+1;
	rectangularPrism(1,.05,0.1,0,0);//Crushers //.38 and .2
	rectangularPrism(1,.05,0.1,0,0);
	obstaclesTheta.push([90.1,90.1,122.1,238.1,270.1,270.1,302.1,58.1]);
	obstState.push(0);
	obstVerts.push(72);
}
function rotateObstaclesTheta(obNum,x){
	var vector = [];
	if(obNum != 3){
		for(var w = 0; w<obstaclesTheta[obNum].length; w++){
			vector.push(x);
		}
		obstaclesTheta[obNum] = add(obstaclesTheta[obNum],vector);
		for(var u = 0; u<obstaclesTheta[obNum].length; u++){
			if(obstaclesTheta[obNum][u]>360){
				obstaclesTheta[obNum][u] = obstaclesTheta[obNum][u]-360;
			}
		}
	}
	else{
		vertDisp = vertDisp + x;
		var hegt = vertDisp + 0.13;
		var hegt2 = vertDisp;
		//var angle2 = 180*Math.acos(0.6*hegt2*1.06)/Math.PI;
		//var y1 = 
		var d1 = hegt*2;
		var obAngle = 180*Math.atan(Math.sqrt(d1*d1-hegt*hegt)/hegt)/Math.PI;
		var angle2;
		if(obAngle<75){
			angle2 = (90-obAngle-15);
		}
		else {
			angle2 = (90-obAngle);
		}
		//for(var b = 0; b<obstaclesTheta[obNum].length; b++){
		//}
		obstaclesTheta[obNum][2] = 90.1 + obAngle;
		obstaclesTheta[obNum][3] = 270.1 - obAngle;
		obstaclesTheta[obNum][6] = 270.1 + obAngle;
		obstaclesTheta[obNum][7] = 90.1 - obAngle;
		
		obstaclesTheta[obNum][0] = 90.1 - angle2;
		obstaclesTheta[obNum][1] = 90.1 + angle2;
		obstaclesTheta[obNum][2] = 270.1 - angle2;
		obstaclesTheta[obNum][3] = 270.1 + angle2;
	}
}
function colorCube(x)
{
	// console.log(circlePoints1);
	for(var triN = 0; triN < 48; triN++){
		// console.log("TRIN"+ triN);
		var a = circlePoints1[triN];
		if(triN == 47){
			var b = circlePoints1[0];
		}
		else{
			var b = circlePoints1[triN+1];
		}
		var c = circlePoints2[triN];
		var d = circlePoints2[triN];
		if(triN==47){
			var e = circlePoints2[0];
		}
		else{
			var e = circlePoints2[triN+1];
		}
		var f = b;
		var k = 22;
		var z = 23;
		if(x==0){
			// console.log("THIS SHOULD BE HERE");
			triangle(a,b,c,k);
			triangle(d,e,f,z);
			//console.log(a);
		}
		else if(x == 20){
			var di = [0,0,50,0];
			// console.log("FIRST" + a);
			/*a[2] = a[2]+di;
			b[2] = b[2]+di;
			c[2] = c[2]+di;
			d[2] = d[2]+di;
			e[2] = e[2]+di;
			f[2] = f[2]+di;*/
			triangle(add(a,di),add(b,di),add(c,di),k);
			triangle(add(d,di),add(e,di),add(f,di),z);
			// console.log("SECOND " + a);
		}
		
	}
	// console.log(circlePoints1);
}

function configureTexture( image , tex) {
    //tex = gl.createTexture();
    gl.bindTexture( gl.TEXTURE_2D, tex);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
    gl.texImage2D( gl.TEXTURE_2D, 0, gl.RGB,
         gl.RGB, gl.UNSIGNED_BYTE, image );
    gl.generateMipmap( gl.TEXTURE_2D );
    gl.texParameteri( gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER,
                      gl.NEAREST_MIPMAP_LINEAR );
    gl.texParameteri( gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST );

    //gl.uniform1i(gl.getUniformLocation(program, "texture"), 0);
}
function rectangularPrism(length,height,thickness,x,y){
	var d = -5;
	var vo = [
		vec4(-length+x,-height+y,d,1.0),
		vec4(-length+x,height+y,d,1.0),
		vec4(length+x,height+y,d,1.0),
		vec4(length+x,-height+y,d,1.0),
		vec4(-length+x,-height+y,d+thickness,1.0),
		vec4(-length+x,height+y,d+thickness,1.0),
		vec4(length+x,height+y,d+thickness,1.0),
		vec4(length+x,-height+y,d+thickness,1.0),
		]
	quad(vo[1],vo[0],vo[3],vo[2],30);
	quad(vo[2],vo[3],vo[7],vo[6],30);
	quad(vo[3],vo[0],vo[4],vo[7],30);
	quad(vo[6],vo[5],vo[1],vo[2],30);
	quad(vo[4],vo[5],vo[6],vo[7],30);
	quad(vo[5],vo[4],vo[0],vo[1],30);
		
}
function obstacle1(){
	var w = 2;
	var h = 2;
	var thick = .05;
	var z = .2;
	var d = 14;
	var vo = [
		vec4(-w,-thick,d,1.0),
		vec4(-w,thick,d,1.0),
		vec4(w,thick,d,1.0),
		vec4(w,-thick,d,1.0),
		vec4(-w,-thick,d+z,1.0),
		vec4(-w,thick,d+z,1.0),
		vec4(w,thick,d+z,1.0),
		vec4(w,-thick,d+z,1.0),
		
		vec4(-thick,-h,d,1.0),//
		vec4(-thick,h,d,1.0),
		vec4(thick,h,d,1.0),
		vec4(thick,-h,d,1.0),
		vec4(-thick,-h,d+z,1.0),
		vec4(-thick,h,d+z,1.0),
		vec4(thick,h,d+z,1.0),
		vec4(thick,-h,d+z,1.0)
	]
	quad(vo[1],vo[0],vo[3],vo[2],3);
	quad(vo[2],vo[3],vo[7],vo[6],3);
	quad(vo[3],vo[0],vo[4],vo[7],3);
	quad(vo[6],vo[5],vo[1],vo[2],3);
	quad(vo[4],vo[5],vo[6],vo[7],3);
	quad(vo[5],vo[4],vo[0],vo[1],3);
	
	
	quad(vo[9],vo[8],vo[11],vo[10],3);
	quad(vo[10],vo[11],vo[15],vo[14],3);
	quad(vo[11],vo[8],vo[12],vo[15],3);
	quad(vo[14],vo[13],vo[9],vo[10],3);
	quad(vo[12],vo[13],vo[14],vo[15],3);
	quad(vo[13],vo[12],vo[8],vo[9],3);
	
}

function racer(){
	var l = .15;
	var zx = .08;
	var height = .15;
	var offset = -.58;
	var offsetx =0;
	var d = 4;
	var vx = [
        vec4( -l+offsetx, -height+offset,  d, 1.0 ),
        vec4( -l+offsetx,  height+offset,  d, 1.0 ),
        vec4(  l+offsetx,  height+offset,  d, 1.0 ),
        vec4(  l+offsetx, -height+offset,  d, 1.0 ),
        vec4( -l+offsetx, -height+offset, d+zx, 1.0 ),
        vec4( -l+offsetx,  height+offset, d+zx, 1.0 ),
        vec4(  l+offsetx,  height+offset, d+zx, 1.0 ),
        vec4(  l+offsetx, -height+offset, d+zx, 1.0 )
    ];
		quad(vx[1],vx[0],vx[3],vx[2],3);
		quad(vx[2],vx[3],vx[7],vx[6],3);
		quad(vx[3],vx[0],vx[4],vx[7],3);
		quad(vx[6],vx[5],vx[1],vx[2],3);
		quad(vx[4],vx[5],vx[6],vx[7],3);
		quad(vx[5],vx[4],vx[0],vx[1],3);
		//triangle(vx[0],vx[3],[0,-.5+offset, d, 1.0],3);
	
}
/*
function initTextures() {
  cylTexture = gl.createTexture();
  cylImage = new Image();
  cylImage.onload = function() { handleTextureLoaded(cylImage, cylTexture); }
  //cylImage.src = 'TronTexture1.png';
  cylImage.src = 'trontexture2.jpg';
}
function handleTextureLoaded(image, texture) {
  gl.bindTexture(gl.TEXTURE_2D, texture);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_NEAREST);
  gl.generateMipmap(gl.TEXTURE_2D);
  gl.bindTexture(gl.TEXTURE_2D, null);
}*/

function quad(a, b, c, d,col)
{
    //vertex color assigned by the index of the vertex
	triangle(a,b,c,col);
	triangle(a,c,d,col+1);
        // for solid colored faces use
}
function triangle(a, b, c, color) {
	/*
	var vertices = [
        vec4( -l, -l,  l, 1.0 ),
        vec4( -0.0,  0.21,  l, 1.0 ),
        vec4(  0.0,  0.21,  l, 1.0 ),
        vec4(  l, -l,  l, 1.0 ),
        vec4( -l, -l, -l, 1.0 ),
        vec4( -0.0,  0.21, -l, 1.0 ),
        vec4(  0.0,  0.21, -l, 1.0 ),
        vec4(  l, -l, -l, 1.0 )
    ];*/
	
	var vertexColors = [
        [ 0.0, 0.0, 0.0, 1.0 ],  // black
        [ 1.0, 0.0, 0.0, 1.0 ],  // red
        [ 1.0, 1.0, 0.0, 1.0 ],  // yellow
        [ 0.0, 1.0, 0.0, 1.0 ],  // green
        [ 0.0, 0.0, 1.0, 1.0 ],  // blue
        [ 1.0, 0.0, 1.0, 1.0 ],  // magenta
        [ 0.0, 1.0, 1.0, 1.0 ],  // cyan
        [ 1.0, 1.0, 1.0, 1.0 ]   // white
    ];
	 
     points.push(a);
     points.push(b);
     points.push(c);
	 if(color == 20 || color ==22 || color ==23){
		 colors.push(vertexColors[7]);
		 colors.push(vertexColors[7]);
		 colors.push(vertexColors[7]);
	 }
	 else if(color == 30 || color == 31){
		 colors.push(vertexColors[rand]);
		 colors.push(vertexColors[rand]);
		 colors.push(vertexColors[rand]);
	}
	else{
		 colors.push(vertexColors[7]);
		 colors.push(vertexColors[7]);
		 colors.push(vertexColors[7]);
	}
	if(color == 22){
		texCoordsArray.push(texCoord[0]);
		texCoordsArray.push(texCoord[3]);
		texCoordsArray.push(texCoord[1]);
	}
	else if(color == 23){
		texCoordsArray.push(texCoord[1]);
		texCoordsArray.push(texCoord[2]);
		texCoordsArray.push(texCoord[3]);;
	}
	else if (color == 3 || color == 30){
		texCoordsArray.push(texCoord[4]);
		texCoordsArray.push(texCoord[5]);
		texCoordsArray.push(texCoord[6]);
	}
	else if (color == 4 || color == 31){
		texCoordsArray.push(texCoord[4]);
		texCoordsArray.push(texCoord[6]);
		texCoordsArray.push(texCoord[7]);
	}
     // normals are vectors

     normalsArray.push(a[0],a[1], a[2], 0.0);
     normalsArray.push(b[0],b[1], b[2], 0.0);
     normalsArray.push(c[0],c[1], c[2], 0.0);

     //index += 3;

}
var x = 0;
var flag = 0;
var dead = false;
var up = 1;
var obstSpeed = 0;
/*
function weirdRotate(){
	
}*/
function render()
{
    gl.clear( gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
	cylinderTrans = mult(cylinderTrans, translate(0,0,-.1));
	//obstTrans = mult(obstTrans, translate(0,0,-.05));
	obstTheta = mult(obstTheta, rotate(-obstSpeed,[0,0,1]));
	for(var j =0; j< numObst; j++){
		if(j!=3){
			rotateObstaclesTheta(j,obstSpeed);
		}
		else{
			rotateObstaclesTheta(j,up*0.013);
		}
	}
	if(x%50 == 0){
		//obstTheta = mult(racerTheta, rotate(0.0,[0,0,1]));
	}
	//rotateObstaclesTheta(obstTheta);
	//racerTheta = mult(racerTheta, rotate(1,[0,0,1]));
	//var x = 0;
	if(cylinderTrans[2][3] < -25){
		//console.log("WHAT");
		if(flag == 0){
			//console.log("1");
			randObstacle();
			for(var s = 0; s<numObst; s++){
				if(obstState[s]==1){
					//console.log("2");
					obstTrans[s] = mult(obstTrans[s], translate(0,0,40));
					obstState[s] = 2;
				}
			}
		}
		flag = 1;
	}
	var alive = false;
	dead = false;
	for(var a = 0; a<numObst; a++){
		if(obstState[a]==2){
			//console.log("GOOD");
			if(obstTrans[a][2][3] > -5){
				//console.log("WHY");
				obstTrans[a] = mult(obstTrans[a], translate(0,0,-.1));
			}
			else{
				obstState[a]=0;
			}
			if(a==3){
				if(obstTrans[a][1][3]> 0.7){
					up = -1;
				}
				else if(obstTrans[a][1][3]<0){
					up = 1;
				}
				obstTrans[a] = mult(obstTrans[a], translate(0,up*0.013,0));
			}
			if(obstTrans[a][2][3]>= 7.95 && obstTrans[a][2][3] <=8.05){
				//console.log("HELLO");
				for(var k = 0; k<obstaclesTheta[a].length;k=k+2){
					if(obstaclesTheta[a][k]<=obstaclesTheta[a][k+1]){
						if(racerAngle<=obstaclesTheta[a][k+1] && racerAngle>= obstaclesTheta[a][k]){
							console.log(obstaclesTheta[a]);
							console.log(obstaclesTheta[a][k]);
							alive = true;
						}
					}
					else{
						if(racerAngle>=obstaclesTheta[a][k] || racerAngle<= obstaclesTheta[a][k+1]){
							
							console.log(obstaclesTheta[a]);
							console.log(obstaclesTheta[a][k]);
							alive = true;
						}
						
					}
				}
				if(!alive){
					console.log(obstaclesTheta[a]);
					dead = true;
				}
			}
		}
	}
	if(dead){
		console.log("YOUR DEAD");
	}
	x = x+1;
	if(x%100==0){
		obstSpeed += 0.03;
	}
	if(!dead){
		scoreNode.nodeValue = x;
	}
	else{
		alert("You died with a score of: " + scoreNode.nodeValue);
		x = 0;
		obstSpeed = 0;
	}
	if(cylinderTrans[2][3] < -49.9){
		//console.log("EXCUSE ME");
		
		
		randObstacle();
		for(var s = 0; s<numObst; s++){
			if(obstState[s]==1){
				obstTrans[s] = mult(obstTrans[s], translate(0,0,40));
				obstState[s] = 2;
			}
		}
		cylinderTrans = mult(cylinderTrans, translate(0,0,50));
		flag = 0;
	}
	if(obstTrans[2][3] < 0 && obstTrans[2][3] > -1){
		//if(obstTheta)
	}
    //theta[axis] += 1.0;
	//var globMatrixLoc = gl.getUniformLocation(program,"globalRotMatrix");
	var perspectLoc = gl.getUniformLocation(program,"perspect");
	var lookLoc = gl.getUniformLocation(program, "lookat");
	var transLoc = gl.getUniformLocation(program,"translate");
	var rotateLoc = gl.getUniformLocation(program,"rotate");
	gl.uniformMatrix4fv(perspectLoc, false, flatten(persp));
	gl.uniformMatrix4fv(lookLoc, false, flatten(camera));
	gl.uniformMatrix4fv(transLoc,false,flatten(mat4()));
	gl.uniformMatrix4fv(rotateLoc,false,flatten(racerTheta));
	//globTheta = mult(globTheta, rotate(1,[1,0,0]));
	//gl.uniformMatrix4fv(globMatrixLoc, false, flatten(globTheta));
    //gl.uniform3fv(thetaLoc, theta);
	gl.bindTexture( gl.TEXTURE_2D, redTexture);
    gl.drawArrays( gl.TRIANGLES, 0, 36 );
	gl.bindTexture( gl.TEXTURE_2D, tronTexture);
	gl.uniformMatrix4fv(rotateLoc,false,flatten(mat4()));
	gl.uniformMatrix4fv(transLoc,false,flatten(cylinderTrans));
	//gl.drawArrays( gl.TRIANGLES, 36, NumVertices-36 );
	gl.drawArrays( gl.TRIANGLES, 36, 3*4*48);
	
	//gl.bindTexture( gl.TEXTURE_2D, redTexture);
	var vertNumTemp = 36 + 3*4*48;
	for(var po = 0; po < numObst; po++){
		if(po!=3){
			gl.uniformMatrix4fv(rotateLoc,false,flatten(obstTheta));
			gl.uniformMatrix4fv(transLoc,false,flatten(obstTrans[po]));
			gl.drawArrays( gl.TRIANGLES, vertNumTemp, obstVerts[po]);
		}
		else{
			gl.uniformMatrix4fv(rotateLoc,false,flatten(mat4()));
			for(var boop = 0; boop<2; boop++){
				if(boop==0){
					gl.uniformMatrix4fv(transLoc,false,flatten(obstTrans[po]));
					gl.drawArrays( gl.TRIANGLES, vertNumTemp, 36);
				}
				else{
					var dir = obstTrans[po][1][3];
					var newDir = mult(obstTrans[po], translate(0,-2*dir,0));
					gl.uniformMatrix4fv(transLoc,false,flatten(newDir));
					gl.drawArrays( gl.TRIANGLES, vertNumTemp+36, 36);	
				}
			}
		}
		vertNumTemp = vertNumTemp + obstVerts[po];
	}
	//gl.uniformMatrix4fv(rotateLoc,false,flatten(obstTheta));
	//gl.uniformMatrix4fv(transLoc,false,flatten(obstTrans));
	//gl.drawArrays( gl.TRIANGLES, NumVertices-108, 108);

    requestAnimFrame( render );
}
