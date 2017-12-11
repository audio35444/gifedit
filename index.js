//console.log(process);str.replace(/[^-]*/.exec(str),'').replace(/-/,'').trim().replace(/\S*/,'').trim()
const rimraf = require('rimraf');
const fs = require('fs');
const path = require('path');
const clearScreen = ()=>console.log("\u001b[2J\u001b[0;0H");
const child_process = require('child_process');
const chalk = require('chalk');
//console.log(process.title);

//console.log('hola');

function getArgs(){
  let params = process.title;
  params =params.replace(/[^-]*/,'').replace(/-/,'').trim().replace(/\S*/,'').trim();
  params = params.split(/\s/);
  let comillasDetected=false;
  for(let index in params){
    if(!comillasDetected){
      //console.log(params[index],/^("|').*("|')$/.test(params[index]));
      if(/^("|').*("|')$/.test(params[index])){
        comillasDetected=false;
        params[index]=params[index].replace(/(\'|\")]/g,'')
      }
      else if(/(\'|\")/.test(params[index])){
        comillasDetected = index;
        params[comillasDetected]=params[comillasDetected].replace(/(\'|\")/g,'');
      }
    }else {
      if(/(\'|\")/.test(params[index])){
        params[comillasDetected]+=' '+params[index].replace(/(\'|\")/g,'');
        params[index]='';
        comillasDetected=false;
      }else {
        params[comillasDetected]+=' '+params[index];
        params[index]='';
      }

    }
  }
  params = params.filter(e=>e!='');
  let objParams ={},
  oldValu='';
  for(let index in params){
    if(/^-/.test(params[index])) objParams[params[index]]=true;
    else if(/^-/.test(oldValu)) objParams[oldValu]=params[index];
    oldValu=params[index];
  }
  return (objParams);
}
function generadorToGif(objResult){
  console.log('entro al generador');
  child_process.exec('rm -r ./frames',(error,stdout,stderr)=>{
    child_process.exec('mkdir frames',(error, stdout, stderr)=>{
      if(error)console.log(error);
      else
      {
        console.log('se creo directorio ./frames');
        let result = child_process.spawn('ffmpeg',['-y','-i',objResult.input,'-ss',objResult.start,'-t',objResult.end,'-async','1','-strict','-2',objResult.outputVideo]);
          result.stdout.on('close',code =>{
            console.log('se creo el video',objResult.outputVideo);
            child_process.exec(`ffmpeg -y -i ${objResult.outputVideo} -vf scale=480:-1:flags=lanczos,fps=10 ./frames/ffout%03d.png`,(error, stdout, stderr)=>{
            if(error)console.log(error);
            else{  console.log('se crearon los frames en ./frames/ffout...');
              child_process.exec(`convert -loop 0 frames/ffout*.png ${objResult.output}`,(error, stdout, stderr)=>{
                console.log('el GIF fue creado con exito, se llama ./output.gif');
                child_process.exec('rm -r ./frames');
            });}
          });
        });
      }
    });
  });
}
function formatTimeHMS(value){
  let arrSec = value.split(':'),
  strResult = '',
  i = 0,
  lengthReverse = 3-arrSec.length,
  lengthNormal = arrSec.length;
  for(i;i<lengthNormal;i++)
    if(arrSec[i].length==1) arrSec[i]='0'+arrSec[i];
  for(i=0;i<lengthReverse;i++) arrSec.unshift('00');
  lengthNormal=arrSec.length;
  for(i=0;i<lengthNormal;i++){
    if(!strResult)strResult=arrSec[i]
    else strResult+=':'+arrSec[i];
  }
  return strResult;
}
//return time in seconds
function calculeTimeInSec(value){
  let arrSec = value.split(':'),
  secAcu = 0,
  i = 0,
  lengthNormal = arrSec.length;
  for(i;i<lengthNormal;i++) {
    secAcu+=(parseInt(arrSec[i])*((i+1==lengthNormal)?1:(Math.pow(60,lengthNormal-(i+1)))));
  }
  return secAcu;
}
//viene el result[key] donde key es -o o -ov
//defaultName solo el nombre sin extension
//extName viene con el . si es .gif o .mp4
function createOutput(fileOrFolder,extName,defaultName='/output'){
  if(fs.existsSync(fileOrFolder) && fs.lstatSync(fileOrFolder).isDirectory()){
      fileOrFolder+=defaultName+extName;
  }else{
    let folder = fileOrFolder.split(/\\|\//),
    sinFile = fileOrFolder.replace(folder[folder.length-1],'');
    if(fs.existsSync(sinFile) && fs.lstatSync(sinFile).isDirectory()){
      if(path.extname(fileOrFolder)!=extName){
        fileOrFolder.replace(path.extname(fileOrFolder),'');
        fileOrFolder+=extName;
      }
    }else {
      console.log('No es un directorio valido');
    }
  }
  return fileOrFolder;
}
let result = getArgs();
objResult={},
objModel={
  '-i':{name:'input',detail:'Archivo mp4 de entrada'},
  '-s':{name:'start',detail:'Tiempo donde comienza la edicion'},
  '-e':{name:'end',detail:'Tiempo donde termina la edicion'},
  '-o':{name:'output',detail:'Archivo de salida del gif'},
  '-ov':{name:'outputVideo',detail:'Archivo de salida del video mp4'},
  '-se':{name:'shortExample',detail:'Ejemplo con los parametros obligatorios',example:'gifedit -i ./myVideo.mp4 -s 1 -e 5'},
  '-fe':{name:'fullExample',detail:'Ejemplo completo con todos los parametros',example:'gifedit -i ./myVideo.mp4 -s 00:00:01 -e 00:00:05 -o ./myGif.gif -ov ./myVideo.mp4'}
};
//console.log(result);
objResult.output = './output.gif';
objResult.outputVideo = './cut.mp4';
if(result['-h']){
  clearScreen();
  console.log(chalk.white.bgBlue.bold('---------------LOS PARAMETROS DEL PROGRAMA SON---------------'));
  for(let key in objModel){
    console.log(chalk.yellow.bgBlack(key+':'),objModel[key].detail);
  }
}else if(result['-se']){
  clearScreen();
  console.log('-se',objModel['-se'].detail+':');
  console.log('-----------------------------------');
  console.log(chalk.yellow.bgBlack(objModel['-se'].example));
  console.log('-----------------------------------');
}else if(result['-fe']){
  clearScreen();
  console.log('-fe',objModel['-fe'].detail+':');
  console.log('-----------------------------------');
  console.log(chalk.yellow.bgBlack(objModel['-fe'].example));
  console.log('-----------------------------------');
}else{
  child_process.exec(`ffprobe -i ${result['-i']} -show_entries format=duration -v quiet -of csv="p=0"`,(error, stdout, stderr)=>{
    if(stdout){
      for(let key in result){
        switch (key) {
          case '-i':
            objResult['input']=result[key];
            break;
          case '-s':
            objResult['start']=formatTimeHMS(result[key]);
            break;
          case '-e':
            objResult['end']=formatTimeHMS(result[key]);
            break;
          case '-o':
          console.log(result);
            objResult['output']=createOutput(result[key],'.gif','/output');
            break;
          case '-ov':
            objResult['outputVideo']=createOutput(result[key],'.mp4','/cut');
            break;
        }
      }
      let startTimeInSec = calculeTimeInSec(result['-s']),
      endTimeInSec = calculeTimeInSec(result['-e']),
      difStartEndTimeInSec = endTimeInSec - startTimeInSec,
      videoDuration = parseInt(stdout);
      objResult['end']=difStartEndTimeInSec;
      console.log('antes de lso if');
      if(difStartEndTimeInSec<=0){
        console.log('El EndTime debe ser mayor al StartTime');
      }else if(videoDuration<startTimeInSec || videoDuration<endTimeInSec){
        console.log(`el video dura ${videoDuration} sec, startTimeInSec dura ${startTimeInSec} sec y endTimeInSec dura ${endTimeInSec} sec`);
      }else{
        //console.log(`el video dura ${videoDuration} sec, startTimeInSec dura ${startTimeInSec} sec y endTimeInSec dura ${endTimeInSec} sec`);
        generadorToGif(objResult);
      }
      console.log('valor seconds',stdout);
    }
  });
}

//console.log(objResult);
//ffmpeg -i prueba.mp4 -ss 00:00:03 -t 00:00:08 -async 1 -strict -2 cut.mp4
