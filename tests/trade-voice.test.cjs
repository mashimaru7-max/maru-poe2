'use strict';
const assert=require('node:assert/strict'),bind=require('../docs/trade-voice');
function element(value=''){return{value,maxLength:1200,events:{},textContent:'',disabled:false,attrs:{},addEventListener(k,fn){this.events[k]=fn;},setAttribute(k,v){this.attrs[k]=v;}};}
function setup(Recognition){const input=element('에쉴600'),button=element(),status=element();let changes=0;const controller=bind({Recognition,input,button,status,onText(){changes++;input.events.input();},setTimer(){return 1;},clearTimer(){}});return{input,button,status,controller,changes:()=>changes};}
class Speech{constructor(){Speech.last=this;}start(){}stop(){this.onend();}abort(){this.aborted=true;}}
function result(rec,text,isFinal=true){const row=[{transcript:text}];row.isFinal=isFinal;rec.onresult({resultIndex:0,results:[row]});}
let t=setup(undefined);assert.equal(t.button.disabled,true);assert.ok(t.status.textContent.includes('키보드'));
t=setup(Speech);t.button.events.click();assert.equal(Speech.last.lang,'ko-KR');result(Speech.last,'정신력 40',false);assert.equal(t.input.value,'에쉴600');assert.equal(t.changes(),0);result(Speech.last,'정신력 40');result(Speech.last,'정신력 40');Speech.last.onend();assert.equal(t.input.value,'에쉴600 정신력 40');assert.equal(t.changes(),1);assert.equal(t.button.attrs['aria-pressed'],'false');
t=setup(Speech);t.button.events.click();result(Speech.last,'정신력40');t.input.value='마나100';t.input.events.input();Speech.last.onend();assert.equal(t.input.value,'마나100');assert.equal(t.changes(),0);
t=setup(Speech);t.button.events.click();Speech.last.onerror({error:'not-allowed'});assert.ok(t.status.textContent.includes('권한'));assert.equal(t.input.value,'에쉴600');assert.equal(t.button.attrs['aria-pressed'],'false');
t=setup(Speech);t.button.events.click();const old=Speech.last;result(old,'정신력40');t.controller.cancel();old.onend();assert.equal(t.changes(),0);assert.ok(old.aborted);
t=setup(Speech);t.input.maxLength=6;t.button.events.click();result(Speech.last,'정신력40');Speech.last.onend();assert.equal(t.changes(),0);assert.ok(t.status.textContent.includes('글자 수'));
t=setup(class{start(){throw Error('unavailable');}});t.button.events.click();assert.equal(t.button.attrs['aria-pressed'],'false');assert.ok(t.status.textContent.includes('시작하지'));
console.log('PASS voice fallback, interim isolation, final append/deduplication, concurrent edit, denied permission, cancel, length guard and start failure');
