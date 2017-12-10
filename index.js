//console.log(process);str.replace(/[^-]*/.exec(str),'').replace(/-/,'').trim().replace(/\S*/,'').trim()
const rimraf = require('rimraf');
const fs = require('fs');
const child_process = require('child_process');
console.log(process.title);

console.log('hola');

function getArgs(){
  let params = process.title;
  params =params.replace(/[^-]*/,'').replace(/-/,'').trim().replace(/\S*/,'').trim();
  params = params.split(/\s/);
  let comillasDetected=false;
  for(let index in params){
    if(!comillasDetected){
      console.log(params[index],/^("|').*("|')$/.test(params[index]));
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
  child_process.exec('rm -r ./frames',(error,stdout,stderr)=>{
    child_process.exec('mkdir frames',(error, stdout, stderr)=>{
      if(error)console.log(error);
      else
      {
        console.log('se creo directorio ./frames');
        let result = child_process.spawn('ffmpeg',['-y','-i',objResult.path,'-ss',objResult.start,'-t',objResult.end,'-async','1','-strict','-2','./cut.mp4']);
          result.stdout.on('close',code =>{
            console.log('se creo el video ./cut.mp4');
            child_process.exec('ffmpeg -y -i ./cut.mp4 -vf scale=480:-1:flags=lanczos,fps=10 ./frames/ffout%03d.png',(error, stdout, stderr)=>{
            if(error)console.log(error);
            else{  console.log('se crearon los frames en ./frames/ffout...');
              child_process.exec('convert -loop 0 frames/ffout*.png output.gif',(error, stdout, stderr)=>{
                console.log('el GIF fue creado con exito, se llama ./output.gif');

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
let result = getArgs();
objResult={},
objModel={
  '-p':'path',
  '-s':'start',
  '-e':'end'
};
child_process.exec(`ffprobe -i ${result['-p']} -show_entries format=duration -v quiet -of csv="p=0"`,(error, stdout, stderr)=>{
  if(stdout){
    for(let key in result){
      switch (key) {
        case '-p':
          objResult['path']=result[key];
          break;
        case '-s':
          objResult['start']=formatTimeHMS(result[key]);
          break;
        case '-e':
          objResult['end']=formatTimeHMS(result[key]);
          break;
      }
    }
    let startTimeInSec = calculeTimeInSec(result['-s']),
    endTimeInSec = calculeTimeInSec(result['-e']),
    difStartEndTimeInSec = endTimeInSec - startTimeInSec,
    videoDuration = parseInt(stdout);
    objResult['end']=difStartEndTimeInSec;
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


//console.log(objResult);
//ffmpeg -i prueba.mp4 -ss 00:00:03 -t 00:00:08 -async 1 -strict -2 cut.mp4
