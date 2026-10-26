import * as THREE from "three";
import Stats from "three/addons/libs/stats.module.js";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { DRACOLoader } from "three/addons/loaders/DRACOLoader.js";
import { KTX2Loader } from "./jsm/loaders/KTX2Loader.js";
import { RGBELoader } from 'three/addons/loaders/RGBELoader.js';
import { EXRLoader } from 'three/addons/loaders/EXRLoader.js';

let renderer, camera, scene, controls, pmremGenerator;
let TurnDis=[];
const Sizes = { Width: window.innerWidth, Height: window.innerHeight };
const targetObjects = [];
const ChessPieces = [];
const Squares=[];
const DiffPieces=[]
let currentIntersects = [];
let HoveredObject = null;
let textureKey, game,links;
let  pointer;
let SocialAlert = 0;
let MainController = true;
let texturesToLoad=0 ,texturesLoaded = 0;
let gamepause=false;
let Blackout=0
let Whiteout=0
let BlackStorage=[];
let WhiteStorage=[];
const Socials=[]

let botMode=0;

function saveOriginalTransform(obj) {
    obj.userData.MainScale = obj.scale.clone();
    obj.userData.MainRotation = obj.rotation.clone();
    obj.userData.MainPosition = obj.position.clone();
  }
function initializeScene() {
  const container = document.getElementById("container");
  scene = new THREE.Scene();
  scene.background = new THREE.Color(0xdfe6ee);
  container.appendChild(renderer.domElement);
  const ambient = new THREE.AmbientLight(0xFFE4B6, 0.5);
  scene.add(ambient);

  const dirLight = new THREE.DirectionalLight(0xFFE4B6, 1); 
  dirLight.position.set(18.130, 15.780, 17.951);
  const isMobile = /Mobi|Android/i.test(navigator.userAgent);
  dirLight.castShadow = !isMobile;
  if (!isMobile) {
    dirLight.shadow.mapSize.width = 512;
    dirLight.shadow.mapSize.height = 512;
  }
  scene.add(dirLight);
}
function initializeCamera() {
  camera = new THREE.PerspectiveCamera(
  45,
    Sizes.Width / Sizes.Height,
    0.02,
    100
  );
  camera.position.set(0,2,-2);
}
function initializeRenderer() {
  if (!renderer) {
    renderer = new THREE.WebGLRenderer({ antialias: true });
  }
  // Detect mobile
  const isMobile = /Mobi|Android/i.test(navigator.userAgent);
  renderer.setPixelRatio(isMobile ? 2.5 : window.devicePixelRatio);
  renderer.setSize(Sizes.Width, Sizes.Height);
  renderer.toneMappingExposure = 2.5;
}


function initializeControls() {
  controls = new OrbitControls(camera, renderer.domElement);
  controls.target.set(0,0,0);
  controls.enableDamping = true;
  controls.minPolarAngle = 0;
  controls.maxPolarAngle = (Math.PI / 2)-0.29;
  controls.minDistance = 0;
  controls.maxDistance = 3.5;
  controls.zoomSpeed = 2;
  controls.enablePan=false
  controls.update();
}
function initializeEnvironment() {
  pmremGenerator = new THREE.PMREMGenerator(renderer);

  new EXRLoader()
    .setPath('assets/') 
    .load('TheHdr.exr', function (texture) {
      const envMap = pmremGenerator.fromEquirectangular(texture).texture;
      scene.environment = envMap;
      //scene.background = envMap; 
      texture.dispose();
      pmremGenerator.dispose();
      
    });
}

function initializeLoaders() {
  textureKey = {
    Floor:"ktx2/Background.ktx2",
    Black:"ktx2/BlackPiece.ktx2",
    Others:"ktx2/Others.ktx2",
    Square:"ktx2/TheSquares.ktx2",
    Tables:"ktx2/TheWoods.ktx2",
    White:"ktx2/WhitePicese.ktx2",
    TheFlowers:"ktx2/SideItemsGrass.ktx2",
    SideItems:"ktx2/NewSideItems.ktx2"
  };

  links = {
    Github: "https://github.com/mrabhin03",
    Insta: "https://www.instagram.com/mr_abhin._",
    Linkedin: "https://www.linkedin.com/in/mr-abhin",
  };
}

function initializeEventListeners() {
  ["mousemove", "touchstart"].forEach((evt) =>
    window.addEventListener(evt, handlePointerMove, { passive: false })
  );

  ["click", "touchend"].forEach((evt) =>
    window.addEventListener(evt, handlePointerClick, { passive: false })
  );

  renderer.domElement.addEventListener(
    "webglcontextlost",
    handleContextLost,
    false
  );
}
function handlePointerMove(e) {
  const x = e.type === "touchstart" ? e.touches[0].clientX : e.clientX;
  const y = e.type === "touchstart" ? e.touches[0].clientY : e.clientY;
  pointer.x = (x / window.innerWidth) * 2 - 1;
  pointer.y = -(y / window.innerHeight) * 2 + 1;
}
let selectedPiece=null;
let canMoveTo=[];

let ques=0;
// const MovesList = [
//   { from: "d2", to: "d4" }, // 1. d4
//   { from: "d7", to: "d5" }, // 1... d5
//   { from: "c2", to: "c4" }, // 2. c4
//   { from: "e7", to: "e6" }, // 2... e6
//   { from: "b1", to: "c3" }, // 3. Nc3
//   { from: "g8", to: "f6" }, // 3... Nf6
//   { from: "c1", to: "d2" }, // 4. Bd2 (freeing queen-side rook and king)
//   { from: "b8", to: "c6" }, // 4... Nc6
//   { from: "d1", to: "c2" }, // 5. Qc2 (preparing castling)
//   { from: "f8", to: "e7" }, // 5... Be7
//   { from: "e1", to: "c1" }  // 6. O-O-O (white queenside castling)
// ];


// function AutoCheck(){
//     MoveTo(MovesList[ques].from,MovesList[ques].to)
//     ques++
// }


async function smallBotMove() {
  if (game.game_over()) {
    alert('Game Over!');
    return;
  }
  const bestMove = await askStockfishMove();
  let out =bestMove[4]
  out=((out)?out:"q")
  console.log("Bot Moved: "+bestMove)
  canMoveTo=[
    {to: bestMove.slice(0, 2)},
    {to: bestMove.slice(2, 4)}
  ]
  highlightMove();
  setTimeout(() => {
    PromotionCheck(bestMove.slice(0, 2), bestMove.slice(2, 4),out);
  }, 700);
}
const engine = new Worker("stockfish/stockfish.js");



function askStockfishMove() {
  return new Promise((resolve) => {
    const fen = game.fen();
    engine.postMessage("position fen " + fen);
    engine.postMessage("go movetime 2000");


    engine.onmessage = function (event) {
      if (typeof event.data === "string" && event.data.startsWith("bestmove")) {
        const best = event.data.split(" ")[1];
        resolve(best); 
      }
    };
  });
}


function TurnDisplay(turn){
  if(turn==-1 || botMode==3){
    TurnDis[0].position.y=TurnDis[0].userData.MainPosition.y;
    TurnDis[1].position.y=TurnDis[1].userData.MainPosition.y;
    return;
  }
  gsap.to(TurnDis[(turn)%2].position, {
    y: TurnDis[(turn)%2].userData.MainPosition.y+0.01,
    duration: .2,
    ease: "power2.inOut"
  });
  gsap.to(TurnDis[(turn+1)%2].position, {
    y: TurnDis[(turn+1)%2].userData.MainPosition.y,
    duration: .2,
    ease: "power2.inOut"
  });
}
function colorCheck(obj,color){
  let Theobj=null
  if(obj.name.includes("shadowPlane")){
    obj=obj.parent;
  }
  if(obj.name.includes("Piece")){
    Theobj=obj
    
  }else if(obj.name.includes("Square")){
    let temp=obj.name.split("_")
    let Post = temp[temp.length - 1];
    Theobj=ChessPieces.find(p => p.userData.NowAt == Post); 
    if(Theobj==null){
      return false
    }
  }
  return Theobj.name.includes(color)
}
function handlePointerClick(e) {
  
  if (e.target.closest("#container")) {
    e.preventDefault();

    if (currentIntersects.length > 0) {
      const obj = (currentIntersects[0].object.name.includes("shadowPlane"))?currentIntersects[0].object.parent:currentIntersects[0].object;
      for (const [key, url] of Object.entries(links)) {
        if (obj.name.includes(key)) {
          const win = window.open();
          win.opener = null;
          win.location = url;
          return
        }
      }

      let currentMover=(game.turn()=='w')?"White":"Black";
      if (game.game_over()) {
        return
      };
      if(gamepause){
        return
      }
      if(obj.name.includes("Square") || obj.name.includes("Piece")){
        if(botMode==3){
          return
        }else if(botMode==1 && (game.turn()=='w')){
          return
        }else if(botMode==2 && (game.turn()=='b')){
          return
        }
      }
      if(selectedPiece && !colorCheck(obj,currentMover)){
        let nextMove=null;
        if (obj.name.includes("Piece")) {
          nextMove=obj.userData.NowAt;
        }else if(obj.name.includes("Square")){
          let temp=obj.name.split("_")
          nextMove = temp[temp.length - 1];
        }
        if (!canMoveTo.some(move => move.to === nextMove)) {
          return;
        }
        PromotionCheck(selectedPiece.userData.NowAt,nextMove)
        return;
      }else{
        clearSelectPiece();
        if (obj.name.includes("Piece")) {
          selectedPiece=obj;
        }else if(obj.name.includes("Square")){
          let temp=obj.name.split("_")
          for(let i=0;i<ChessPieces.length;i++){
            if(temp[temp.length - 1]==ChessPieces[i].userData.NowAt){
              selectedPiece=ChessPieces[i];
              break;
            }
          }
        }

        if(!selectedPiece || !selectedPiece.name.includes(currentMover)){
          return
        }
        gsap.to(selectedPiece.scale, {
            x: 1.3,
            y: 1.3,
            z: 1.3,
            duration: 0.2,
            ease: "power4",
        });
        ShadowAnimation(selectedPiece,1,{r:1,g:1,b:1},1.1,0.5,0)
        
        canMoveTo = game.moves({ square: selectedPiece.userData.NowAt, verbose: true });
        highlightMove()
        return;
      }
    }
    else{
        clearSelectPiece()
      }
  }
}

function savePromotion(from,to,pro){
  const promosObj=document.getElementById("promosion")
  promosObj.classList.remove("promot")
  promosObj.innerHTML=``
  PromotionCheck(from,to,pro)
}

function PromotionCheck(from,to,pro){
  if(pro){
    return MoveTo(from,to,pro);
  }
  let piece = game.get(from);
  let promoPiece='q';
  if (piece && piece.type === "p" && ((piece.color === "w" && to[1] === "8") ||(piece.color === "b" && to[1] === "1"))) {
      const promosObj=document.getElementById("promosion")
      promosObj.classList.add("promot")
      promosObj.innerHTML=`
        <button onclick="savePromotion('${from}','${to}','q')">♕ Queen</button>
        <button onclick="savePromotion('${from}','${to}','r')">♖ Rook</button>
        <button onclick="savePromotion('${from}','${to}','b')">♗ Bishop</button>
        <button onclick="savePromotion('${from}','${to}','n')">♘ Knight</button>`;
    return;
  }
  return MoveTo(from,to,promoPiece);
}
function highlightMove(){
  for(let j=0;j<canMoveTo.length;j++){
    let ele=canMoveTo[j]
    gsap.to(Squares[ele.to].position, {
      y: Squares[ele.to].userData.MainPosition.y+0.01,
      duration: .3,
      ease: "power4",
    });
    if (Squares[ele.to].isMesh && Squares[ele.to].material && Squares[ele.to].material.color) {
      Squares[ele.to].material.color.set(0x00ff00);
      document.body.style.cursor = "pointer";
    }
    const piece = ChessPieces.find(p => p.userData.NowAt == ele.to); 
    if (piece) {
      if(piece.userData.color==((game.turn()=='w')?"White":"Black")){
        Squares[ele.to].material.color.set(0x1313ca);
      }else{
        Squares[ele.to].material.color.set(0xca1313);
      }
      
      gsap.to(piece.position, {
        y: piece.userData.MainPosition.y+0.01,
        duration: .3,
        ease: "power4",
      });
    }
  }
}

function RemovehighlightMove(){
  canMoveTo.forEach((ele)=>{
    gsap.to(Squares[ele.to].position, {
      y: Squares[ele.to].userData.MainPosition.y,
      duration: .3,
      ease: "power4",
  });
    if (Squares[ele.to].isMesh && Squares[ele.to].material && Squares[ele.to].material.color && Squares[ele.to].userData.originalColor) {
      Squares[ele.to].material.color.copy(Squares[ele.to].userData.originalColor);
      document.body.style.cursor = "default";
    }
    const piece = ChessPieces.find(p => p.userData.NowAt == ele.to); 
    if (piece) {
      gsap.to(piece.position, {
        y: piece.userData.MainPosition.y,
        duration: .3,
        ease: "power4",
      });
    }
  })
}
function clearSelectPiece(){
  if(selectedPiece){
    gsap.to(selectedPiece.scale, {
        x: 1,
        y: 1,
        z: 1,
        duration: 0.2,
        ease: "power4",
    });
    ShadowAnimation(selectedPiece,1,{r:0,g:0,b:0},-1,0.5,0)

    selectedPiece=null;
  }
  RemovehighlightMove()
  canMoveTo=[];
}
function ShadowAnimation(obj,opacity,color,scale,duration,delay){
  const shadow = obj.getObjectByName("shadowPlane", true);
  if (shadow && shadow.material.uniforms) {
    if(scale>=0){
      gsap.to(shadow.scale, {
        x:scale,
        y:scale,
        duration: duration,
        delay:delay
      });
    }else{
      gsap.to(shadow.scale, {
        x:1,
        y:1,
        duration: duration,
        delay:delay
      });
    }
    gsap.to(shadow.material.uniforms.uOpacity, {
      value: opacity, 
      duration: duration,
      delay:delay
    });

    const colorObj = { 
      r: shadow.material.uniforms.uColor.value.r, 
      g: shadow.material.uniforms.uColor.value.g, 
      b: shadow.material.uniforms.uColor.value.b 
    };

    gsap.to(colorObj, {
      r: color.r, g: color.g, b: color.b,
      duration: duration,
      delay:delay,
      onUpdate: () => {
        shadow.material.uniforms.uColor.value.setRGB(colorObj.r, colorObj.g, colorObj.b);
      }
    });
  }
}


function MoveAnimation(PieceToMove,fromSquare,ToSquare,delay,jump){
    const fromWorld = new THREE.Vector3();
    const toWorld   = new THREE.Vector3();

    fromSquare.getWorldPosition(fromWorld);
    ToSquare.getWorldPosition(toWorld);

    let distance = fromWorld.distanceTo(toWorld);
    const baseSpeed = 4;
    
    if(distance>0.3){
      distance=0.3
    }
    if(distance<0.15){
      distance=.15;
    }
    const duration = distance *baseSpeed;
    if(jump){

      gsap.to(PieceToMove.position, {
        x: ToSquare.userData.MainPosition.x,
        z: ToSquare.userData.MainPosition.z,
        duration: duration,
        delay: delay,
        ease: "power2.inOut"
      });

      gsap.to(PieceToMove.position, {
        y: ToSquare.userData.MainPosition.y + 0.06,
        duration: duration/2,
        delay: delay+.1,
        yoyo: true,
        repeat: 1,
        ease: "power1.out"
      });

    }else{
      ShadowAnimation(PieceToMove,0,{r:0,g:0,b:0},0,0,0)
      ShadowAnimation(PieceToMove,1,{r:0,g:0,b:0},1.01,duration,delay)
      

      gsap.to(PieceToMove.position, {
          x: ToSquare.userData.MainPosition.x,
          z: ToSquare.userData.MainPosition.z,
          duration: duration,
          delay:delay,
          ease: "power4",
      });
      gsap.to(PieceToMove.position, {
        y: ToSquare.userData.MainPosition.y + 0.02,
        duration: duration/3.5,
        yoyo: true,
        repeat: 1,
        ease: "power1"
      });
    }
    return duration;
}



function MoveTo(from,To,promoPiece){
  if(gamepause){
    return
  }
  gamepause=true;
  
  
  let PieceToMove=null,ToSquare=Squares[To];
  for(let i=0;i<ChessPieces.length;i++){
    if(from==ChessPieces[i].userData.NowAt){
      PieceToMove=ChessPieces[i];
      break;
    }
  }
  if(PieceToMove && ToSquare){
    clearSelectPiece();
    let move = game.move({ from: from, to: To, promotion: (promoPiece)?promoPiece:"q" });
    if(move==null){
      console.log("Move Failed")
      botChecker()
      gamepause=false
      return
    }

    let delay=CapturePiece(To)?.1:0;
    PieceToMove.userData.NowAt=To
    const duration=MoveAnimation(PieceToMove,Squares[from],ToSquare,delay,(PieceToMove.name.includes("Knight")))
    if(move.flags.includes("k")||move.flags.includes("q")){
      let fromPoint=null,toPoint=null;
      if(move.flags.includes("k")){
        fromPoint=(move.color=='w')?"h1":"h8";
        toPoint=(move.color=='w')?"f1":"f8";
      }else{
        fromPoint=(move.color=='w')?"a1":"a8";
        toPoint=(move.color=='w')?"d1":"d8";
      }
      if(toPoint && fromPoint){
        for(let i=0;i<ChessPieces.length;i++){
          if(ChessPieces[i].userData.NowAt==fromPoint){
            ChessPieces[i].userData.NowAt=toPoint;
            MoveAnimation(ChessPieces[i],Squares[fromPoint],Squares[toPoint],delay,true)
            break
          }
        }
      }
    }
    
    if(move.promotion){
      let thecolor=(move.color=='w')?"White":"Black";
      const newPiece=(move.promotion=="n")?"Kn":move.promotion.toUpperCase();
      const result = Object.keys(DiffPieces).find(key => key.startsWith((thecolor+"_"+newPiece)));
      if(result){
        const queenClone = duplicatePiece(DiffPieces[result]);
        queenClone.position.copy(ToSquare.userData.MainPosition);
        ChessPieces.push(queenClone);
        targetObjects.push(queenClone);
        queenClone.userData.NowAt=To
        saveOriginalTransform(queenClone)
        gsap.to(queenClone.scale, {
          x: 0,
          y: 0,
          z: 0,
          duration: 0.0,
          ease: "back.inOut",
        });
        gsap.to(queenClone.scale, {
          x: 1,
          y: 1,
          z: 1,
          delay: delay+duration-0.2,
          duration: 0.5,
          ease: "back.inOut",
        });
      }
    
      
      gsap.to(PieceToMove.scale, {
        x: 0,
        y: 0,
        z: 0,
        delay: delay+duration-0.2,
        duration: 0.5,
        ease: "back.inOut",
      });
      
      removePiece(PieceToMove,(delay+duration+0.2)*900)
        
    }
    if(!game.game_over()){
      setTimeout(()=>{
        TurnDisplay((game.turn()=='w')?0:1)
        gamepause=false;
        botChecker()
      },(delay+duration+0.2)*600)
    }else{
      TurnDisplay(-1)
    }
  }else{
    gamepause=false
  }
  if (game.game_over()) {
    setTimeout(()=>{
      if(game.in_checkmate()){
        let Winner=(game.turn()=='w')?"Black":"White";
        alert(Winner+" won the match")
      }else{
        alert("Its a draw")
      }
      document.getElementById("celebrate").classList.add("active")
    },1000)
    
    return;
  }
  
  isCheck()
  
}

function botChecker(){
  if(botMode==3){
    setTimeout(smallBotMove,500)
  }else if(botMode==1 && (game.turn()=='w')){
    setTimeout(smallBotMove,500)
  }else if(botMode==2 && (game.turn()=='b')){
    setTimeout(smallBotMove,500)
  }
}
function WinnerShowCase(){
  if (!game.game_over()) {
    return
  }
  document.getElementById("celebrate").classList.remove("active")
  if(game.in_checkmate()){
    let Winner=(game.turn()=='w')?"Black":"White";
    ChessPieces.forEach((ele)=>{
      if(!ele.name.includes(Winner)){
        gsap.to(ele.scale, {
            x: 0,
            y: 0,
            z: 0,
            duration: 0.7,
            ease: "back.inOut",
          });
        removePiece(ele,800)
      }
    })
    setTimeout(()=>{
      SingleWinner(ChessPieces,Squares)
    },1000)
  }else{
    drawShowCase(ChessPieces,Squares)
  }
}
function SingleWinner(WinnerPieces, Squares) {
  if (WinnerPieces.length === 0) return;

  WinnerPieces.forEach((ele)=>{
    gsap.to(ele.position, {
      x: ele.userData.MainPosition.x,
      y: ele.userData.MainPosition.y,
      z: ele.userData.MainPosition.z,
      duration: 1,
      ease: "back.inOut",
    });
  })
  const king = WinnerPieces.find(p => p.userData.Name === "King");
  
  const center = new THREE.Vector3()
      .addVectors(Squares['d4'].position, Squares['e5'].position)
      .multiplyScalar(0.5);
  if (king) {
    

    gsap.to(king.position, {
      x: center.x,
      y: center.y,
      z: center.z,
      duration: 1,
      ease: "back.inOut",
    });
  }

  const others = WinnerPieces.filter(p => p !== king);
  const radius = 0.15; 
  const step = (Math.PI * 2) / others.length;

  others.forEach((piece, i) => {
    if(piece.Color==king.Color){
      const angle = i * step;
      gsap.to(piece.position, {
        x: center.x + Math.cos(angle) * radius,
        y: center.y,
        z: center.z + Math.sin(angle) * radius,
        duration: 1,
        delay:.6,
        ease: "back.inOut",
      });
      setTimeout(()=>{
        let angle = i * step;       

        gsap.to({}, {
          duration: 5,       
          repeat: -1,       
          ease: "linear",
          onUpdate: function() {
            angle += 0.02;   
            piece.position.x = center.x + Math.cos(angle) * radius;
            piece.position.z = center.z + Math.sin(angle) * radius;
            piece.position.y = center.y;
          }
        });
      },1500)
    }
  });
  gsap.to(king.rotation, {
    y: "+=" + Math.PI * 2, 
    duration: 1,
    repeat: -1,            
    ease: "linear"          
  });
  gsap.to(king.position, {
    y: king.userData.MainPosition.y+0.03, 
    duration: 2,
    yoyo:true,
    repeat: -1,            
    ease: "ease.inOut"          
  });
}

function drawShowCase(WinnerPieces, Squares) {
  if (WinnerPieces.length === 0) return;

  WinnerPieces.forEach((ele)=>{
    gsap.to(ele.position, {
      x: ele.userData.MainPosition.x,
      y: ele.userData.MainPosition.y,
      z: ele.userData.MainPosition.z,
      duration: 1,
      ease: "back.inOut",
    });
  })
  const king1 = WinnerPieces.find(p => p.name.includes("White-Piece_King"));
  const king2 = WinnerPieces.find(p => p.name.includes("Black-Piece_King"));
  
  const center = new THREE.Vector3()
      .addVectors(Squares['d4'].position, Squares['e5'].position)
      .multiplyScalar(0.5);
  const posA1 = Squares['d4'].position.clone();
  const posA2 = Squares['d5'].position.clone();
  const center1 = new THREE.Vector3().addVectors(posA1, posA2).multiplyScalar(0.5);

  const posB1 = Squares['e4'].position.clone();
  const posB2 = Squares['e5'].position.clone();
  const center2 = new THREE.Vector3().addVectors(posB1, posB2).multiplyScalar(0.5);
  if (king1) {
  gsap.to(king1.position, {
      x: center1.x,
      y: center1.y,
      z: center1.z,
      duration: 1,
      ease: "back.inOut",
    });
  }
  if (king2) {
    gsap.to(king2.position, {
      x: center2.x,
      y: center2.y,
      z: center2.z,
      duration: 1,
      ease: "back.inOut",
    });
  }

  let others = WinnerPieces.filter(p => p !== king1);
  others = others.filter(p => p !== king2);
  const radius = 0.18; 
  const step = (Math.PI * 2) / others.length;

  others.forEach((piece, i) => {
      const angle = i * step;
      gsap.to(piece.position, {
        x: center.x + Math.cos(angle) * radius,
        y: center.y,
        z: center.z + Math.sin(angle) * radius,
        duration: 1,
        delay:.6,
        ease: "back.inOut",
      });
      setTimeout(()=>{
        let angle = i * step;       

        gsap.to({}, {
          duration: 5,       
          repeat: -1,       
          ease: "linear",
          onUpdate: function() {
            angle += 0.02;   
            piece.position.x = center.x + Math.cos(angle) * radius;
            piece.position.z = center.z + Math.sin(angle) * radius;
            piece.position.y = center.y;
          }
        });
      },1500)
  });

  gsap.to(king1.rotation, {
    y: "+=" + Math.PI * 2, 
    duration: 1,
    repeat: -1,            
    ease: "linear"          
  });
  gsap.to(king1.position, {
    y: king1.userData.MainPosition.y+0.03, 
    duration: 2,
    yoyo:true,
    repeat: -1,            
    ease: "ease.inOut"          
  });
  gsap.to(king2.rotation, {
    y: "+=" + Math.PI * 2, 
    duration: 1,
    repeat: -1,            
    ease: "linear"          
  });
  gsap.to(king2.position, {
    y: king1.userData.MainPosition.y+0.03, 
    duration: 2,
    yoyo:true,
    repeat: -1,            
    ease: "ease.inOut"          
  });
}

let checkKing=null
let CheckMove=[]
function isCheck(){
  CheckMove.forEach((ele)=>{
    Squares[ele].material.color.copy(Squares[ele].userData.originalColor);
  })
  if(checkKing){
    checkKing.material.emissive.set(0x000000);
    checkKing.material.emissiveIntensity = 0;
    checkKing=null;
    CheckMove=[]
  }
  if(game.in_check()){
    let currentMover=(game.turn()=='w')?"White":"Black";
    for(let i=0;i<ChessPieces.length;i++){
      if(ChessPieces[i].name.includes("King")&&ChessPieces[i].userData.color==currentMover){
        ChessPieces[i].material.emissive.set(0xff1313);
        ChessPieces[i].material.emissiveIntensity = .5;
        checkKing=ChessPieces[i];
      }
    }
    const allMoves = game.moves({ verbose: true });
    CheckMove = [...new Set(allMoves.map(move => move.from))];
    CheckMove.forEach((ele)=>{
      Squares[ele].material.color.set(0xFFFF00);
    })
    console.log(currentMover+" is on check.")
  }
}

function duplicatePiece(original) {
  original.updateMatrixWorld(true);
  const copy = original.clone(true);
  copy.traverse(child => {
    if (child.isMesh) {
      child.material = Array.isArray(child.material)
        ? child.material.map(m => m.clone())
        : child.material.clone();
    }
  });
  try { 
    copy.userData = JSON.parse(JSON.stringify(original.userData)); 
  } catch { 
    copy.userData = { ...original.userData }; 
  }
  const parent = original.parent;
  parent.add(copy);
  copy.position.copy(original.position);
  copy.quaternion.copy(original.quaternion);
  copy.scale.copy(original.scale);
  return copy;
}


function CapturePiece(Square){
  for(let i=0;i<ChessPieces.length;i++){
    if(Square==ChessPieces[i].userData.NowAt){
      
      gsap.to(ChessPieces[i].scale, {
        x: 0,
        y: 0,
        z: 0,
        duration: 0.5,
        ease: "back.inOut",
      });
      removePiece(ChessPieces[i],500)
      return true
    }
  }
  return false;
}
function removePiece(theObj,delay){
  
  const index = targetObjects.indexOf(theObj);
  if (index !== -1) targetObjects.splice(index, 1);
  let newPosition=null
  if(theObj.userData.color=="Black"){
    if(BlackStorage.length<=Blackout){
      if(WhiteStorage.length<=Whiteout){
        theObj.parent.remove(theObj);
      }else{
        Whiteout++;
        newPosition=WhiteStorage[Whiteout];
      }
    }else{
      Blackout++
      newPosition=BlackStorage[Blackout];
    }
  }else{
    if(WhiteStorage.length<=Whiteout){
        if(BlackStorage.length<=Blackout){
          theObj.parent.remove(theObj);
        }else{
          Blackout++
          newPosition=BlackStorage[Blackout];
        }
    }else{
      Whiteout++;
      newPosition=WhiteStorage[Whiteout];
    }
  }
  
  // theObj.position.copy(ToSquare.userData.MainPosition);
  setTimeout(()=>{
    if(newPosition){
      theObj.position.copy(newPosition.position);
    }
    gsap.to(theObj.scale, {
        x: 1,
        y: 1,
        z: 1,
        duration: 0.5,
        ease: "back.inOut",
      });
    // theObj.parent.remove(theObj);
    ChessPieces.splice(ChessPieces.indexOf(theObj), 1);
  },delay)
}

function handleContextLost(event) {
  event.preventDefault();
  clearScene();
  window.location.reload();
}

function handleResize() {
  Sizes.Width = window.innerWidth;
  Sizes.Height = window.innerHeight;
  camera.aspect = Sizes.Width / Sizes.Height;
  camera.updateProjectionMatrix();
  renderer.setSize(Sizes.Width, Sizes.Height);
}

function clearScene() {
  if (renderer) {
    renderer.dispose();
    renderer.forceContextLoss();
    renderer.domElement = null;
  }

  if (scene) {
    scene.traverse((object) => {
      if (!object.isMesh) return;
      object.geometry.dispose();
      if (object.material.isMaterial) {
        cleanMaterial(object.material);
      } else {
        for (const material of object.material) cleanMaterial(material);
      }
    });
  }
}

function cleanMaterial(material) {
  material.dispose();
  for (const key in material) {
    const value = material[key];
    if (value && typeof value === "object" && "minFilter" in value) {
      value.dispose();
    }
  }
}




function initializeChess(){
  game = new Chess();
}
function removeLegacyTableObjects(model) {
  const legacyObjects = [];
  const legacyName = /chronometer|^(?:others\s*)?(?:white\s*)?cube(?:\b|$)/i;

  model.traverse((child) => {
    if (legacyName.test(child.name)) legacyObjects.push(child);
  });

  legacyObjects.forEach((child) => {
    if (child.parent) child.parent.remove(child);
    child.traverse((part) => {
      if (part.geometry) part.geometry.dispose();
      if (!part.material) return;
      if (Array.isArray(part.material)) {
        part.material.forEach(cleanMaterial);
      } else {
        cleanMaterial(part.material);
      }
    });
  });
}
function load3D() {
  initializeCamera();
  initializeRenderer();
  initializeScene();
  initializeControls();
  initializeEnvironment();
  initializeLoaders();
  initializeEventListeners();
  initializeChess()
  pointer = new THREE.Vector2();
  const Sizes = { Width: window.innerWidth, Height: window.innerHeight };

  window.addEventListener("resize", handleResize);
  window.addEventListener("beforeunload", clearScene);

  

  const manager = new THREE.LoadingManager();
  const tex = new THREE.TextureLoader(manager);

  const dracoLoader = new DRACOLoader().setDecoderPath("jsm/libs/draco/gltf/");
  const loader = new GLTFLoader(manager).setDRACOLoader(dracoLoader);

  const raycaster = new THREE.Raycaster();
  const stats = new Stats();

  const ktx2Loader = new KTX2Loader()
    .setTranscoderPath("jsm/libs/basis/")
    .detectSupport(renderer);

    loader.load(
      "assets/ChessGLB.glb",
      (gltf) => {
        const model = gltf.scene;
        model.position.set(0, -1, 0);
        removeLegacyTableObjects(model);
        scene.add(model);
        model.traverse((child) => {
          if (!child.isMesh) return;
          for (const key of Object.keys(textureKey)) {
            if (child.name.includes(key)) {
              texturesToLoad++;
              break;
            }
          }
        });
    
        model.traverse((child) => {
          if (!child.isMesh) return;
          for (const [key, path] of Object.entries(textureKey)) {
            if (child.name.includes(key)) {
              ktx2Loader.load(path, (tex) => {
                tex.encoding = THREE.sRGBEncoding;
                tex.minFilter = THREE.LinearMipmapLinearFilter;
                tex.magFilter = THREE.LinearFilter;
                // if(child.name.includes("SideItems_Walls")){
                //   child.scale.y+=.6
                //   child.position.y+=1
                // }
                if(child.name.includes("Floor") || child.name.includes("Tables_Side")){
                  child.material = new THREE.MeshStandardMaterial({
                    color: 0xffffff,
                    map: tex,      
                    clearcoat:0
                  });
                }
                else if(child.name.includes("Piece") || child.name.includes("Square")){
                  child.material = new THREE.MeshStandardMaterial({
                    color: 0xffffff,
                    map: tex,  
                    roughness:(child.name.includes("Square"))?1:0,
                    metalness:(child.name.includes("Square"))?0:.4,      
                    clearcoat:1
                  });
                  // child.material = new THREE.MeshPhysicalMaterial({
                  //   color: 0xffffff,
                  //   map: tex,  
                  //   roughness:(child.name.includes("Square"))?.5:0,
                  //   metalness:(child.name.includes("Square"))?.5:1,      
                  //   clearcoat:1
                  // });
                }else if(child.name.includes("obj")||child.name.includes("Leg")||  child.name.includes("Chair")||child.name.includes("Outer_Frame")){
                  child.material = new THREE.MeshStandardMaterial({
                    color: 0xffffff,
                    map: tex,  
                    roughness:(child.name.includes("Chair")||child.name.includes("Leg"))?.7:.05,
                    metalness:.0,      
                    clearcoat:0.05
                  });
                }else if(child.name.includes("Github")||child.name.includes("Insta")||  child.name.includes("Linkedin")){
                  Socials.push(child)
                  child.material = new THREE.MeshStandardMaterial({
                    color: 0xffffff,
                    map: tex,  
                    roughness:.3,
                    metalness:0,      
                    clearcoat:1
                  });
                  targetObjects.push(child);
                  saveOriginalTransform(child);
                }
                else{
                  child.material = new THREE.MeshStandardMaterial({
                    color: 0xffffff,
                    map: tex,  
                    roughness:1,
                  });
                }

              
                if (child.geometry) {
                  child.geometry.computeVertexNormals();
                }

                texturesLoaded++;
                if (texturesLoaded === texturesToLoad) {
                  renderer.compile(scene, camera);
                  renderer.setAnimationLoop(animate);
                }
              });
              break;
            }
          }


          if(child.name.includes("BTurn") || child.name.includes("WTurn")){
            child.material = child.material.clone();
            child.material.color.set(0xefefef);
            TurnDis[(child.name.includes("WTurn"))?0:1]=child;
            saveOriginalTransform(child);
          }
          if(child.name.includes("ChessBack")){
            child.material = child.material.clone(); 
            child.material.color.set(0x000000);
          }else 
          if(child.name.includes('Piece')){
            
            saveOriginalTransform(child);
            ChessPieces.push(child)
            targetObjects.push(child)
            let testvar=child.name.split("_")
            child.userData.NowAt=testvar[testvar.length-1];
            child.userData.color=testvar[0].split("-")[0];
            child.userData.Name=testvar[1]
            if(!(DiffPieces[testvar[0].split("-")[0]+"_"+testvar[1]])){
              DiffPieces[testvar[0].split("-")[0]+"_"+testvar[1]]=child;
            }
            child.userData.originalColor = child.material.color.clone();
            const shadowMaterial = new THREE.ShaderMaterial({
              transparent: true,
              uniforms: {
                uOpacity: { value: 1 },
                uColor: { value: new THREE.Color(0x000000) }
              },
              vertexShader: `
                varying vec2 vUv;
                void main() {
                  vUv = uv;
                  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
                }
              `,
              fragmentShader: `
                varying vec2 vUv;
                uniform float uOpacity;
                uniform vec3 uColor;
                void main() {
                  float dist = distance(vUv, vec2(0.5));
                  float alpha = smoothstep(0.5, 0.0, dist); // feather
                  gl_FragColor = vec4(uColor, alpha * uOpacity);
                }
              `
            });

            const shadowPlane = new THREE.Mesh(
              new THREE.PlaneGeometry(.047, .047),
              shadowMaterial
            );
            shadowPlane.rotation.x = -Math.PI / 2;
            shadowPlane.position.y = 0.001;
            shadowPlane.name = "shadowPlane";

            child.add(shadowPlane);

          }else if(child.name.includes("Square")){
            let key=child.name.split("_")[1];
            Squares[key]=child;
            saveOriginalTransform(child);
            targetObjects.push(child);
            if (child.isMesh && child.material) {
              child.material = child.material.clone();
              child.userData.originalColor = child.material.color.clone();
            }
          }else if(child.name.includes("BStorage")){
            let index=parseInt(child.name.split("e")[1])
            BlackStorage[index]=child
          }else if(child.name.includes("WStorage")){
            let index=parseInt(child.name.split("e")[1])
            WhiteStorage[index]=child;
          }else if(child.name.includes("Flower")||child.name.includes("vaze")){
            targetObjects.push(child);
            saveOriginalTransform(child);
          }
          
        });
        buildSupermarket(model);
        // setTimeout(makeBotMove, 1000);
        setTimeout(()=>{TurnDisplay(0)}, 1000);
        if (texturesToLoad === 0) {
          renderer.compile(scene, camera);
          renderer.setAnimationLoop(animate);
          
        }
      },
      undefined,
      console.error
    );
    


  let Hoverings = false;

  function playHoverAnimation(obj, isPlaying) {
    if(obj.name.includes("Tables")){
      LogoAnimatio(obj, isPlaying)
    }else{
      otherAnimations(obj, isPlaying)
    }
  }
  function LogoAnimatio(obj, isPlaying){
    const dur=.8
    gsap.to(obj.position, {
      y: obj.userData.MainPosition.y+((isPlaying)?0.01:0),
      duration: dur,
      ease: "power4",
    });
    gsap.to(obj.scale, {
      y: (isPlaying)?3:1,
      duration: dur,
      ease: "power4",
    });
  }
  function otherAnimations(obj, isPlaying){
    const dur=.8
      gsap.to(obj.scale, {
        y: (isPlaying)?1.2:1,
        z: (isPlaying)?1.2:1,
        x: (isPlaying)?1.2:1,
        duration: dur,
        ease: "power4",
      });
  }


  let loadStart = false;
  function animate() {
    
    if (!loadStart) {
      if (SocialAlert > 30) {
        Start3DPage();
        loadStart = true;
      }
      SocialAlert++
    } else {
      
      if (MainController) {
        raycaster.setFromCamera(pointer, camera);
        currentIntersects = raycaster.intersectObjects(targetObjects);
        if (currentIntersects.length > 0) {
          const selected = currentIntersects[0].object;
          if (
            ["Linkedin", "Insta",  "Github","Others"].some(
              (k) => selected.name.includes(k)
            )
          ) {
            if (HoveredObject !== selected) {
              if (HoveredObject) playHoverAnimation(HoveredObject, false);
              playHoverAnimation(selected, true);
              HoveredObject = selected;
            }
          }
          document.body.style.cursor = (selected.name.includes("Github")||selected.name.includes("Insta")||  selected.name.includes("Linkedin")||  selected.name.includes("Piece"))
            ? "pointer"
            : "default";
        } else {
          if (HoveredObject) playHoverAnimation(HoveredObject, false);
          HoveredObject = null;
          document.body.style.cursor = "default";
        }
      }
      controls.update();
    }
    stats.update();
    renderer.render(scene, camera);
  }
  
}


function buildSupermarket(model){
  const W=4.2,TIER=.62,DEP=.45,NT=4,PI=Math.PI,TH=-PI/2,   // TH = giro de 90° do jogo (horário, visto de cima)
        SOCIAL=/Github|Insta|Linkedin/,
        HIDE=/Floor|Chair|Leg|SideItems|Flower|vaze|Wall/i,
        SKIP=/Piece|Square|Turn|Storage|ChessBack|Outer_Frame|shadow|Github|Insta|Linkedin/;
  const V=(x,y,z)=>new THREE.Vector3(x,y,z),NQ=()=>new THREE.Quaternion();
  // model.traverse(o=>o.isMesh&&console.log(o.name)); // descomente p/ ver os nomes dos meshes
  model.updateMatrixWorld(true);

  // ---------- helpers e materiais ----------
  const tx=k=>{const t=new THREE.CanvasTexture(k);t.anisotropy=8;
    if(THREE.SRGBColorSpace)t.colorSpace=THREE.SRGBColorSpace;else t.encoding=THREE.sRGBEncoding;return t;};
  const cvs=(w,h,fn)=>{const k=document.createElement("canvas");k.width=w;k.height=h;fn(k.getContext("2d"),w,h);return tx(k);};
  const M=(col,r=.5,m=0)=>new THREE.MeshStandardMaterial({color:col,roughness:r,metalness:m});
  const B=(w,h,d,mat,x,y,z,p=scene)=>{const m=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),mat);m.position.set(x,y,z);p.add(m);return m;};
  const Cl=(a,b,h,mat,y,p,n=16)=>{const m=new THREE.Mesh(new THREE.CylinderGeometry(a,b,h,n),mat);m.position.y=y;p.add(m);return m;};
  const white=M(0xf4f6f8,.25),dark=M(0x2b2f35,.6),lam=M(0x9ba3ab,.45,.1),steel=M(0xb9c0c7,.3,.8),org=M(0xf47b20,.45);
  scene.add(new THREE.HemisphereLight(0xffffff,0xc9d3dc,.6));

  // ---------- 1) esconde o cenário antigo e mede o tabuleiro ----------
  const sq=new THREE.Box3(),fl=new THREE.Box3();
  model.traverse(o=>{
    if(!o.isMesh)return;
    if(/Floor/.test(o.name))fl.expandByObject(o);
    if((/Tables/.test(o.name)&&!SOCIAL.test(o.name))||HIDE.test(o.name)){
      o.visible=false;const i=targetObjects.indexOf(o);if(i>-1)targetObjects.splice(i,1);}
  });
  Object.values(Squares).forEach(s=>sq.expandByObject(s));
  const c=sq.getCenter(V(0,0,0)),bw=sq.getSize(V(0,0,0)).x,ks=bw/.5;

  // ---------- 2) gira tabuleiro + peças 90°: gira o modelo inteiro em torno do centro do tabuleiro
  //            (as posições locais que a lógica do xadrez usa continuam as mesmas) ----------
  const soc=["Github","Insta","Linkedin"].map(k=>{
    const ps=[],bx=new THREE.Box3();
    model.traverse(o=>{if(o.isMesh&&o.name.includes(k)){ps.push({o,p:o.getWorldPosition(V(0,0,0)),r:o.getWorldQuaternion(NQ())});bx.expandByObject(o);}});
    return{ps,ctr:bx.getCenter(V(0,0,0))};});
  const off=V(model.position.x-c.x,0,model.position.z-c.z).applyAxisAngle(V(0,1,0),TH);
  model.position.set(c.x+off.x,model.position.y,c.z+off.z);model.rotation.y+=TH;model.updateMatrixWorld(true);

  // ---------- 3) mede a superfície útil da mesa ----------
  const td=new THREE.Box3(),items=new THREE.Box3();
  TurnDis.forEach(t=>t&&td.expandByObject(t));
  const floorY=fl.isEmpty()?model.position.y:fl.max.y;
  const topY=(td.isEmpty()?sq.min.y:td.min.y)-.002,H=topY-floorY;
  model.traverse(o=>{
    if(!o.isMesh)return;
    if(/Storage|Turn/.test(o.name))items.expandByObject(o);
  });

  // ---------- 4) layout: esteira, PDV, tabuleiro e ícones ----------
  const pdvZ=c.z+bw/2+.33,pz=c.z-bw/2-.16,pdvWidth=.42,pdvDepth=.34;
  soc.forEach(({ps,ctr},i)=>ps.forEach(({o,p,r})=>{      // ícones sociais: fileira reta na frente do tabuleiro, com a orientação original
    const w=V(c.x+(1-i)*.13+p.x-ctr.x,p.y,pz+p.z-ctr.z);o.parent.worldToLocal(w);o.position.copy(w);
    o.quaternion.copy(o.parent.getWorldQuaternion(NQ()).invert().multiply(r));}));
  const fp=sq.clone().union(items)
    .union(new THREE.Box3(V(c.x-.2,topY,pz-.05),V(c.x+.2,topY,pz+.05)))
    .union(new THREE.Box3(V(c.x-pdvWidth/2,topY,pdvZ-pdvDepth/2),V(c.x+pdvWidth/2,topY,pdvZ+pdvDepth/2)));
  const xa=Math.min(fp.min.x,c.x-bw/2-.25)-.08,xb=Math.max(fp.max.x,c.x+bw/2+.25)+.08,L=xb-xa;
  const zlo=Math.min(fp.min.z,pz-.05)-.1,zhi=pdvZ+.12,bd=.3,zmax=zhi+.04+bd+.04,Dp=zmax-zlo;

  // ---------- piso: branco suave puxado p/ bege, pouco brilho ----------
  const ft=cvs(512,512,(g,w,h)=>{
    for(let i=0;i<2;i++)for(let j=0;j<2;j++){const v=Math.random()*8|0;g.fillStyle=`rgb(${222+v},${216+v},${204+v})`;g.fillRect(i*256,j*256,256,256);}
    g.strokeStyle="#b5ad9c";g.lineWidth=5;g.strokeRect(0,0,w,h);g.beginPath();g.moveTo(256,0);g.lineTo(256,h);g.moveTo(0,256);g.lineTo(w,256);g.stroke();});
  ft.wrapS=ft.wrapT=THREE.RepeatWrapping;ft.repeat.set(9,9);
  const fm=M(0xf8f3ea,.6);fm.map=ft;
  const floor=new THREE.Mesh(new THREE.PlaneGeometry(2*W+1,2*W+1),fm);
  floor.rotation.x=-PI/2;floor.position.set(c.x,floorY,c.z);scene.add(floor);
  const bt=cvs(64,64,g=>{const r=g.createRadialGradient(32,32,2,32,32,32);r.addColorStop(0,"rgba(0,0,0,.55)");r.addColorStop(1,"rgba(0,0,0,0)");g.fillStyle=r;g.fillRect(0,0,64,64);});
  const blob=(x,z,w,d)=>{const m=new THREE.Mesh(new THREE.PlaneGeometry(w,d),new THREE.MeshBasicMaterial({map:bt,transparent:true,depthWrite:false}));
    m.rotation.x=-PI/2;m.position.set(x,floorY+.004,z);scene.add(m);};

  // ---------- catálogo em 4 setores (nome,forma,w,h,d,categoria) ----------
  const lathe=pts=>{const g=new THREE.LatheGeometry(pts.map(p=>new THREE.Vector2(p[0],p[1])),16),P=g.attributes.position,U=g.attributes.uv;
    for(let i=0;i<P.count;i++)U.setY(i,P.getY(i));return g.rotateY(PI);};
  const bottle=lathe([[0,0],[.42,0],[.5,.04],[.5,.6],[.44,.7],[.2,.8],[.17,.9],[.19,.92],[.19,1],[0,1]]);
  const can=lathe([[0,0],[.45,0],[.5,.03],[.5,.97],[.45,1],[0,1]]);
  const jar=lathe([[0,0],[.45,0],[.5,.04],[.5,.78],[.44,.8],[.44,1],[0,1]]);
  const spray=lathe([[0,0],[.45,0],[.5,.04],[.5,.58],[.35,.66],[.22,.72],[.22,.86],[.42,.9],[.42,1],[0,1]]);
  const box=new THREE.BoxGeometry(1,1,1).translate(0,.5,0);
  const G=[box,bottle,can,jar,bottle,spray];   // 0 caixa 1 garrafa 2 lata 3 pote 4 galão 5 spray
  const CAT=`COLA,1,.09,.30,.09,0
ÁGUA,1,.08,.28,.08,0
SUCO,1,.09,.27,.09,0
REFRI,1,.10,.31,.10,0
CERVEJA,2,.07,.15,.07,0
ENERG.,2,.065,.17,.065,0
VINHO,1,.08,.32,.08,0
LEITE,0,.09,.24,.07,4
CHÁ,0,.07,.20,.05,0
ISOTÔN.,1,.08,.26,.08,0
ATUM,2,.075,.10,.075,1
SOPA,2,.075,.11,.075,1
MILHO,2,.075,.11,.075,1
ERVILHA,2,.075,.11,.075,1
SARDINHA,2,.07,.05,.07,1
FEIJÃO,2,.085,.12,.085,1
TOMATE,2,.09,.14,.09,1
MOLHO,3,.085,.14,.085,1
PALMITO,3,.075,.19,.075,1
AZEITONA,3,.08,.12,.08,1
GELEIA,3,.08,.11,.08,1
PÊSSEGO,2,.10,.12,.10,1
SABÃO,4,.16,.34,.16,2
DETERG.,4,.07,.24,.07,2
AMACIANTE,4,.14,.30,.14,2
CLORO,4,.13,.30,.13,2
DESINF.,5,.08,.28,.08,2
MULTIUSO,5,.08,.27,.08,2
PAPEL,0,.20,.12,.10,2
ESPONJA,0,.10,.04,.07,2
SHAMPOO,1,.07,.22,.07,2
SABONETE,0,.09,.04,.06,2
LIMPA+,0,.16,.28,.10,2
CEREAL,0,.22,.32,.08,3
ARROZ,0,.17,.26,.08,3
MASSA,0,.12,.26,.05,3
BISC.,0,.20,.14,.06,3
CAFÉ,0,.10,.16,.08,3
AÇÚCAR,0,.12,.20,.08,3
FARINHA,0,.14,.22,.08,3
SAL,0,.10,.16,.07,3
ÓLEO,1,.08,.30,.08,3
AZEITE,1,.07,.27,.07,3
CHOCO,0,.14,.05,.07,3
SNACK,0,.18,.22,.04,3
GRANOLA,0,.16,.24,.06,3
MARGAR.,0,.10,.06,.08,4
QUEIJO,0,.13,.12,.08,4
IOGURTE,3,.09,.12,.08,4
MANTEIGA,3,.12,.08,.08,4
PRESUNTO,0,.14,.11,.07,4
REQUEIJÃO,3,.11,.13,.08,4
CREME,1,.10,.18,.07,4`;
  const T=CAT.split("\n").map((r,i)=>{
    const[n,sh,w,h,d,cat]=r.trim().split(","),hue=i*137.5%360,lat=+sh>0;
    return{cat:+cat,w:+w,h:+h,d:+d,geo:G[+sh],mat:new THREE.MeshStandardMaterial({roughness:.4,map:cvs(128,192,(k,x,y)=>{
      k.fillStyle=`hsl(${hue},55%,${85-(i%3)*12}%)`;k.fillRect(0,0,x,y);
      k.fillStyle=`hsl(${(hue+30)%360},75%,45%)`;
      const est=i%4;
      if(est==0)k.fillRect(0,y*.3,x,y*.38);
      else if(est==1){k.beginPath();k.moveTo(0,y*.25);k.lineTo(x,y*.5);k.lineTo(x,y*.8);k.lineTo(0,y*.55);k.fill();}
      else if(est==2){k.fillRect(0,0,x,y*.28);k.beginPath();k.arc(x/2,y*.66,x*.3,0,7);k.fill();}
      else for(let j=0;j<4;j++)k.fillRect(0,y*(.2+j*.2),x,y*.1);
      if(i%3==0){k.fillStyle=`hsl(${(hue+180)%360},60%,35%)`;k.fillRect(0,0,x,y*.14);}
      if(lat){k.translate(x/2,0);k.scale(.36,1);k.translate(-x/2,0);}
      k.font=`bold ${Math.min(34,Math.floor((lat?320:118)/(n.length*.62)))}px Arial`;k.textAlign="center";
      k.lineWidth=5;k.strokeStyle="rgba(0,0,0,.6)";k.strokeText(n,x/2,y*.58);k.fillStyle="#fff";k.fillText(n,x/2,y*.58);})})};
  });

  // ---------- balcão laranja, tampão cinza e esteira de ponta a ponta ----------
  const g=new THREE.Group();g.position.set((xa+xb)/2,floorY,(zlo+zmax)/2);scene.add(g);
  B(L-.1,.07,Dp-.1,dark,0,.035,0,g);
  B(L-.04,H-.12,Dp-.04,org,0,.07+(H-.12)/2,0,g);
  B(L-.03,.05,Dp-.03,M(0xc95d0c,.5),0,H*.35,0,g);
  B(L-.03,.025,Dp-.03,white,0,H-.1,0,g);
  B(L,.05,Dp,lam,0,H-.025,0,g);
  B(L+.02,.03,Dp+.02,dark,0,H-.06,0,g);
  const bz=zhi+.04+bd/2-g.position.z,bl=L-.06;
  const bt2=cvs(64,64,(k,w,h)=>{k.fillStyle="#23262b";k.fillRect(0,0,w,h);k.fillStyle="#3a3f46";k.fillRect(0,0,6,h);});
  bt2.wrapS=bt2.wrapT=THREE.RepeatWrapping;bt2.repeat.set(bl/.06,1);
  const bm=M(0xffffff,.9);bm.map=bt2;
  B(bl,.012,bd,bm,0,H+.006,bz,g);
  for(const e of[-1,1]){B(bl,.035,.025,steel,0,H+.017,bz+e*(bd/2+.012),g);B(.03,.05,bd+.06,steel,e*bl/2,H+.025,bz,g);}
  T.map((P,i)=>i).filter(i=>T[i].w<=.12).sort(()=>Math.random()-.5).slice(0,6).forEach((k,i)=>{   // exatamente 6 produtos variados
    const P=T[k],m=new THREE.Mesh(P.geo,P.mat),s=ks*.9;
    m.scale.set(P.w*s,P.h*s,P.d*s);m.position.set(-bl/2+.12+i*(bl-.24)/5,H+.012,bz+(Math.random()-.5)*bd*.4);
    m.rotation.y=Math.random()*3;g.add(m);});
  blob(g.position.x,g.position.z,L*1.3,Dp*1.3);

  // ---------- monitor PDV = visor de peças comidas (marca amarela, mais ao fundo, inclinado p/ cima) ----------
  const pdv=new THREE.Group();pdv.position.set(c.x,topY,pdvZ);pdv.scale.setScalar(ks*1.2);scene.add(pdv);
  B(.17,.018,.13,dark,0,.009,0,pdv);B(.035,.1,.03,dark,0,.065,0,pdv);
  const hd=new THREE.Group();hd.position.y=.15;hd.rotation.x=.5;pdv.add(hd);
  B(.28,.19,.03,M(0x111418,.3),0,0,0,hd);
  const sc=document.createElement("canvas");sc.width=384;sc.height=240;
  const sg=sc.getContext("2d"),st=tx(sc),PT={p:1,n:3,b:3,r:5,q:9};let last="";
  const score=()=>{   // só LÊ o histórico do chess.js
    const cap={w:{},b:{}};
    try{game.history({verbose:true}).forEach(m=>{if(m.captured)cap[m.color][m.captured]=(cap[m.color][m.captured]||0)+1;});}catch(e){}
    const key=JSON.stringify(cap);if(key===last)return;last=key;
    const num=o=>Object.values(o).reduce((a,v)=>a+v,0),pts=o=>Object.keys(o).reduce((a,k)=>a+PT[k]*o[k],0);
    sg.fillStyle="#0d2b45";sg.fillRect(0,0,384,240);sg.fillStyle="#00bfa5";sg.fillRect(0,0,384,36);
    sg.textAlign="left";sg.fillStyle="#fff";sg.font="bold 22px Arial";sg.fillText("PDV • PEÇAS COMIDAS",12,26);
    [["BRANCAS",cap.w,"#ffb74d",70,"♟♞♝♜♛"],["PRETAS",cap.b,"#90caf9",150,"♙♘♗♖♕"]].forEach(([n,o,col,y,gl])=>{
      sg.fillStyle="#fff";sg.font="bold 24px Arial";sg.fillText(n+" comeram: "+num(o),12,y);
      sg.fillStyle=col;sg.font="30px 'Segoe UI Symbol',Arial";
      sg.fillText("pnbrq".split("").filter(k=>o[k]).map(k=>gl["pnbrq".indexOf(k)]+"×"+o[k]).join("  ")||"—",12,y+40);});
    const d=pts(cap.w)-pts(cap.b);
    sg.fillStyle="#00e5ff";sg.font="bold 22px Arial";
    sg.fillText(d?"VANTAGEM: "+(d>0?"BRANCAS":"PRETAS")+" +"+Math.abs(d):"PLACAR EMPATADO",12,226);
    st.needsUpdate=true;};
  score();setInterval(score,400);
  const sf=new THREE.Mesh(new THREE.PlaneGeometry(.25,.156),new THREE.MeshBasicMaterial({map:st}));
  sf.position.z=-.0155;sf.rotation.y=PI;hd.add(sf);

  // ---------- cadeiras de operador (giratórias, encosto curvo, braços) ----------
  const stool=(x,z,ry)=>{
    const r=new THREE.Group(),sy=H*.62,blk=M(0x24272c,.7),chr=M(0xcfd4d9,.2,.9),pad=M(0x2d3138,.85),acc=M(0x2e7d6b,.6);
    r.position.set(x,floorY,z);r.rotation.y=ry+(Math.random()-.5)*.4;scene.add(r);
    for(let i=0;i<5;i++){const a=new THREE.Group();a.rotation.y=i*PI*.4;r.add(a);B(.27,.025,.045,blk,.135,.055,0,a);
      const w=new THREE.Mesh(new THREE.CylinderGeometry(.022,.022,.03,10),blk);w.rotation.x=PI/2;w.position.set(.27,.03,0);a.add(w);}
    Cl(.05,.05,.05,chr,.075,r);Cl(.034,.034,sy*.45,blk,.05+sy*.225,r,12);Cl(.02,.02,sy-.1,chr,.05+(sy-.1)/2,r,12);
    const ring=new THREE.Mesh(new THREE.TorusGeometry(.17,.01,6,24),chr);ring.rotation.x=PI/2;ring.position.y=sy*.42;r.add(ring);
    for(let i=0;i<3;i++){const a=new THREE.Group();a.rotation.y=i*PI*2/3;r.add(a);B(.17,.012,.012,chr,.085,sy*.42,0,a);}
    Cl(.17,.15,.03,blk,sy-.03,r,28);Cl(.2,.19,.06,pad,sy+.01,r,28);Cl(.205,.205,.012,acc,sy-.012,r,28);
    const bk=new THREE.Mesh(new THREE.CylinderGeometry(.2,.2,.22,20,1,true,PI-.9,1.8),new THREE.MeshStandardMaterial({color:0x2d3138,roughness:.8,side:THREE.DoubleSide}));
    bk.position.y=sy+.22;r.add(bk);
    const lb=new THREE.Mesh(new THREE.CylinderGeometry(.198,.198,.06,20,1,true,PI-.7,1.4),new THREE.MeshStandardMaterial({color:0x2e7d6b,roughness:.6,side:THREE.DoubleSide}));
    lb.position.y=sy+.2;r.add(lb);
    B(.04,.18,.03,chr,0,sy+.09,-.19,r);
    for(const e of[-1,1]){B(.03,.1,.03,chr,e*.21,sy+.07,-.02,r);B(.055,.025,.2,blk,e*.21,sy+.13,.04,r);}
    blob(x,z,.6,.6);};
  stool(xa-.32,c.z,PI/2);    // lado esquerdo/direito da mesa, de frente p/ o tabuleiro
  stool(xb+.32,c.z,-PI/2);

  // ---------- 4 paredes de gôndolas: 4 andares, 4 fileiras de profundidade ----------
  const shM=M(0xf3f5f7,.4,.2),stM=M(0x8f99a3,.4,.6),bkM=M(0xe3e7eb,.8);
  const lipT=cvs(256,32,(k,w,h)=>{k.fillStyle="#f4f5f7";k.fillRect(0,0,w,h);
    for(let i=0;i<8;i++){k.fillStyle=i%3?"#ffeb3b":"#ef5350";k.fillRect(i*32+4,6,24,20);k.fillStyle="#222";k.fillRect(i*32+8,12,16,3);k.fillRect(i*32+8,18,10,3);}});
  lipT.wrapS=THREE.RepeatWrapping;lipT.repeat.set(8,1);
  const lip=M(0xffffff,.5);lip.map=lipT;
  const HT=.22+NT*TIER+.1,ZR=[.84,.62,.4,.18];
  const inst=T.map(()=>[]),q=new THREE.Quaternion(),eu=new THREE.Euler(),lm=new THREE.Matrix4();
  const wall=(len,x,z,ry,title,col,categories,refrigerated=false)=>{
    const w=new THREE.Group(),pool=T.map((P,i)=>categories.includes(P.cat)?i:-1).filter(i=>i>=0);
    w.position.set(x,floorY,z);w.rotation.y=ry;scene.add(w);w.updateMatrixWorld(true);
    B(len,HT+.3,.04,bkM,0,(HT+.3)/2,-.02,w);B(len,.18,DEP+.06,stM,0,.09,DEP/2,w);B(len,.38,.07,M(col,.5),0,HT,.03,w);
    for(let u=-len/2;u<=len/2+.01;u+=1.2)B(.05,HT+.1,.06,stM,u,(HT+.1)/2,.03,w);
    const sm=new THREE.MeshBasicMaterial({map:cvs(1024,128,(k,a,b)=>{k.fillStyle="#"+col.toString(16).padStart(6,"0");k.fillRect(0,0,a,b);
      k.fillStyle="#fff";k.font="bold 84px Arial";k.textAlign="center";k.fillText(title,a/2,98);})});
    for(const e of[-1,1]){const sp=new THREE.Mesh(new THREE.PlaneGeometry(2.4,.3),sm);sp.position.set(e*len*.25,HT,.07);w.add(sp);}
    if(refrigerated){
      const glass=new THREE.MeshPhysicalMaterial({color:0xd9f5ff,roughness:.12,metalness:.05,transparent:true,opacity:.18,depthWrite:false});
      const frame=M(0x8c9ba5,.3,.65);
      for(let x0=-len/2+.05;x0<len/2-.05;x0+=len/4){
        B(.025,HT-.08,.035,frame,x0,(HT-.08)/2,DEP+.035,w);
        const pane=new THREE.Mesh(new THREE.PlaneGeometry(len/4-.035,HT-.16),glass);
        pane.position.set(x0+len/8,(HT-.08)/2,DEP+.04);w.add(pane);
      }
      B(len,.025,.025,M(0xb9e9f4,.3,.25),0,HT-.1,DEP+.025,w);
    }
    for(let t=0;t<NT;t++){
      const y=.22+t*TIER;B(len,.03,DEP,shM,0,y,DEP/2,w);B(len,.05,.014,lip,0,y+.01,DEP+.007,w);
      for(let row=0;row<4;row++)for(let x0=-len/2+.06;x0<len/2-.12;){
        const k=pool[Math.random()*pool.length|0],P=T[k];
        for(let i=0,n=3+(Math.random()*6|0);i<n&&x0<len/2-.12;i++){
          const sw=P.w*(.97+Math.random()*.06),sh=P.h*(.97+Math.random()*.08),
                ly=Math.min(sh<.08?6:3,Math.floor((TIER-.07)/(sh*1.02)));
          for(let l=0;l<ly;l++){   // empilha itens baixos (latas, caixinhas) p/ ficar mais cheio
            lm.compose(V(x0+sw/2,y+.015+l*sh,DEP*ZR[row]),q.setFromEuler(eu.set(0,(Math.random()-.5)*.12,0)),V(sw,sh,P.d));
            inst[k].push(new THREE.Matrix4().multiplyMatrices(w.matrixWorld,lm));}
          x0+=sw*1.02;}}}
  };
  wall(2*W+.5,c.x,c.z+W,PI,"BEBIDAS",0xc62828,[0]);
  wall(2*W+.5,c.x,c.z-W,0,"MERCEARIA",0xef6c00,[1,3]);
  wall(2*W-.8,c.x+W,c.z,-PI/2,"FRIOS & LATICÍNIOS",0x1565c0,[4],true);
  wall(2*W-.8,c.x-W,c.z,PI/2,"LIMPEZA",0x2e7d32,[2]);
  T.forEach((P,k)=>{if(!inst[k].length)return;const im=new THREE.InstancedMesh(P.geo,P.mat,inst[k].length);
    inst[k].forEach((m,i)=>im.setMatrixAt(i,m));im.computeBoundingSphere();scene.add(im);});
}
function Start3DPage() {
  document.getElementById(
    "LoadInnerText"
  ).innerHTML = `<div><button class="btn" onclick="active()"><i class="animation"></i>Start<i class="animation"></i></button></div>`;
}
function setBotMode(Mode){
  botMode=Mode
  if(Mode==3){
    TurnDisplay(-1)
  }else if(Mode==1){
    camera.position.set(0,2,2);
    Socials.forEach((ele)=>{
      ele.rotation.y+=Math.PI
    })
  }
  setTimeout(botChecker,1000)
}
function ReloadGame(){
  if(confirm("Are u sure you want to restart the game?")){
    window.location.reload()
  }
}
function CameraTop() {
  const targetPosition = new THREE.Vector3(
    0,
    1.3,
    0.001
  );
  gsap.to(camera.position, {
    x: targetPosition.x,
    y: targetPosition.y,
    z: targetPosition.z*((botMode==1)?1:-1),
    duration: 4,
    ease: "power2.inOut",
    onUpdate: () => {
      camera.lookAt(0, 0, 0);
    }
  });
}


window.load3D = load3D;
window.CameraTop = CameraTop;
window.setBotMode = setBotMode;
window.WinnerShowCase=WinnerShowCase
window.savePromotion=savePromotion
window.ReloadGame=ReloadGame
