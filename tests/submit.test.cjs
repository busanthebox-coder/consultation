const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');
const html=fs.readFileSync(path.join(__dirname,'../index.html'),'utf8');
const functionSource=html.slice(html.indexOf('async function submitForm()'),html.lastIndexOf('</script>'));
const measurementSource=fs.readFileSync(path.join(__dirname,'../../thebox/assets/measurement.js'),'utf8');
async function scenario({body='{"status":"success"}',httpOk=true,consent=true,honeypot=false,duplicate=false}={}) {
  const events=[], elements=new Map(), handlers={};let requests=0;
  const document={referrer:'',title:'THEBOX',addEventListener(n,f){handlers[n]=f;},dispatchEvent(){},
    getElementById(id){if(!elements.has(id))elements.set(id,{style:{},checked:id==='consent-agree'&&consent,disabled:false,getBoundingClientRect(){return {top:0};}});return elements.get(id);},
    querySelector(){return null;},querySelectorAll(){return []}};
  const window={dataLayer:[],THEBOX_MEASUREMENT_CONFIG:{allowedCampaigns:[]},scrollTo(){},pageYOffset:0};
  const context={document,window,URL,URLSearchParams,Date,Number,location:new URL('https://busanthebox-coder.github.io/consultation/'),
    sessionStorage:{getItem(){return null;},setItem(){}},CustomEvent:class {},
    SCRIPT_URL:'https://example.invalid/mock-only',SUCCESS_MODE:'light',renderSuccessBox(){},
    v(id){return id==='hp-website'&&honeypot?'bot':'';},setTimeout(){},
    async fetch(){requests++;await new Promise(r=>setImmediate(r));return {ok:httpOk,status:httpOk?200:500,async text(){return body;}};}};
  vm.createContext(context);vm.runInContext(measurementSource,context);
  window.THEBOXMeasurement.track=name=>events.push(name);
  vm.runInContext(functionSource,context);
  if(duplicate)await Promise.all([context.submitForm(),context.submitForm()]);else await context.submitForm();
  return {events,requests,button:document.getElementById('submit-btn'),error:document.getElementById('err-4')};
}
(async()=>{
  let r=await scenario();assert.deepEqual(r.events,['consultation_submit','consultation_success']);
  r=await scenario({body:'{"status":"error"}'});assert.deepEqual(r.events,['consultation_submit','consultation_error']);assert.equal(r.button.disabled,false);
  r=await scenario({httpOk:false});assert.deepEqual(r.events,['consultation_submit','consultation_error']);
  r=await scenario({body:'OK'});assert.deepEqual(r.events,['consultation_submit','consultation_response_unverified']);
  r=await scenario({consent:false});assert.equal(r.requests,0);assert.deepEqual(r.events,[]);
  r=await scenario({honeypot:true});assert.equal(r.requests,0);assert.deepEqual(r.events,[]);
  r=await scenario({duplicate:true});assert.equal(r.requests,1);assert.deepEqual(r.events,['consultation_submit','consultation_success']);
  console.log('PASS 7 mocked submission scenarios: explicit success, application error, HTTP error, unverified response, consent, honeypot, duplicate submit; no production submissions');
})().catch(e=>{console.error(e);process.exitCode=1;});
